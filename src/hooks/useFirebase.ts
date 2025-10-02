import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  ReservationService, 
  PaymentMethodService, 
  UserProgressService,
  ReservationData,
  PaymentMethodData,
  UserProgressData 
} from '../lib/firebaseService';

export interface UseFirebaseReturn {
  // Auth
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Data operations
  saveReservation: (data: Omit<ReservationData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getReservation: (id: string) => Promise<ReservationData | null>;
  updateReservation: (id: string, data: Partial<ReservationData>) => Promise<void>;
  
  savePaymentMethod: (data: Omit<PaymentMethodData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getPaymentMethodsByItem: (itemKey: string) => Promise<PaymentMethodData[]>;
  updatePaymentMethod: (id: string, data: Partial<PaymentMethodData>) => Promise<void>;
  
  saveUserProgress: (data: Omit<UserProgressData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  getUserProgress: () => Promise<UserProgressData | null>;
  updateUserProgress: (data: Partial<UserProgressData>) => Promise<void>;
}

export const useFirebase = (): UseFirebaseReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auth methods
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  // Data methods
  const saveReservation = useCallback(async (data: Omit<ReservationData, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    return await ReservationService.saveReservation(data);
  }, [user]);

  const getReservation = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    return await ReservationService.getReservation(id);
  }, [user]);

  const updateReservation = useCallback(async (id: string, data: Partial<ReservationData>) => {
    if (!user) throw new Error('User not authenticated');
    return await ReservationService.updateReservation(id, data);
  }, [user]);

  const savePaymentMethod = useCallback(async (data: Omit<PaymentMethodData, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    return await PaymentMethodService.savePaymentMethod(data);
  }, [user]);

  const getPaymentMethodsByItem = useCallback(async (itemKey: string) => {
    if (!user) throw new Error('User not authenticated');
    return await PaymentMethodService.getPaymentMethodsByItem(itemKey);
  }, [user]);

  const updatePaymentMethod = useCallback(async (id: string, data: Partial<PaymentMethodData>) => {
    if (!user) throw new Error('User not authenticated');
    return await PaymentMethodService.updatePaymentMethod(id, data);
  }, [user]);

  const saveUserProgress = useCallback(async (data: Omit<UserProgressData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    await UserProgressService.saveUserProgress(user.uid, data);
  }, [user]);

  const getUserProgress = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return await UserProgressService.getUserProgress(user.uid);
  }, [user]);

  const updateUserProgress = useCallback(async (data: Partial<UserProgressData>) => {
    if (!user) throw new Error('User not authenticated');
    return await UserProgressService.updateUserProgress(user.uid, data);
  }, [user]);

  return {
    // Auth
    user,
    loading,
    signIn,
    signUp,
    logout,
    
    // Data operations
    saveReservation,
    getReservation,
    updateReservation,
    savePaymentMethod,
    getPaymentMethodsByItem,
    updatePaymentMethod,
    saveUserProgress,
    getUserProgress,
    updateUserProgress
  };
};
