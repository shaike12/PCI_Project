import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Reservation, 
  ReservationDocument, 
  ReservationQuery, 
  ReservationListResponse,
  ReservationImportData,
  Passenger
} from '../types/reservation';

export class ReservationService {
  private static collection = 'reservations';

  // Create a new reservation
  static async createReservation(
    reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>,
    userId?: string
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collection), {
        ...reservationData,
        createdBy: userId,
        lastModifiedBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  // Get reservation by ID
  static async getReservationById(id: string): Promise<Reservation | null> {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.convertDocumentToReservation(docSnap);
      }
      return null;
    } catch (error) {
      console.error('Error getting reservation:', error);
      throw error;
    }
  }

  // Get reservation by reservation code
  static async getReservationByCode(reservationCode: string): Promise<Reservation | null> {
    try {
      const q = query(
        collection(db, this.collection), 
        where('reservationCode', '==', reservationCode),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return this.convertDocumentToReservation(doc);
      }
      return null;
    } catch (error) {
      console.error('Error getting reservation by code:', error);
      throw error;
    }
  }

  // Update reservation
  static async updateReservation(
    id: string, 
    data: Partial<Reservation>,
    userId?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collection, id);
      
      // Prepare update data
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      // Only include lastModifiedBy if userId is provided
      if (userId) {
        updateData.lastModifiedBy = userId;
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  }

  // Delete reservation
  static async deleteReservation(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      throw error;
    }
  }

  // List reservations with pagination and filtering
  static async listReservations(
    queryParams: ReservationQuery = {}
  ): Promise<ReservationListResponse> {
    try {
      let q = query(collection(db, this.collection));

      // Apply filters
      if (queryParams.status) {
        q = query(q, where('status', '==', queryParams.status));
      }
      if (queryParams.createdBy) {
        q = query(q, where('createdBy', '==', queryParams.createdBy));
      }
      if (queryParams.dateFrom) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(queryParams.dateFrom)));
      }
      if (queryParams.dateTo) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(queryParams.dateTo)));
      }

      // Apply ordering and pagination
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (queryParams.limit) {
        q = query(q, limit(queryParams.limit));
      }

      const querySnapshot = await getDocs(q);
      const reservations: Reservation[] = [];
      
      querySnapshot.forEach((doc) => {
        reservations.push(this.convertDocumentToReservation(doc));
      });

      return {
        reservations,
        total: reservations.length,
        hasMore: querySnapshot.docs.length === (queryParams.limit || 10),
        nextCursor: querySnapshot.docs[querySnapshot.docs.length - 1]?.id
      };
    } catch (error) {
      console.error('Error listing reservations:', error);
      throw error;
    }
  }

  // Search reservations
  static async searchReservations(searchTerm: string): Promise<Reservation[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation - for production, consider using Algolia or similar
      const q = query(
        collection(db, this.collection),
        where('reservationCode', '>=', searchTerm),
        where('reservationCode', '<=', searchTerm + '\uf8ff'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const reservations: Reservation[] = [];
      
      querySnapshot.forEach((doc) => {
        reservations.push(this.convertDocumentToReservation(doc));
      });

      return reservations;
    } catch (error) {
      console.error('Error searching reservations:', error);
      throw error;
    }
  }

  // Import reservations (bulk)
  static async importReservations(
    reservations: ReservationImportData[],
    userId?: string
  ): Promise<{ success: number; errors: string[] }> {
    const results = { success: 0, errors: [] as string[] };

    for (const reservationData of reservations) {
      try {
        // Generate IDs for passengers
        const passengersWithIds: Passenger[] = reservationData.passengers.map((passenger, index) => ({
          ...passenger,
          id: `${reservationData.reservationCode}-${index + 1}`
        }));

        await this.createReservation({
          ...reservationData,
          passengers: passengersWithIds,
          status: reservationData.status || 'Active'
        }, userId);

        results.success++;
      } catch (error) {
        results.errors.push(`Failed to import reservation ${reservationData.reservationCode}: ${error}`);
      }
    }

    return results;
  }

  // Update passenger status
  static async updatePassengerStatus(
    reservationId: string,
    passengerId: string,
    itemType: 'ticket' | 'seat' | 'bag',
    status: 'Paid' | 'Unpaid',
    userId?: string
  ): Promise<void> {
    try {
      const reservation = await this.getReservationById(reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      const passengerIndex = reservation.passengers.findIndex(p => p.id === passengerId);
      if (passengerIndex === -1) {
        throw new Error('Passenger not found');
      }

      const updatedPassengers = [...reservation.passengers];
      
      if (itemType === 'ticket') {
        updatedPassengers[passengerIndex].ticket.status = status;
      } else if (itemType === 'seat') {
        updatedPassengers[passengerIndex].ancillaries.seat.status = status;
      } else if (itemType === 'bag') {
        updatedPassengers[passengerIndex].ancillaries.bag.status = status;
      }

      await this.updateReservation(reservationId, { passengers: updatedPassengers }, userId);
    } catch (error) {
      console.error('Error updating passenger status:', error);
      throw error;
    }
  }

  // Get reservation statistics
  static async getReservationStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    try {
      const allReservations = await this.listReservations({ limit: 1000 });
      
      const stats = {
        total: allReservations.reservations.length,
        active: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0
      };

      allReservations.reservations.forEach(reservation => {
        stats[reservation.status.toLowerCase() as keyof typeof stats]++;
        if (reservation.status === 'Completed') {
          stats.totalRevenue += reservation.total;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting reservation stats:', error);
      throw error;
    }
  }

  // Helper method to convert Firestore document to Reservation
  private static convertDocumentToReservation(doc: QueryDocumentSnapshot<DocumentData>): Reservation {
    const data = doc.data();
    return {
      id: doc.id,
      reservationCode: data.reservationCode,
      passengers: data.passengers || [],
      total: data.total || 0,
      status: data.status || 'Active',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      createdBy: data.createdBy,
      lastModifiedBy: data.lastModifiedBy,
      metadata: data.metadata
    };
  }
}
