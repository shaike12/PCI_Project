// Script to add sample reservation to Firestore database
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

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
const sampleReservation = {
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
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: "system",
  lastModifiedBy: "system",
  metadata: {
    source: "Script",
    notes: "Sample reservation added via script",
    tags: ["sample", "development"]
  }
};

// Add additional sample reservations
const additionalReservations = [
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "system",
    lastModifiedBy: "system",
    metadata: {
      source: "Script",
      notes: "Premium passenger with partial payment",
      tags: ["premium", "partial-payment"]
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "system",
    lastModifiedBy: "system",
    metadata: {
      source: "Script",
      notes: "Fully paid business class reservation",
      tags: ["business", "completed", "fully-paid"]
    }
  }
];

async function addReservations() {
  try {
    console.log("🚀 Starting to add reservations to Firestore...");
    
    // Add main sample reservation
    console.log("📝 Adding main sample reservation (ABC123)...");
    const docRef1 = await addDoc(collection(db, "reservations"), sampleReservation);
    console.log("✅ Main reservation added with ID:", docRef1.id);
    
    // Add additional reservations
    for (let i = 0; i < additionalReservations.length; i++) {
      const reservation = additionalReservations[i];
      console.log(`📝 Adding reservation ${i + 2} (${reservation.reservationCode})...`);
      const docRef = await addDoc(collection(db, "reservations"), reservation);
      console.log(`✅ Reservation ${reservation.reservationCode} added with ID:`, docRef.id);
    }
    
    console.log("🎉 All reservations added successfully!");
    console.log("\n📋 Summary of added reservations:");
    console.log("1. ABC123 - 2 passengers, $1160, Active");
    console.log("2. XYZ789 - 1 passenger, $865, Active (Premium)");
    console.log("3. DEF456 - 2 passengers, $1390, Completed (Business)");
    
    console.log("\n🔍 You can now test the reservation loader with these codes:");
    console.log("- ABC123 (for testing unpaid items)");
    console.log("- XYZ789 (for testing partial payment)");
    console.log("- DEF456 (for testing completed reservation)");
    
  } catch (error) {
    console.error("❌ Error adding reservations:", error);
  }
}

// Run the script
addReservations().then(() => {
  console.log("\n✨ Script completed!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});
