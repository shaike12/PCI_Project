import { useState, useEffect, useCallback } from 'react';
import { ReservationService } from '../lib/reservationService';
import { 
  Reservation, 
  ReservationQuery, 
  ReservationListResponse,
  ReservationImportData 
} from '../types/reservation';
import { useFirebase } from './useFirebase';

export interface UseReservationsReturn {
  // State
  reservations: Reservation[];
  currentReservation: Reservation | null;
  loading: boolean;
  error: string | null;
  
  // CRUD operations
  createReservation: (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getReservationById: (id: string) => Promise<Reservation | null>;
  getReservationByCode: (code: string) => Promise<Reservation | null>;
  updateReservation: (id: string, data: Partial<Reservation>) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  
  // List and search
  listReservations: (query?: ReservationQuery) => Promise<ReservationListResponse>;
  searchReservations: (searchTerm: string) => Promise<Reservation[]>;
  
  // Bulk operations
  importReservations: (reservations: ReservationImportData[]) => Promise<{ success: number; errors: string[] }>;
  
  // Passenger operations
  updatePassengerStatus: (
    reservationId: string, 
    passengerId: string, 
    itemType: 'ticket' | 'seat' | 'bag', 
    status: 'Paid' | 'Unpaid'
  ) => Promise<void>;
  
  // Statistics
  getStats: () => Promise<{
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  }>;
  
  // Utility
  clearError: () => void;
  setCurrentReservation: (reservation: Reservation | null) => void;
}

export const useReservations = (): UseReservationsReturn => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useFirebase();

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Create reservation
  const createReservation = useCallback(async (
    data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const id = await ReservationService.createReservation(data, user?.uid);
      // Refresh the list
      await listReservations();
      return id;
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Get reservation by ID
  const getReservationById = useCallback(async (id: string): Promise<Reservation | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const reservation = await ReservationService.getReservationById(id);
      setCurrentReservation(reservation);
      return reservation;
    } catch (err: any) {
      setError(err.message || 'Failed to get reservation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get reservation by code
  const getReservationByCode = useCallback(async (code: string): Promise<Reservation | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const reservation = await ReservationService.getReservationByCode(code);
      setCurrentReservation(reservation);
      return reservation;
    } catch (err: any) {
      setError(err.message || 'Failed to get reservation by code');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update reservation
  const updateReservation = useCallback(async (
    id: string, 
    data: Partial<Reservation>
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await ReservationService.updateReservation(id, data, user?.uid);
      // Update local state
      setReservations(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
      if (currentReservation?.id === id) {
        setCurrentReservation(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update reservation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, currentReservation?.id]);

  // Delete reservation
  const deleteReservation = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await ReservationService.deleteReservation(id);
      // Update local state
      setReservations(prev => prev.filter(r => r.id !== id));
      if (currentReservation?.id === id) {
        setCurrentReservation(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete reservation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentReservation?.id]);

  // List reservations
  const listReservations = useCallback(async (query?: ReservationQuery): Promise<ReservationListResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ReservationService.listReservations(query);
      setReservations(response.reservations);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to list reservations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search reservations
  const searchReservations = useCallback(async (searchTerm: string): Promise<Reservation[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await ReservationService.searchReservations(searchTerm);
      setReservations(results);
      return results;
    } catch (err: any) {
      setError(err.message || 'Failed to search reservations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Import reservations
  const importReservations = useCallback(async (
    reservations: ReservationImportData[]
  ): Promise<{ success: number; errors: string[] }> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ReservationService.importReservations(reservations, user?.uid);
      // Refresh the list
      await listReservations();
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to import reservations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, listReservations]);

  // Update passenger status
  const updatePassengerStatus = useCallback(async (
    reservationId: string,
    passengerId: string,
    itemType: 'ticket' | 'seat' | 'bag',
    status: 'Paid' | 'Unpaid'
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await ReservationService.updatePassengerStatus(
        reservationId, 
        passengerId, 
        itemType, 
        status, 
        user?.uid
      );
      // Refresh current reservation
      if (currentReservation?.id === reservationId) {
        await getReservationById(reservationId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update passenger status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, currentReservation?.id, getReservationById]);

  // Get statistics
  const getStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      return await ReservationService.getReservationStats();
    } catch (err: any) {
      setError(err.message || 'Failed to get statistics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (user) {
      listReservations({ limit: 50 });
    }
  }, [user, listReservations]);

  return {
    // State
    reservations,
    currentReservation,
    loading,
    error,
    
    // CRUD operations
    createReservation,
    getReservationById,
    getReservationByCode,
    updateReservation,
    deleteReservation,
    
    // List and search
    listReservations,
    searchReservations,
    
    // Bulk operations
    importReservations,
    
    // Passenger operations
    updatePassengerStatus,
    
    // Statistics
    getStats,
    
    // Utility
    clearError,
    setCurrentReservation
  };
};
