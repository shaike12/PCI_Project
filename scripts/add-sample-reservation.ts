// TypeScript script to add sample reservations to Firestore database
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Reservation } from '../src/types/reservation';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtg70oyZt9Mzi4mB6GLsDEnBBm0NdshtI",
  authDomain: "pci-payment-portal.firebaseapp.com",
  projectId: "pci-payment-portal",
  storageBucket: "pci-payment-portal.firebasestorage.app",
  messagingSenderId: "977200076461",
  appId: "1:977200076461:web:a0cb7ef92ed0010b43d824",
  measurementId: "G-VN0VYX7ZKC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample reservation data based on our existing mock data
const sampleReservations: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    reservationCode: "ABC123",
    passengers: [
      {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        ticket: {
          status: "Unpaid",
          price: 500,
          seatNumber: "12A",
          flightNumber: "AA123"
        },
        ancillaries: {
          seat: {
            status: "Unpaid",
            price: 50,
            seatNumber: "12A",
            seatType: "Standard"
          },
          bag: {
            status: "Unpaid",
            price: 30,
            weight: 23,
            bagType: "Checked"
          }
        }
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+1234567891",
        ticket: {
          status: "Unpaid",
          price: 500,
          seatNumber: "12B",
          flightNumber: "AA123"
        },
        ancillaries: {
          seat: {
            status: "Unpaid",
            price: 50,
            seatNumber: "12B",
            seatType: "Standard"
          },
          bag: {
            status: "Unpaid",
            price: 30,
            weight: 20,
            bagType: "Checked"
          }
        }
      }
    ],
    total: 1160,
    status: "Active",
    createdBy: "system",
    lastModifiedBy: "system",
    metadata: {
      source: "Script",
      notes: "Sample reservation for testing payment portal",
      tags: ["sample", "development", "unpaid"]
    }
  },
  {
    reservationCode: "XYZ789",
    passengers: [
      {
        id: "1",
        name: "Alice Johnson",
        email: "alice@example.com",
        phone: "+1234567892",
        ticket: {
          status: "Paid",
          price: 750,
          seatNumber: "5C",
          flightNumber: "BB456"
        },
        ancillaries: {
          seat: {
            status: "Paid",
            price: 75,
            seatNumber: "5C",
            seatType: "Premium"
          },
          bag: {
            status: "Unpaid",
            price: 40,
            weight: 25,
            bagType: "Checked"
          }
        }
      }
    ],
    total: 865,
    status: "Active",
    createdBy: "system",
    lastModifiedBy: "system",
    metadata: {
      source: "Script",
      notes: "Premium passenger with partial payment - bag unpaid",
      tags: ["premium", "partial-payment", "bag-unpaid"]
    }
  },
  {
    reservationCode: "DEF456",
    passengers: [
      {
        id: "1",
        name: "Bob Wilson",
        email: "bob@example.com",
        phone: "+1234567893",
        ticket: {
          status: "Paid",
          price: 600,
          seatNumber: "8D",
          flightNumber: "CC789"
        },
        ancillaries: {
          seat: {
            status: "Paid",
            price: 60,
            seatNumber: "8D",
            seatType: "Business"
          },
          bag: {
            status: "Paid",
            price: 35,
            weight: 30,
            bagType: "Checked"
          }
        }
      },
      {
        id: "2",
        name: "Carol Davis",
        email: "carol@example.com",
        phone: "+1234567894",
        ticket: {
          status: "Paid",
          price: 600,
          seatNumber: "8E",
          flightNumber: "CC789"
        },
        ancillaries: {
          seat: {
            status: "Paid",
            price: 60,
            seatNumber: "8E",
            seatType: "Business"
          },
          bag: {
            status: "Paid",
            price: 35,
            weight: 28,
            bagType: "Checked"
          }
        }
      }
    ],
    total: 1390,
    status: "Completed",
    createdBy: "system",
    lastModifiedBy: "system",
    metadata: {
      source: "Script",
      notes: "Fully paid business class reservation",
      tags: ["business", "completed", "fully-paid"]
    }
  },
  {
    reservationCode: "GHI012",
    passengers: [
      {
        id: "1",
        name: "David Brown",
        email: "david@example.com",
        phone: "+1234567895",
        ticket: {
          status: "Unpaid",
          price: 400,
          seatNumber: "15F",
          flightNumber: "DD321"
        },
        ancillaries: {
          seat: {
            status: "Unpaid",
            price: 25,
            seatNumber: "15F",
            seatType: "Standard"
          },
          bag: {
            status: "Unpaid",
            price: 20,
            weight: 15,
            bagType: "Carry-on"
          }
        }
      }
    ],
    total: 445,
    status: "Active",
    createdBy: "system",
    lastModifiedBy: "system",
    metadata: {
      source: "Script",
      notes: "Economy passenger with carry-on bag",
      tags: ["economy", "carry-on", "unpaid"]
    }
  }
];

async function addReservations(): Promise<void> {
  try {
    console.log("🚀 Starting to add sample reservations to Firestore...");
    console.log(`📊 Total reservations to add: ${sampleReservations.length}`);
    
    const addedReservations: { code: string; id: string }[] = [];
    
    for (let i = 0; i < sampleReservations.length; i++) {
      const reservation = sampleReservations[i];
      console.log(`\n📝 Adding reservation ${i + 1}/${sampleReservations.length}: ${reservation.reservationCode}`);
      
      const reservationData = {
        ...reservation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "reservations"), reservationData);
      addedReservations.push({ code: reservation.reservationCode, id: docRef.id });
      
      console.log(`✅ ${reservation.reservationCode} added successfully!`);
      console.log(`   - Passengers: ${reservation.passengers.length}`);
      console.log(`   - Total: $${reservation.total}`);
      console.log(`   - Status: ${reservation.status}`);
      console.log(`   - Document ID: ${docRef.id}`);
    }
    
    console.log("\n🎉 All reservations added successfully!");
    console.log("\n📋 Summary of added reservations:");
    addedReservations.forEach((res, index) => {
      const reservation = sampleReservations[index];
      console.log(`${index + 1}. ${res.code} - ${reservation.passengers.length} passenger(s), $${reservation.total}, ${reservation.status}`);
    });
    
    console.log("\n🔍 Test the reservation loader with these codes:");
    console.log("• ABC123 - 2 passengers, all unpaid items");
    console.log("• XYZ789 - 1 passenger, premium with unpaid bag");
    console.log("• DEF456 - 2 passengers, business class, fully paid");
    console.log("• GHI012 - 1 passenger, economy with carry-on");
    
    console.log("\n💡 Usage instructions:");
    console.log("1. Open http://localhost:3000");
    console.log("2. Use the 'Reservation Loader' at the top");
    console.log("3. Enter any of the reservation codes above");
    console.log("4. Test the payment functionality");
    
  } catch (error) {
    console.error("❌ Error adding reservations:", error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  addReservations()
    .then(() => {
      console.log("\n✨ Script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { addReservations };
