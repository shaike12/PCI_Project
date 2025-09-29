export type PaymentBreakdown = {
  credit?: {
    maskedCardNumber?: string;
    expiry?: string;
    cvv?: string;
    amount: number;
  };
  points?: {
    pointsAmount: number;
    awardReference?: string;
    amount: number;
  };
  voucher?: {
    voucherNumber?: string;
    expiry?: string;
    amount: number;
  };
};

export type AncillaryItem = {
  price: number;
  paymentMethods: PaymentBreakdown;
  emdNumber: string;
  status: 'Paid' | 'Pending Payment' | 'Partially Paid';
};

export type PassengerTicket = {
  price: number;
  status: 'Paid' | 'Pending Payment' | 'Partially Paid';
  paymentMethods: PaymentBreakdown;
  ticketNumber: string;
};

export type PassengerReservation = {
  name: string;
  ticket: PassengerTicket;
  ancillaries: {
    seat: AncillaryItem;
    bag: AncillaryItem;
  };
};

export type Reservation = {
  orderNumber: string;
  phone: string;
  email: string;
  currency: 'USD' | 'EUR' | 'ILS';
  totalAmount: number;
  passengers: PassengerReservation[];
  createdAt?: string;
};

export const MOCK_RESERVATION: Reservation = {
  orderNumber: 'ORD-0001',
  phone: '+1-555-123-4567',
  email: 'user@example.com',
  currency: 'USD',
  totalAmount: 5300.0,
  passengers: [
    {
      name: 'John Smith',
      ticket: {
        price: 1800.0,
        status: 'Pending Payment',
        paymentMethods: {
          credit: {
            maskedCardNumber: '411111******1111',
            expiry: '12/27',
            cvv: '123',
            amount: 900.0,
          },
          points: {
            pointsAmount: 3000,
            awardReference: 'AWD-1001',
            amount: 300.0,
          },
          voucher: {
            voucherNumber: 'VCH-5001',
            expiry: '2026-12-31',
            amount: 600.0,
          },
        },
        ticketNumber: '114-1234567890123',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: {
            credit: {
              maskedCardNumber: '411111******1111',
              expiry: '12/27',
              cvv: '123',
              amount: 100.0,
            },
            points: {
              pointsAmount: 0,
              amount: 0.0,
            },
            voucher: {
              amount: 0.0,
            },
          },
          emdNumber: '114-EMD-001',
          status: 'Paid',
        },
        bag: {
          price: 200.0,
          paymentMethods: {
            credit: {
              amount: 0.0,
            },
            points: {
              pointsAmount: 1500,
              awardReference: 'AWD-2002',
              amount: 150.0,
            },
            voucher: {
              amount: 0.0,
            },
          },
          emdNumber: '114-EMD-002',
          status: 'Partially Paid',
        },
      },
    },
    {
      name: 'Sarah Johnson',
      ticket: {
        price: 1800.0,
        status: 'Paid',
        paymentMethods: {
          credit: {
            maskedCardNumber: '522222******2222',
            expiry: '05/28',
            cvv: '456',
            amount: 1800.0,
          },
          points: {
            pointsAmount: 0,
            amount: 0.0,
          },
          voucher: {
            amount: 0.0,
          },
        },
        ticketNumber: '114-9876543210987',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: {
            credit: {
              maskedCardNumber: '522222******2222',
              expiry: '05/28',
              cvv: '456',
              amount: 100.0,
            },
            points: {
              pointsAmount: 0,
              amount: 0.0,
            },
            voucher: {
              amount: 0.0,
            },
          },
          emdNumber: '114-EMD-003',
          status: 'Paid',
        },
        bag: {
          price: 200.0,
          paymentMethods: {
            credit: {
              amount: 0.0,
            },
            points: {
              pointsAmount: 0,
              amount: 0.0,
            },
            voucher: {
              amount: 0.0,
            },
          },
          emdNumber: '114-EMD-004',
          status: 'Pending Payment',
        },
      },
    },
    {
      name: 'Michael Brown',
      ticket: {
        price: 1800.0,
        status: 'Paid',
        paymentMethods: {
          credit: {
            maskedCardNumber: '433333******3333',
            expiry: '08/29',
            cvv: '789',
            amount: 1800.0,
          },
          points: {
            pointsAmount: 0,
            amount: 0.0,
          },
          voucher: {
            amount: 0.0,
          },
        },
        ticketNumber: '114-5555555555555',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: {
            credit: {
              maskedCardNumber: '433333******3333',
              expiry: '08/29',
              cvv: '789',
              amount: 100.0,
            },
            points: {
              pointsAmount: 0,
              amount: 0.0,
            },
            voucher: {
              amount: 0.0,
            },
          },
          emdNumber: '114-EMD-005',
          status: 'Paid',
        },
        bag: {
          price: 200.0,
          paymentMethods: {
            credit: {
              maskedCardNumber: '433333******3333',
              expiry: '08/29',
              cvv: '789',
              amount: 200.0,
            },
            points: {
              pointsAmount: 0,
              amount: 0.0,
            },
            voucher: {
              amount: 0.0,
            },
          },
          emdNumber: '114-EMD-006',
          status: 'Paid',
        },
      },
    },
  ],
};


