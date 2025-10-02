import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Types for Firestore documents
export interface ReservationData {
  id: string;
  passengers: any[];
  total: number;
  createdAt: any;
  updatedAt: any;
}

export interface PaymentMethodData {
  id: string;
  itemKey: string;
  method: 'credit' | 'voucher' | 'points';
  data: any;
  createdAt: any;
  updatedAt: any;
}

export interface UserProgressData {
  id: string;
  userId: string;
  selectedItems: any;
  selectedPassengers: string[];
  activePaymentPassenger: string;
  itemPaymentMethods: any;
  itemMethodForms: any;
  itemExpandedMethod: any;
  createdAt: any;
  updatedAt: any;
}

// Reservation Service
export class ReservationService {
  private static collection = 'reservations';

  static async saveReservation(reservationData: Omit<ReservationData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.collection), {
      ...reservationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async getReservation(id: string): Promise<ReservationData | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ReservationData;
    }
    return null;
  }

  static async updateReservation(id: string, data: Partial<ReservationData>): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  static async deleteReservation(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }
}

// Payment Methods Service
export class PaymentMethodService {
  private static collection = 'paymentMethods';

  static async savePaymentMethod(paymentData: Omit<PaymentMethodData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.collection), {
      ...paymentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async getPaymentMethodsByItem(itemKey: string): Promise<PaymentMethodData[]> {
    const q = query(collection(db, this.collection), where('itemKey', '==', itemKey));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PaymentMethodData[];
  }

  static async updatePaymentMethod(id: string, data: Partial<PaymentMethodData>): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  static async deletePaymentMethod(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }
}

// User Progress Service
export class UserProgressService {
  private static collection = 'userProgress';

  static async saveUserProgress(userId: string, progressData: Omit<UserProgressData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.collection), {
      ...progressData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async getUserProgress(userId: string): Promise<UserProgressData | null> {
    const q = query(collection(db, this.collection), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as UserProgressData;
    }
    return null;
  }

  static async updateUserProgress(userId: string, data: Partial<UserProgressData>): Promise<void> {
    const existingProgress = await this.getUserProgress(userId);
    
    if (existingProgress) {
      const docRef = doc(db, this.collection, existingProgress.id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } else {
      await this.saveUserProgress(userId, data as any);
    }
  }

  static async deleteUserProgress(userId: string): Promise<void> {
    const existingProgress = await this.getUserProgress(userId);
    
    if (existingProgress) {
      const docRef = doc(db, this.collection, existingProgress.id);
      await deleteDoc(docRef);
    }
  }
}
