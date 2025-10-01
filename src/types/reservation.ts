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
    {
      name: 'Emily Davis',
      ticket: {
        price: 1650.0,
        status: 'Partially Paid',
        paymentMethods: {
          credit: { amount: 850.0, maskedCardNumber: '400000******0002', expiry: '11/27', cvv: '321' },
          voucher: { amount: 200.0, voucherNumber: 'VCH-7001', expiry: '2026-01-31' },
          points: { amount: 100.0, pointsAmount: 1000, awardReference: 'AWD-3001' }
        },
        ticketNumber: '114-1111111111111',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: { credit: { amount: 100.0 } },
          emdNumber: '114-EMD-007',
          status: 'Paid',
        },
        bag: {
          price: 200.0,
          paymentMethods: { credit: { amount: 0.0 }, voucher: { amount: 0.0 }, points: { amount: 0.0, pointsAmount: 0 } },
          emdNumber: '114-EMD-008',
          status: 'Pending Payment',
        },
      },
    },
    {
      name: 'Olivia Martinez',
      ticket: {
        price: 1725.0,
        status: 'Pending Payment',
        paymentMethods: { credit: { amount: 0.0 } },
        ticketNumber: '114-2222222222222',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-009',
          status: 'Pending Payment',
        },
        bag: {
          price: 200.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-010',
          status: 'Pending Payment',
        },
      },
    },
    {
      name: 'William Johnson',
      ticket: {
        price: 1900.0,
        status: 'Paid',
        paymentMethods: { credit: { amount: 1900.0, maskedCardNumber: '555555******4444', expiry: '04/30', cvv: '555' } },
        ticketNumber: '114-3333333333333',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-011',
          status: 'Pending Payment',
        },
        bag: {
          price: 200.0,
          paymentMethods: { credit: { amount: 200.0 } },
          emdNumber: '114-EMD-012',
          status: 'Paid',
        },
      },
    },
    {
      name: 'Ava Wilson',
      ticket: {
        price: 1600.0,
        status: 'Partially Paid',
        paymentMethods: { credit: { amount: 800.0 }, voucher: { amount: 200.0, voucherNumber: 'VCH-7101', expiry: '2026-06-30' } },
        ticketNumber: '114-4444444444444',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-013',
          status: 'Pending Payment',
        },
        bag: {
          price: 200.0,
          paymentMethods: { credit: { amount: 0.0 }, points: { amount: 100.0, pointsAmount: 1000 } },
          emdNumber: '114-EMD-014',
          status: 'Partially Paid',
        },
      },
    },
    {
      name: 'James Taylor',
      ticket: {
        price: 2100.0,
        status: 'Paid',
        paymentMethods: { credit: { amount: 2100.0, maskedCardNumber: '401288******1881', expiry: '09/29', cvv: '188' } },
        ticketNumber: '114-6666666666666',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: { credit: { amount: 100.0 } },
          emdNumber: '114-EMD-015',
          status: 'Paid',
        },
        bag: {
          price: 200.0,
          paymentMethods: { credit: { amount: 200.0 } },
          emdNumber: '114-EMD-016',
          status: 'Paid',
        },
      },
    },
    {
      name: 'Isabella Anderson',
      ticket: {
        price: 1550.0,
        status: 'Pending Payment',
        paymentMethods: { credit: { amount: 0.0 } },
        ticketNumber: '114-7777777777777',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-017',
          status: 'Pending Payment',
        },
        bag: {
          price: 200.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-018',
          status: 'Pending Payment',
        },
      },
    },
    {
      name: 'Benjamin Thomas',
      ticket: {
        price: 1850.0,
        status: 'Partially Paid',
        paymentMethods: { credit: { amount: 1000.0 }, points: { amount: 150.0, pointsAmount: 1500 } },
        ticketNumber: '114-8888888888888',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-019',
          status: 'Pending Payment',
        },
        bag: {
          price: 200.0,
          paymentMethods: { credit: { amount: 0.0 }, voucher: { amount: 50.0, voucherNumber: 'VCH-7202', expiry: '2026-03-31' } },
          emdNumber: '114-EMD-020',
          status: 'Partially Paid',
        },
      },
    },
    {
      name: 'Mia Moore',
      ticket: {
        price: 1700.0,
        status: 'Paid',
        paymentMethods: { credit: { amount: 1700.0, maskedCardNumber: '378282******0005', expiry: '01/30', cvv: '1234' } },
        ticketNumber: '114-9999999999999',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: { credit: { amount: 100.0 } },
          emdNumber: '114-EMD-021',
          status: 'Paid',
        },
        bag: {
          price: 200.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-022',
          status: 'Pending Payment',
        },
      },
    },
    {
      name: 'Charlotte Lee',
      ticket: {
        price: 2000.0,
        status: 'Pending Payment',
        paymentMethods: { credit: { amount: 0.0 } },
        ticketNumber: '114-1212121212121',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-023',
          status: 'Pending Payment',
        },
        bag: {
          price: 200.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-024',
          status: 'Pending Payment',
        },
      },
    },
    {
      name: 'Henry Perez',
      ticket: {
        price: 1750.0,
        status: 'Partially Paid',
        paymentMethods: { credit: { amount: 900.0 }, voucher: { amount: 150.0, voucherNumber: 'VCH-7303', expiry: '2027-12-31' } },
        ticketNumber: '114-1313131313131',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-025',
          status: 'Pending Payment',
        },
        bag: {
          price: 200.0,
          paymentMethods: { credit: { amount: 200.0 } },
          emdNumber: '114-EMD-026',
          status: 'Paid',
        },
      },
    },
    {
      name: 'Amelia White',
      ticket: {
        price: 1625.0,
        status: 'Paid',
        paymentMethods: { credit: { amount: 1625.0, maskedCardNumber: '601111******1117', expiry: '07/29', cvv: '777' } },
        ticketNumber: '114-1414141414141',
      },
      ancillaries: {
        seat: {
          price: 100.0,
          paymentMethods: { credit: { amount: 0.0 } },
          emdNumber: '114-EMD-027',
          status: 'Pending Payment',
        },
        bag: {
          price: 200.0,
          paymentMethods: { credit: { amount: 200.0 } },
          emdNumber: '114-EMD-028',
          status: 'Paid',
        },
      },
    },
  ],
};


