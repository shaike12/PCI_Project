// Enhanced reservation types for database storage

export interface Passenger {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  ticket: {
    status: 'Paid' | 'Unpaid';
    price: number;
    seatNumber?: string;
    flightNumber?: string;
    ticketNumber?: string; // Generated when paid: 114-245XXXXXXX
  };
  ancillaries: {
    seat: {
      status: 'Paid' | 'Unpaid';
      price: number;
      seatNumber?: string;
      seatType?: 'Standard' | 'Premium' | 'Business';
      ancillaryNumber?: string; // Generated when paid: 114-8XXXXXXXXX
    };
    bag: {
      status: 'Paid' | 'Unpaid';
      price: number;
      weight?: number;
      bagType?: 'Carry-on' | 'Checked';
      ancillaryNumber?: string; // Generated when paid: 114-8XXXXXXXXX
    };
    secondBag?: {
      status: 'Paid' | 'Unpaid';
      price: number;
      weight?: number;
      bagType?: 'Carry-on' | 'Checked';
      ancillaryNumber?: string; // Generated when paid: 114-8XXXXXXXXX
    };
    thirdBag?: {
      status: 'Paid' | 'Unpaid';
  price: number;
      weight?: number;
      bagType?: 'Carry-on' | 'Checked';
      ancillaryNumber?: string; // Generated when paid: 114-8XXXXXXXXX
    };
    uatp?: {
      status: 'Paid' | 'Unpaid';
  price: number;
      uatpNumber?: string;
      ancillaryNumber?: string; // Generated when paid: 114-8XXXXXXXXX
    };
  };
}

export interface Reservation {
  id: string;
  reservationCode: string;
  invoiceEmail?: string;
  passengers: Passenger[];
  total: number;
  status: 'Active' | 'Completed' | 'Cancelled';
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  createdBy?: string; // User ID who created the reservation
  lastModifiedBy?: string; // User ID who last modified
  metadata?: {
    source?: string; // 'API' | 'Manual' | 'Import'
    notes?: string;
    tags?: string[];
  };
}

// Database collection interfaces
export interface ReservationDocument extends Omit<Reservation, 'createdAt' | 'updatedAt'> {
  createdAt: any;
  updatedAt: any;
}

// Query interfaces
export interface ReservationQuery {
  reservationCode?: string;
  status?: Reservation['status'];
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// Response interfaces
export interface ReservationListResponse {
  reservations: Reservation[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Import/Export interfaces
export interface ReservationImportData {
  reservationCode: string;
  passengers: Omit<Passenger, 'id'>[];
  total: number;
  status?: Reservation['status'];
  metadata?: Reservation['metadata'];
}

export interface ReservationExportData extends Reservation {
  exportDate: Date;
  exportFormat: 'JSON' | 'CSV' | 'PDF';
}

// Mock data for development
export const MOCK_RESERVATION: Reservation = {
  id: 'mock-1',
  reservationCode: 'ABC123',
  passengers: [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      ticket: {
        status: 'Unpaid',
        price: 500,
        seatNumber: '12A',
        flightNumber: 'AA123'
      },
      ancillaries: {
        seat: {
          status: 'Unpaid',
          price: 50,
          seatNumber: '12A',
          seatType: 'Standard'
        },
        bag: {
          status: 'Unpaid',
          price: 30,
          weight: 23,
          bagType: 'Checked'
        },
        secondBag: {
          status: 'Unpaid',
          price: 100,
          weight: 25,
          bagType: 'Checked'
        },
        thirdBag: {
          status: 'Unpaid',
          price: 120,
          weight: 30,
          bagType: 'Checked'
        },
        uatp: {
          status: 'Unpaid',
          price: 200,
          uatpNumber: 'UATP123456'
        }
      }
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567891',
      ticket: {
        status: 'Unpaid',
        price: 500,
        seatNumber: '12B',
        flightNumber: 'AA123'
      },
      ancillaries: {
        seat: {
          status: 'Unpaid',
          price: 50,
          seatNumber: '12B',
          seatType: 'Standard'
        },
        bag: {
          status: 'Unpaid',
          price: 30,
          weight: 20,
          bagType: 'Checked'
        },
        secondBag: {
          status: 'Unpaid',
          price: 100,
          weight: 25,
          bagType: 'Checked'
        },
        thirdBag: {
          status: 'Unpaid',
          price: 120,
          weight: 30,
          bagType: 'Checked'
        },
        uatp: {
          status: 'Unpaid',
          price: 200,
          uatpNumber: 'UATP123456'
        }
      }
    }
  ],
  total: 2000,
  status: 'Active',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
  lastModifiedBy: 'system',
  metadata: {
    source: 'Mock',
    notes: 'Mock reservation for development',
    tags: ['development', 'mock']
  }
};