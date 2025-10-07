'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { useReservations } from '../hooks/useReservations';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Paper,
  Grid,
  Container,
  IconButton,
  Avatar,
  Button,
  Snackbar,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  DeleteForever as DeleteAllIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Flight as FlightIcon,
  EventSeat as SeatIcon,
  Luggage as BagIcon,
  ReceiptLong as ReceiptLongIcon,
  ShoppingCart as ShoppingCartIcon,
  CardMembership as UatpIcon
} from '@mui/icons-material';
import { PassengerHeader } from './components/PassengerHeader';
import PassengerCard from './components/PassengerCard';
import { PaymentMethodsSummary } from './components/PaymentMethodsSummary';
import { TotalSummary } from './components/TotalSummary';
import { ActionButtons } from './components/ActionButtons';
import { MOCK_RESERVATION, Reservation, Passenger } from '@/types/reservation';
import { PaymentTabs } from './components/PaymentTabs';
import { SelectedItemsBreakdown } from './components/SelectedItemsBreakdown';
import { CopyPaymentMethodModal } from './components/CopyPaymentMethodModal';
import { computeSelectedAmount } from './utils/paymentCalculations';
import { generateTicketNumber, generateAncillaryNumber } from './utils/ticketNumberGenerator';
import { 
  isPaymentMethodComplete, 
  getTotalPaidAmount, 
  isItemFullyPaid, 
  removeMethod, 
  confirmAddMethod, 
  updateMethodField 
} from './utils/paymentLogic';
import {
  resolvePassengerIndex as resolvePassengerIndexUtil,
  getPassengerTabLabel as getPassengerTabLabelUtil,
  togglePassenger as togglePassengerUtil,
  toggleExpanded as toggleExpandedUtil,
  toggleItem as toggleItemUtil,
  toggleAllItemsForPassenger as toggleAllItemsForPassengerUtil,
  isItemSelected as isItemSelectedUtil
} from './utils/passengerLogic';
import { clearAllLocalStorage } from './utils/localStorage';




export default function PaymentPortal() {
  // Firebase hooks
  const { user, loading: authLoading, saveUserProgress, getUserProgress, updateUserProgress } = useFirebase();
  const { getReservationByCode, updateReservation, listReservations, deleteReservation, createReservation } = useReservations();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [reservationCode, setReservationCode] = useState('');
  const [newReservationCode, setNewReservationCode] = useState<string | null>(null);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  
  // Copy payment method modal state
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copySourceItemKey, setCopySourceItemKey] = useState<string>('');
  const [copySourceMethod, setCopySourceMethod] = useState<'credit' | 'voucher' | 'points'>('credit');
  
  // Toast state for copy notifications
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Passenger count selection for new reservation
  const [passengerCount, setPassengerCount] = useState(3);

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    try {
      // Convert selectedItems to the correct format
      const selectedItemsList: string[] = [];
      for (const [passengerId, items] of Object.entries(selectedItems)) {
        for (const itemType of items) {
          selectedItemsList.push(`${passengerId}-${itemType}`);
        }
      }
      
      if (selectedItemsList.length === 0) {
        alert('Please select items to pay for');
        return;
      }

      // Check if all selected items are fully paid
      const unpaidItems = selectedItemsList.filter(itemKey => {
        const totalPaid = getTotalPaidAmount(itemKey, itemPaymentMethods);
        const [passengerId, itemType] = itemKey.split('-');
        const passengerIndex = resolvePassengerIndex(passengerId);
        const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
        
        if (!passenger) return true;
        
        let itemPrice = 0;
        if (itemType === 'ticket') {
          itemPrice = passenger.ticket.price;
        } else if (itemType === 'seat') {
          itemPrice = passenger.ancillaries.seat.price;
        } else if (itemType === 'bag') {
          itemPrice = passenger.ancillaries.bag.price;
        } else if (itemType === 'secondBag') {
          itemPrice = passenger.ancillaries.secondBag?.price || 0;
        } else if (itemType === 'thirdBag') {
          itemPrice = passenger.ancillaries.thirdBag?.price || 0;
        } else if (itemType === 'uatp') {
          itemPrice = passenger.ancillaries.uatp?.price || 0;
        }
        
        return totalPaid < itemPrice;
      });

      if (unpaidItems.length > 0) {
        alert(`The following items are not fully paid: ${unpaidItems.join(', ')}`);
        return;
      }

      // Update reservation status to mark items as paid
      if (currentReservation) {
        // Check if this is a mock reservation or copied reservation (not loaded from Firebase)
        if (currentReservation.id === 'mock-1' || currentReservation.id.startsWith('copy-')) {
          alert('Cannot update mock or copied reservation. Please load a real reservation from Firebase first.');
          return;
        }
        
        const updatedReservation = {
          ...currentReservation,
          updatedAt: new Date()
        };
        
        // Remove lastModifiedBy from the object to avoid undefined issues
        delete (updatedReservation as any).lastModifiedBy;
        
        // Ticket number generator is already imported

        // Mark selected items as paid and generate numbers
        selectedItemsList.forEach(itemKey => {
          const [passengerId, itemType] = itemKey.split('-');
          const passengerIndex = resolvePassengerIndex(passengerId);
          
          if (passengerIndex >= 0 && passengerIndex < updatedReservation.passengers.length) {
            const passenger = updatedReservation.passengers[passengerIndex];
            
            if (itemType === 'ticket') {
              passenger.ticket.status = 'Paid';
              // Generate ticket number if not already exists
              if (!passenger.ticket.ticketNumber) {
                passenger.ticket.ticketNumber = generateTicketNumber();
              }
            } else if (itemType === 'seat') {
              passenger.ancillaries.seat.status = 'Paid';
              // Generate ancillary number if not already exists
              if (!passenger.ancillaries.seat.ancillaryNumber) {
                passenger.ancillaries.seat.ancillaryNumber = generateAncillaryNumber();
              }
            } else if (itemType === 'bag') {
              passenger.ancillaries.bag.status = 'Paid';
              // Generate ancillary number if not already exists
              if (!passenger.ancillaries.bag.ancillaryNumber) {
                passenger.ancillaries.bag.ancillaryNumber = generateAncillaryNumber();
              }
            } else if (itemType === 'secondBag') {
              if (!passenger.ancillaries.secondBag) {
                passenger.ancillaries.secondBag = {
                  status: 'Paid',
                  price: 0,
                  weight: 0,
                  bagType: 'Checked'
                };
              } else {
                passenger.ancillaries.secondBag.status = 'Paid';
              }
              // Generate ancillary number if not already exists
              if (!passenger.ancillaries.secondBag.ancillaryNumber) {
                passenger.ancillaries.secondBag.ancillaryNumber = generateAncillaryNumber();
              }
            } else if (itemType === 'thirdBag') {
              if (!passenger.ancillaries.thirdBag) {
                passenger.ancillaries.thirdBag = {
                  status: 'Paid',
                  price: 0,
                  weight: 0,
                  bagType: 'Checked'
                };
              } else {
                passenger.ancillaries.thirdBag.status = 'Paid';
              }
              // Generate ancillary number if not already exists
              if (!passenger.ancillaries.thirdBag.ancillaryNumber) {
                passenger.ancillaries.thirdBag.ancillaryNumber = generateAncillaryNumber();
              }
            } else if (itemType === 'uatp') {
              if (!passenger.ancillaries.uatp) {
                passenger.ancillaries.uatp = {
                  status: 'Paid',
                  price: 0,
                  uatpNumber: ''
                };
              } else {
                passenger.ancillaries.uatp.status = 'Paid';
              }
              // Generate ancillary number if not already exists
              if (!passenger.ancillaries.uatp.ancillaryNumber) {
                passenger.ancillaries.uatp.ancillaryNumber = generateAncillaryNumber();
              }
            }
          }
        });

        // Update reservation in Firebase using the document ID, not reservation code
        // persist invoiceEmail if present
        (updatedReservation as any).invoiceEmail = invoiceEmail;
        await updateReservation(updatedReservation.id, updatedReservation);
        
        setCurrentReservation(updatedReservation);
        
        // Clear selected items and payment methods
        setSelectedItems({});
        setItemPaymentMethods({});
        setItemMethodForms({});
        setItemExpandedMethod({});
        
        alert('Payment confirmed successfully!');
      } else {
        alert('No reservation loaded');
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      alert('Failed to confirm payment. Please try again.');
    }
  };

  // Function to ensure all ancillaries exist in passenger data
  const ensureAncillariesExist = (reservation: Reservation): Reservation => {
    const updatedReservation = { ...reservation };
    
    updatedReservation.passengers = updatedReservation.passengers.map(passenger => {
      const updatedPassenger = { ...passenger };
      
      // Ensure ancillaries object exists
      if (!updatedPassenger.ancillaries) {
        updatedPassenger.ancillaries = {
          seat: { status: 'Unpaid', price: 0 },
          bag: { status: 'Unpaid', price: 0 }
        };
      }
      
      // Add missing ancillaries with default values (only if they don't exist)
      if (!updatedPassenger.ancillaries.secondBag) {
        updatedPassenger.ancillaries.secondBag = {
          status: 'Unpaid',
          price: 100,
          weight: 25,
          bagType: 'Checked'
        };
      }
      
      if (!updatedPassenger.ancillaries.thirdBag) {
        updatedPassenger.ancillaries.thirdBag = {
          status: 'Unpaid',
          price: 120,
          weight: 30,
          bagType: 'Checked'
        };
      }
      
      if (!updatedPassenger.ancillaries.uatp) {
        updatedPassenger.ancillaries.uatp = {
          status: 'Unpaid',
          price: 200,
          uatpNumber: 'UATP123456'
        };
      }
      
      return updatedPassenger;
    });
    
    return updatedReservation;
  };

  // Handle reservation loading
  const handleLoadReservation = async () => {
    if (!reservationCode.trim()) {
      alert('Please enter a reservation code');
      return;
    }

    try {
      const reservation = await getReservationByCode(reservationCode.trim());
      if (reservation) {
        // Ensure all ancillaries exist in the loaded reservation
        const updatedReservation = ensureAncillariesExist(reservation);
        setCurrentReservation(updatedReservation);
        // Pull invoice email if exists
        if ((updatedReservation as any).invoiceEmail) {
          setInvoiceEmail((updatedReservation as any).invoiceEmail as string);
        }
        
        // Clear selections when loading a new reservation
        setSelectedItems({});
        setSelectedPassengers([]);
        setItemPaymentMethods({});
        setItemMethodForms({});
        setItemExpandedMethod({});
        
        // Reload reservations list to make sure it's up to date
        await loadAllReservations();
      } else {
        alert('Reservation not found');
      }
    } catch (error) {
      console.error('Error loading reservation:', error);
      alert('Failed to load reservation');
    }
  };

  const handleCreateNewReservation = async () => {
    if (isCreatingReservation || !mounted) return;
    
    setIsCreatingReservation(true);
    try {
      // Generate random reservation code with 6 alphanumeric characters
      const generateReservationCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      const newCode = generateReservationCode();
      
      // Create new reservation with selected number of passengers
      const createPassenger = (id: number, name: string) => {
        // Random status generator (70% chance for Unpaid, 30% for Paid)
        // But items with price 0 are always Paid
        const getRandomStatus = (price: number = 1) => {
          if (price === 0) return 'Paid' as const;
          return Math.random() < 0.7 ? 'Unpaid' as const : 'Paid' as const;
        };
        
        // Random seat type
        const seatTypes = ['Standard', 'Premium', 'Business'] as const;
        const randomSeatType = seatTypes[Math.floor(Math.random() * seatTypes.length)];
        
        // Random bag type
        const bagTypes = ['Carry-on', 'Checked'] as const;
        const randomBagType = bagTypes[Math.floor(Math.random() * bagTypes.length)];
        
        // Random prices - each passenger gets different combinations
        const ticketPrice = 350 + Math.floor(Math.random() * 200); // 350-550
        
        // Seat - 80% chance to have a seat
        const hasSeat = Math.random() < 0.8;
        const seatPrice = hasSeat ? (randomSeatType === 'Standard' ? 50 : randomSeatType === 'Premium' ? 75 : 100) : 0;
        
        // Bag - 70% chance to have a bag
        const hasBag = Math.random() < 0.7;
        const bagPrice = hasBag ? (randomBagType === 'Carry-on' ? 0 : 60 + Math.floor(Math.random() * 40)) : 0;
        
        // Second Bag - 40% chance
        const hasSecondBag = Math.random() < 0.4;
        const secondBagPrice = hasSecondBag ? 100 + Math.floor(Math.random() * 50) : 0;
        
        // Third Bag - 20% chance
        const hasThirdBag = Math.random() < 0.2;
        const thirdBagPrice = hasThirdBag ? 120 + Math.floor(Math.random() * 30) : 0;
        
        // UATP - 30% chance
        const hasUatp = Math.random() < 0.3;
        const uatpPrice = hasUatp ? 200 + Math.floor(Math.random() * 100) : 0;
        
        // Generate ancillary numbers for paid items
        const generateAncillaryNumber = () => `114-8${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
        
        const seatStatus = getRandomStatus(seatPrice);
        const bagStatus = getRandomStatus(bagPrice);
        
        const ancillaries: any = {};
        
        // Only add seat if passenger has one
        if (hasSeat) {
          ancillaries.seat = {
            status: seatStatus,
            price: seatPrice,
            seatNumber: `${id}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`, // A-F
            seatType: randomSeatType,
            ...(seatStatus === 'Paid' && seatPrice > 0 && { ancillaryNumber: generateAncillaryNumber() })
          };
        }
        
        // Only add bag if passenger has one
        if (hasBag) {
          ancillaries.bag = {
            status: bagStatus,
            price: bagPrice,
            bagType: randomBagType,
            ...(randomBagType === 'Checked' && { weight: 20 + Math.floor(Math.random() * 15) }), // 20-35kg
            ...(bagStatus === 'Paid' && bagPrice > 0 && { ancillaryNumber: generateAncillaryNumber() })
          };
        }
        
        // Add optional ancillaries based on random chance
        if (hasSecondBag) {
          const secondBagStatus = getRandomStatus(secondBagPrice);
          ancillaries.secondBag = {
            status: secondBagStatus,
            price: secondBagPrice,
            weight: 25 + Math.floor(Math.random() * 10), // 25-35kg
            bagType: 'Checked' as const,
            ...(secondBagStatus === 'Paid' && secondBagPrice > 0 && { ancillaryNumber: generateAncillaryNumber() })
          };
        }
        
        if (hasThirdBag) {
          const thirdBagStatus = getRandomStatus(thirdBagPrice);
          ancillaries.thirdBag = {
            status: thirdBagStatus,
            price: thirdBagPrice,
            weight: 30 + Math.floor(Math.random() * 10), // 30-40kg
            bagType: 'Checked' as const,
            ...(thirdBagStatus === 'Paid' && thirdBagPrice > 0 && { ancillaryNumber: generateAncillaryNumber() })
          };
        }
        
        if (hasUatp) {
          const uatpStatus = getRandomStatus(uatpPrice);
          ancillaries.uatp = {
            status: uatpStatus,
            price: uatpPrice,
            uatpNumber: `UATP${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
            ...(uatpStatus === 'Paid' && uatpPrice > 0 && { ancillaryNumber: generateAncillaryNumber() })
          };
        }
        
        const ticketStatus = getRandomStatus(ticketPrice);
        
        return {
          id: id.toString(),
          name,
          ticket: {
            status: ticketStatus,
            price: ticketPrice,
            flightNumber: 'AA123',
            seatNumber: `${id}A`,
            ...(ticketStatus === 'Paid' && ticketPrice > 0 && { ticketNumber: `114-2${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}` })
          },
          ancillaries
        };
      };

      const passengerNames = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson', 'Lisa Anderson', 'Robert Taylor', 'Jennifer Martinez'];
      
      const newReservation: Reservation = {
        id: `new-${Date.now()}`,
        reservationCode: newCode,
        invoiceEmail,
        passengers: Array.from({ length: passengerCount }, (_, i) => 
          createPassenger(i + 1, passengerNames[i] || `Passenger ${i + 1}`)
        ),
        total: 0, // Will be calculated
        status: 'Active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        lastModifiedBy: 'system',
        metadata: {
          source: 'Manual',
          notes: 'New reservation created via portal',
          tags: ['new', 'portal-created']
        }
      };

      // Calculate total
      newReservation.total = newReservation.passengers.reduce((sum, passenger) => {
        let passengerTotal = passenger.ticket.price;
        
        // Add seat price if exists
        if (passenger.ancillaries.seat) {
          passengerTotal += passenger.ancillaries.seat.price;
        }
        
        // Add bag price if exists
        if (passenger.ancillaries.bag) {
          passengerTotal += passenger.ancillaries.bag.price;
        }
        
        // Add second bag price if exists
        if (passenger.ancillaries.secondBag) {
          passengerTotal += passenger.ancillaries.secondBag.price;
        }
        
        // Add third bag price if exists
        if (passenger.ancillaries.thirdBag) {
          passengerTotal += passenger.ancillaries.thirdBag.price;
        }
        
        // Add UATP price if exists
        if (passenger.ancillaries.uatp) {
          passengerTotal += passenger.ancillaries.uatp.price;
        }
        
        return sum + passengerTotal;
      }, 0);

      // Clean data before saving to prevent undefined values
      const cleanedReservation = cleanDataForFirebase(newReservation);

      // Save to database
      const { ReservationService } = await import('../lib/reservationService');
      const newReservationId = await ReservationService.createReservation(cleanedReservation, 'system');
      
      // Get the created reservation with the new ID
      const createdReservation = await ReservationService.getReservationById(newReservationId);
      if (!createdReservation) {
        throw new Error('Failed to retrieve created reservation');
      }
      
      setNewReservationCode(newCode);
      setCurrentReservation(createdReservation);
      setReservationCode(newCode);
      
      
      // Clear selections
      setSelectedPassengers([]);
      setSelectedItems({});
      setItemPaymentMethods({});
      setItemMethodForms({});
      setItemExpandedMethod({});
      setActivePaymentPassenger('');
      
      // Reload reservations list to include the new one
      await loadAllReservations();
      
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to create new reservation');
    } finally {
      setIsCreatingReservation(false);
    }
  };

  // Load all reservations from database
  const loadAllReservations = async () => {
    if (!user) return;
    
    setIsLoadingReservations(true);
    try {
      // Use the existing listReservations function to get all reservations
      const response = await listReservations({ limit: 100 }); // Get up to 100 reservations
      setAllReservations(response.reservations);
    } catch (error) {
      console.error('Error loading reservations:', error);
      setAllReservations([]);
    } finally {
      setIsLoadingReservations(false);
    }
  };

  // Copy selected reservation to current screen
  const handleCopyReservation = async () => {
    if (!selectedReservationCode) {
      alert('Please select a reservation to copy');
      return;
    }
    
    
    const reservationToCopy = allReservations.find(r => r.reservationCode === selectedReservationCode);
    if (!reservationToCopy) {
      alert('Reservation not found in the list');
      return;
    }
    
    
    try {
      // Load the selected reservation to the current screen
      setCurrentReservation(reservationToCopy);
      setReservationCode(selectedReservationCode);
      // Pull invoice email if exists
      if ((reservationToCopy as any).invoiceEmail !== undefined) {
        setInvoiceEmail((reservationToCopy as any).invoiceEmail || '');
      }
      setNewReservationCode(null); // Clear new reservation code
      
      // Clear selections
      setSelectedPassengers([]);
      setSelectedItems({});
      setItemPaymentMethods({});
      setItemMethodForms({});
      setItemExpandedMethod({});
      setActivePaymentPassenger('');
      
    } catch (error) {
      console.error('Error loading reservation:', error);
      alert('Failed to load reservation');
    }
  };

  // Delete single reservation
  const handleDeleteReservation = async () => {
    if (!selectedReservationCode) return;
    
    if (!confirm(`Are you sure you want to delete reservation ${selectedReservationCode}?`)) {
      return;
    }
    
    try {
      // Find the reservation to delete
      const reservationToDelete = allReservations.find(r => r.reservationCode === selectedReservationCode);
      if (!reservationToDelete) {
        alert('Reservation not found');
        return;
      }
      
      // Delete from Firebase
      await deleteReservation(reservationToDelete.id);
      
      // Update local state
      const updatedReservations = allReservations.filter(r => r.reservationCode !== selectedReservationCode);
      setAllReservations(updatedReservations);
      setSelectedReservationCode('');
      
      // If we're deleting the current reservation, clear it
      if (currentReservation?.reservationCode === selectedReservationCode) {
        setCurrentReservation(null);
        setReservationCode('');
        setNewReservationCode(null);
        setSelectedPassengers([]);
        setSelectedItems({});
        setItemPaymentMethods({});
        setItemMethodForms({});
        setItemExpandedMethod({});
      }
      
      alert(`Reservation ${selectedReservationCode} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Failed to delete reservation');
    }
  };

  // Delete all reservations
  const handleDeleteAllReservations = async () => {
    if (!confirm('Are you sure you want to delete ALL reservations? This action cannot be undone!')) {
      return;
    }
    
    try {
      // Delete each reservation from Firebase
      const deletePromises = allReservations.map(reservation => 
        deleteReservation(reservation.id)
      );
      
      // Wait for all deletions to complete
      await Promise.all(deletePromises);
      
      // Clear local state
      setAllReservations([]);
      setSelectedReservationCode('');
      setCurrentReservation(null);
      setReservationCode('');
      setNewReservationCode(null);
      setSelectedPassengers([]);
      setSelectedItems({});
      setItemPaymentMethods({});
      setItemMethodForms({});
      setItemExpandedMethod({});
      
      alert('All reservations deleted successfully!');
    } catch (error) {
      console.error('Error deleting all reservations:', error);
      alert('Failed to delete all reservations');
    }
  };

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);


  // Clear all payment methods for all passengers
  const clearAllPaymentMethods = () => {
    if (window.confirm('Are you sure you want to delete all payment methods for all passengers? This action cannot be undone.')) {
      setItemPaymentMethods({});
      setItemMethodForms({});
      setItemExpandedMethod({});
    }
  };



  const reservation: Reservation = currentReservation ? ensureAncillariesExist(currentReservation) : ensureAncillariesExist(MOCK_RESERVATION);
  
  // Passenger data from reservation structure, sorted by payment status
  const availablePassengers = reservation.passengers
    .map((passenger, index) => ({
      id: (index + 1).toString(),
      fullName: passenger.name,
      hasUnpaidItems: !!(passenger.ticket.status !== 'Paid' || 
                     (passenger.ancillaries.seat && passenger.ancillaries.seat.status !== 'Paid') || 
                     (passenger.ancillaries.bag && passenger.ancillaries.bag.status !== 'Paid') ||
                     (passenger.ancillaries.secondBag && passenger.ancillaries.secondBag.status !== 'Paid') ||
                     (passenger.ancillaries.thirdBag && passenger.ancillaries.thirdBag.status !== 'Paid') ||
                     (passenger.ancillaries.uatp && passenger.ancillaries.uatp.status !== 'Paid'))
    }))
    .sort((a, b) => {
      // Passengers with unpaid items first, then fully paid passengers
      if (a.hasUnpaidItems && !b.hasUnpaidItems) return -1;
      if (!a.hasUnpaidItems && b.hasUnpaidItems) return 1;
      return 0;
    });

  const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
  const [invoiceEmail, setInvoiceEmail] = useState<string>("");
  const [expandedPassengers, setExpandedPassengers] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: string[]}>({});
  const [mounted, setMounted] = useState(false);
  const [voucherBalances, setVoucherBalances] = useState<{[voucherNumber: string]: number}>({});

  // Keep invoiceEmail in sync with the loaded reservation
  useEffect(() => {
    if (currentReservation && (currentReservation as any).invoiceEmail !== undefined) {
      setInvoiceEmail(((currentReservation as any).invoiceEmail as string) || '');
    }
  }, [currentReservation]);

  // Voucher balance management functions
  const checkVoucherBalance = async (voucherNumber: string): Promise<number> => {
    console.log('checkVoucherBalance called in page.tsx:', voucherNumber);
    const cleanVoucherNumber = voucherNumber.replace(/\D/g, '');
    
    // If we already have the balance for this voucher, return it
    if (voucherBalances[cleanVoucherNumber]) {
      console.log('Returning existing balance:', voucherBalances[cleanVoucherNumber]);
      return voucherBalances[cleanVoucherNumber];
    }
    
    // Simulate API call to get voucher balance
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, generate a random balance between $50 and $500
    const simulatedBalance = Math.floor(Math.random() * 450) + 50;
    
    // Store the balance
    setVoucherBalances(prev => ({
      ...prev,
      [cleanVoucherNumber]: simulatedBalance
    }));
    
    console.log('Generated new balance:', simulatedBalance);
    return simulatedBalance;
  };

  const updateVoucherBalance = (voucherNumber: string, usedAmount: number) => {
    const cleanVoucherNumber = voucherNumber.replace(/\D/g, '');
    
    setVoucherBalances(prev => {
      const currentBalance = prev[cleanVoucherNumber] || 0;
      const newBalance = Math.max(0, currentBalance - usedAmount);
      
      return {
        ...prev,
        [cleanVoucherNumber]: newBalance
      };
    });
  };

  const getVoucherBalance = (voucherNumber: string): number => {
    const cleanVoucherNumber = voucherNumber.replace(/\D/g, '');
    return voucherBalances[cleanVoucherNumber] || 0;
  };
  
  // Reservations dropdown state
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [selectedReservationCode, setSelectedReservationCode] = useState<string>('');
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  
  // Payment method assignments for each selected item
  const [itemPaymentMethods, setItemPaymentMethods] = useState<{[key: string]: {
    credit?: { amount: number; cardId: string };
    vouchers?: { 
      amount: number; 
      uatpNumber: string; 
      balance: number; 
      expirationDate: string;
    }[];
    points?: { 
      amount: number; 
      accountId: string; 
      memberNumber: string; 
      pointsToUse: number;
      awardReference: string;
    };
  }}>({});
  
  // UI: which method forms to show under each item (supports multiple)
  const [itemMethodForms, setItemMethodForms] = useState<{ [key: string]: Array<'credit' | 'voucher' | 'points'> }>({});
  // Which method is expanded per item (single expand accordion)
  const [itemExpandedMethod, setItemExpandedMethod] = useState<{ [key: string]: number | null }>({});
  
  // Active passenger tab for payment methods section
  const [activePaymentPassenger, setActivePaymentPassenger] = useState<string>('');
  
  

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load reservations when user changes
  useEffect(() => {
    if (user && mounted) {
      loadAllReservations();
    }
  }, [user, mounted]);


  // Memoized calculations for better performance
  const passengersWithSelectedItems = useMemo(() => Object.keys(selectedItems), [selectedItems]);
  
  // resolvePassengerIndex is now imported from utils/passengerLogic
  const resolvePassengerIndex = (passengerId: string): number => {
    return resolvePassengerIndexUtil(passengerId, reservation);
  };
  
  const flightPrice = useMemo(() => {
    return passengersWithSelectedItems.reduce((sum, passengerId) => {
      const passengerIndex = resolvePassengerIndex(passengerId);
      const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
      if (!passenger) return sum;
      const selectedPassengerItems = selectedItems[passengerId] || [];
      
      // Only count ticket price if ticket is selected and not paid
      if (selectedPassengerItems.includes('ticket') && passenger.ticket.status !== 'Paid') {
        return sum + passenger.ticket.price;
      }
      return sum;
  }, 0);
  }, [passengersWithSelectedItems, selectedItems, reservation.passengers]);
  
  const additionalServices = useMemo(() => {
    return passengersWithSelectedItems.reduce((sum, passengerId) => {
      const passengerIndex = resolvePassengerIndex(passengerId);
      const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
      if (!passenger) return sum;
      const selectedPassengerItems = selectedItems[passengerId] || [];
      
      let passengerTotal = 0;
      
      // Only count seat price if seat is selected and not paid
      if (selectedPassengerItems.includes('seat') && passenger.ancillaries.seat && passenger.ancillaries.seat.status !== 'Paid') {
        passengerTotal += passenger.ancillaries.seat.price || 0;
      }
      
      // Only count bag price if bag is selected and not paid
      if (selectedPassengerItems.includes('bag') && passenger.ancillaries.bag && passenger.ancillaries.bag.status !== 'Paid') {
        passengerTotal += passenger.ancillaries.bag.price || 0;
      }
      
      // Only count secondBag price if secondBag is selected and not paid
      if (selectedPassengerItems.includes('secondBag') && passenger.ancillaries.secondBag && passenger.ancillaries.secondBag.status !== 'Paid') {
        passengerTotal += passenger.ancillaries.secondBag.price || 0;
      }
      
      // Only count thirdBag price if thirdBag is selected and not paid
      if (selectedPassengerItems.includes('thirdBag') && passenger.ancillaries.thirdBag && passenger.ancillaries.thirdBag.status !== 'Paid') {
        passengerTotal += passenger.ancillaries.thirdBag.price || 0;
      }
      
      // Only count uatp price if uatp is selected and not paid
      if (selectedPassengerItems.includes('uatp') && passenger.ancillaries.uatp && passenger.ancillaries.uatp.status !== 'Paid') {
        passengerTotal += passenger.ancillaries.uatp.price || 0;
      }
      
      return sum + passengerTotal;
  }, 0);
  }, [passengersWithSelectedItems, selectedItems, reservation.passengers]);
  
  const total = useMemo(() => flightPrice + additionalServices, [flightPrice, additionalServices]);

  // Wrapper functions for payment logic (moved up to avoid initialization order issues)
  const getTotalPaidAmountWrapper = useCallback((itemKey: string) => {
    return getTotalPaidAmount(itemKey, itemPaymentMethods);
  }, [itemPaymentMethods]);

  const isItemFullyPaidWrapper = (itemKey: string) => {
    // First check if item is marked as paid in the database
    const [passengerId, itemType] = itemKey.split('-');
    const passengerIndex = resolvePassengerIndex(passengerId);
    const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    
    if (passenger) {
      let dbStatus = '';
      let itemPrice = 0;
    if (itemType === 'ticket') {
        dbStatus = passenger.ticket.status;
      itemPrice = passenger.ticket.price;
    } else if (itemType === 'seat') {
        dbStatus = passenger.ancillaries.seat?.status || 'Unpaid';
      itemPrice = passenger.ancillaries.seat?.price || 0;
    } else if (itemType === 'bag') {
        dbStatus = passenger.ancillaries.bag?.status || 'Unpaid';
      itemPrice = passenger.ancillaries.bag?.price || 0;
    } else if (itemType === 'secondBag') {
        dbStatus = passenger.ancillaries.secondBag?.status || 'Unpaid';
      itemPrice = passenger.ancillaries.secondBag?.price || 0;
    } else if (itemType === 'thirdBag') {
        dbStatus = passenger.ancillaries.thirdBag?.status || 'Unpaid';
      itemPrice = passenger.ancillaries.thirdBag?.price || 0;
    } else if (itemType === 'uatp') {
        dbStatus = passenger.ancillaries.uatp?.status || 'Unpaid';
      itemPrice = passenger.ancillaries.uatp?.price || 0;
    }
    
      
      // If marked as paid in database, consider it fully paid
      if (dbStatus === 'Paid') {
        return true;
      }
    }
    
    // Otherwise, check local payment methods
    return isItemFullyPaid(itemKey, itemPaymentMethods, reservation, resolvePassengerIndex);
  };

  const confirmAddMethodWrapper = (itemKey: string, method: 'credit' | 'voucher' | 'points') => {
    // Collapse all other payment methods before adding new one
    setItemExpandedMethod({});
    
    confirmAddMethod(
      itemKey, 
      method, 
      itemMethodForms, 
      itemPaymentMethods, 
      setItemMethodForms, 
      setItemPaymentMethods, 
      setItemExpandedMethod, 
      getRemainingAmount
    );
  };

  const updateMethodFieldWrapper = (itemKey: string, method: 'credit' | 'voucher' | 'points', field: string, value: string, voucherIndex?: number) => {
    updateMethodField(itemKey, method, field, value, voucherIndex, itemPaymentMethods, setItemPaymentMethods);
  };

  const removeMethodWrapper = (itemKey: string, formIndex: number) => {
    removeMethod(
      itemKey, 
      formIndex, 
      itemMethodForms, 
      itemPaymentMethods, 
      setItemMethodForms, 
      setItemPaymentMethods, 
      setItemExpandedMethod
    );
  };

  // Copy payment method functionality
  const handleCopyMethod = (itemKey: string, method: 'credit' | 'voucher' | 'points') => {
    setCopySourceItemKey(itemKey);
    setCopySourceMethod(method);
    setCopyModalOpen(true);
  };

  const handleCopyConfirm = (selectedPassengerIds: string[], copyToAll: boolean) => {
    const sourcePaymentData = itemPaymentMethods[copySourceItemKey];
    if (!sourcePaymentData) return;

    const targetPassengerIds = copyToAll ? selectedPassengers : selectedPassengerIds;
    
    targetPassengerIds.forEach(passengerId => {
      const isSourcePassenger = passengerId === copySourceItemKey.split('-')[0];
      
      // Get all item types for this passenger
      const passengerItems = selectedItems[passengerId] || [];
      
      passengerItems.forEach(itemType => {
        const targetItemKey = `${passengerId}-${itemType}`;
        
        // For source passenger, skip the exact item we're copying from
        if (isSourcePassenger && targetItemKey === copySourceItemKey) {
          return; // Skip the exact source item
        }
        
        // Check if there's remaining balance for this item
        const remainingAmount = getRemainingAmount(targetItemKey);
        if (remainingAmount.remaining <= 0) {
          return; // Skip if no remaining balance
        }
        
        // Copy the payment method data
        if (copySourceMethod === 'credit' && sourcePaymentData.credit) {
          const creditData = sourcePaymentData.credit;
          setItemPaymentMethods(prev => ({
          ...prev,
            [targetItemKey]: {
              ...prev[targetItemKey],
              credit: {
                amount: remainingAmount.remaining, // Copy the full remaining amount
                cardId: creditData.cardId || '',
                cardNumber: (creditData as any).cardNumber || '',
                expiryDate: (creditData as any).expiryDate || '',
                cvv: (creditData as any).cvv || '',
                holderName: (creditData as any).holderName || '',
                idNumber: (creditData as any).idNumber || '',
                numberOfPayments: (creditData as any).numberOfPayments || '1'
              }
            }
          }));
          
          // Add credit method to forms if not already present
          setItemMethodForms(prev => {
            const currentForms = prev[targetItemKey] || [];
            if (!currentForms.includes('credit')) {
    return {
                ...prev,
                [targetItemKey]: [...currentForms, 'credit']
              };
            }
            return prev;
          });
        } else if (copySourceMethod === 'voucher' && sourcePaymentData.vouchers) {
          // Update voucher amounts to match remaining balance
          const updatedVouchers = (sourcePaymentData.vouchers || []).map((voucher: any, index: number) => ({
            ...voucher,
            amount: index === 0 ? remainingAmount.remaining : 0 // Set first voucher to full amount, others to 0
          }));
          
          setItemPaymentMethods(prev => ({
            ...prev,
            [targetItemKey]: {
              ...prev[targetItemKey],
              vouchers: updatedVouchers
            }
          }));
          
          // Add voucher methods to forms
          setItemMethodForms(prev => {
            const currentForms = prev[targetItemKey] || [];
            const voucherCount = sourcePaymentData.vouchers?.length || 0;
            const newForms = [...currentForms];
            for (let i = 0; i < voucherCount; i++) {
              if (!newForms.includes('voucher')) {
                newForms.push('voucher');
              }
            }
            return {
              ...prev,
              [targetItemKey]: newForms
            };
          });
        } else if (copySourceMethod === 'points' && sourcePaymentData.points) {
          const pointsData = sourcePaymentData.points;
          setItemPaymentMethods(prev => ({
            ...prev,
            [targetItemKey]: {
              ...prev[targetItemKey],
              points: {
                amount: remainingAmount.remaining, // Copy the full remaining amount
                accountId: (pointsData as any).accountId || '',
                memberNumber: (pointsData as any).memberNumber || '',
                pointsToUse: Math.round(remainingAmount.remaining * 50), // Calculate points based on remaining amount
                awardReference: (pointsData as any).awardReference || ''
              }
            }
          }));
          
          // Add points method to forms if not already present
    setItemMethodForms(prev => {
            const currentForms = prev[targetItemKey] || [];
            if (!currentForms.includes('points')) {
    return {
                ...prev,
                [targetItemKey]: [...currentForms, 'points']
              };
            }
            return prev;
          });
        }
      });
    });
    
    setCopyModalOpen(false);
  };

  const isPaymentMethodCompleteWrapper = (itemKey: string, method: string, methodIndex: number) => {
    return isPaymentMethodComplete(itemKey, method, methodIndex, itemPaymentMethods);
  };

  // Get generated number for an item (ticket number or ancillary number)
  const getGeneratedNumber = (itemKey: string): string | null => {
    const [passengerId, itemType] = itemKey.split('-');
    const passengerIndex = resolvePassengerIndex(passengerId);
    const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    
    if (!passenger) return null;
    
    if (itemType === 'ticket') {
      return passenger.ticket.ticketNumber || null;
    } else if (itemType === 'seat') {
      return passenger.ancillaries.seat.ancillaryNumber || null;
    } else if (itemType === 'bag') {
      return passenger.ancillaries.bag.ancillaryNumber || null;
    } else if (itemType === 'secondBag') {
      return passenger.ancillaries.secondBag?.ancillaryNumber || null;
    } else if (itemType === 'thirdBag') {
      return passenger.ancillaries.thirdBag?.ancillaryNumber || null;
    } else if (itemType === 'uatp') {
      return passenger.ancillaries.uatp?.ancillaryNumber || null;
    }
    
    return null;
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string = 'number') => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage(`${type} copied to clipboard!`);
      setToastOpen(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setToastMessage('Failed to copy to clipboard');
      setToastOpen(true);
    }
  };

  // Calculate payment progress
  const paymentProgress = useMemo(() => {
    if (total === 0) return 0;
    const paidAmount = passengersWithSelectedItems.reduce((sum, passengerId) => {
    const selectedPassengerItems = selectedItems[passengerId] || [];
    let passengerPaid = 0;
    selectedPassengerItems.forEach(itemType => {
      const itemKey = `${passengerId}-${itemType}`;
        const [passengerIdFromKey, itemTypeFromKey] = itemKey.split('-');
        const passengerIndex = resolvePassengerIndex(passengerIdFromKey);
        const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
        
        if (passenger) {
          let dbStatus = '';
    let itemPrice = 0;
    
          if (itemTypeFromKey === 'ticket') {
            dbStatus = passenger.ticket.status;
      itemPrice = passenger.ticket.price;
          } else if (itemTypeFromKey === 'seat') {
            dbStatus = passenger.ancillaries.seat?.status || 'Unpaid';
            itemPrice = passenger.ancillaries.seat?.price || 0;
          } else if (itemTypeFromKey === 'bag') {
            dbStatus = passenger.ancillaries.bag?.status || 'Unpaid';
            itemPrice = passenger.ancillaries.bag?.price || 0;
          } else if (itemTypeFromKey === 'secondBag') {
            dbStatus = passenger.ancillaries.secondBag?.status || 'Unpaid';
            itemPrice = passenger.ancillaries.secondBag?.price || 0;
          } else if (itemTypeFromKey === 'thirdBag') {
            dbStatus = passenger.ancillaries.thirdBag?.status || 'Unpaid';
            itemPrice = passenger.ancillaries.thirdBag?.price || 0;
          } else if (itemTypeFromKey === 'uatp') {
            dbStatus = passenger.ancillaries.uatp?.status || 'Unpaid';
            itemPrice = passenger.ancillaries.uatp?.price || 0;
          }
          
          // If item is already paid in database, add full price
          if (dbStatus === 'Paid') {
            passengerPaid += itemPrice;
        } else {
            // Otherwise, add the amount paid through payment methods
            passengerPaid += getTotalPaidAmountWrapper(itemKey);
          }
        }
      });
      return sum + passengerPaid;
    }, 0);
    return Math.min((paidAmount / total) * 100, 100); // Cap at 100%
  }, [passengersWithSelectedItems, selectedItems, total, getTotalPaidAmountWrapper, reservation, resolvePassengerIndex]);

  // Firebase sync functions
  // Helper function to clean data before sending to Firebase
  const cleanDataForFirebase = (data: any): any => {
    if (data === null || data === undefined) {
      return null;
    }
    
    if (Array.isArray(data)) {
      return data.map(cleanDataForFirebase);
    }
    
    if (typeof data === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          cleaned[key] = cleanDataForFirebase(value);
        }
      }
      return cleaned;
    }
    
    return data;
  };

  const syncToFirebase = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      // Special handling for itemPaymentMethods to remove undefined values
      const cleanedItemPaymentMethods: any = {};
      for (const [itemKey, methods] of Object.entries(itemPaymentMethods)) {
        if (methods && typeof methods === 'object') {
          cleanedItemPaymentMethods[itemKey] = {};
          for (const [methodKey, methodData] of Object.entries(methods)) {
            if (methodData && typeof methodData === 'object') {
              cleanedItemPaymentMethods[itemKey][methodKey] = {};
              for (const [fieldKey, fieldValue] of Object.entries(methodData)) {
                if (fieldValue !== undefined && fieldValue !== null) {
                  cleanedItemPaymentMethods[itemKey][methodKey][fieldKey] = fieldValue;
                }
              }
            }
          }
        }
      }

      const rawData = {
        selectedItems,
        selectedPassengers,
        activePaymentPassenger,
        itemPaymentMethods: cleanedItemPaymentMethods,
        itemMethodForms,
        itemExpandedMethod
      };
      
      const cleanedData = cleanDataForFirebase(rawData);
      
      await updateUserProgress(cleanedData);
    } catch (error) {
      console.error('Failed to sync to Firebase:', error);
    }
  }, [user, selectedItems, selectedPassengers, activePaymentPassenger, itemPaymentMethods, itemMethodForms, itemExpandedMethod, updateUserProgress]);

  const syncFromFirebase = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const progress = await getUserProgress();
      if (progress) {
        setSelectedItems(progress.selectedItems || {});
        setSelectedPassengers(progress.selectedPassengers || []);
        setActivePaymentPassenger(progress.activePaymentPassenger || '');
        setItemPaymentMethods(progress.itemPaymentMethods || {});
        setItemMethodForms(progress.itemMethodForms || {});
        setItemExpandedMethod(progress.itemExpandedMethod || {});
      }
    } catch (error) {
      console.error('Failed to load from Firebase:', error);
    }
  }, [user, getUserProgress]);

  // Auto-save to Firebase when data changes
  useEffect(() => {
    if (user && mounted) {
      const timeoutId = setTimeout(() => {
        syncToFirebase();
      }, 2000); // Debounce for 2 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [user, mounted, selectedItems, selectedPassengers, activePaymentPassenger, itemPaymentMethods, itemMethodForms, itemExpandedMethod, syncToFirebase]);

  // togglePassenger is now imported from utils/passengerLogic
  const togglePassenger = (passengerId: string) => {
    togglePassengerUtil(passengerId, selectedPassengers, setSelectedPassengers);
    // Auto-select all unpaid items for this passenger
    const passengerIndex = resolvePassengerIndex(passengerId);
    const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    if (!passengerData) return;

    const itemsToSelect: string[] = [];
    if (passengerData.ticket.status !== 'Paid') itemsToSelect.push('ticket');
    if (passengerData.ancillaries.seat && passengerData.ancillaries.seat.status !== 'Paid') itemsToSelect.push('seat');
    if (passengerData.ancillaries.bag && passengerData.ancillaries.bag.status !== 'Paid') itemsToSelect.push('bag');
    if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status !== 'Paid') itemsToSelect.push('secondBag');
    if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status !== 'Paid') itemsToSelect.push('thirdBag');
    if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status !== 'Paid') itemsToSelect.push('uatp');


    setSelectedItems(prev => ({
      ...prev,
      [passengerId]: itemsToSelect
    }));

    // Ensure the Payment Methods section shows this passenger's items
    setActivePaymentPassenger(passengerId);

  };

  // toggleExpanded is now imported from utils/passengerLogic
  const toggleExpanded = (passengerId: string) => {
    toggleExpandedUtil(passengerId, expandedPassengers, setExpandedPassengers);
  };

  // toggleItem is now imported from utils/passengerLogic
  const toggleItem = (passengerId: string, itemType: string) => {
    toggleItemUtil(passengerId, itemType, selectedItems, selectedPassengers, setSelectedItems, setSelectedPassengers);
    
    // Additional logic for payment methods cleanup
    const passengerItems = selectedItems[passengerId] || [];
      const isSelected = passengerItems.includes(itemType);
      
      if (isSelected) {
        // Remove payment method assignment for this item
        const itemKey = `${passengerId}-${itemType}`;
        setItemPaymentMethods(prev => {
          const newMethods = { ...prev };
          delete newMethods[itemKey];
          return newMethods;
        });
        
        // Also remove from method forms and expanded state
          setItemMethodForms(prev => {
            const newForms = { ...prev };
          delete newForms[itemKey];
            return newForms;
          });

        setItemExpandedMethod(prev => {
          const newExpanded = { ...prev };
          delete newExpanded[itemKey];
          return newExpanded;
        });
    }
  };

  // Old toggleItem function (to be removed):

  // Clear all selected items for a passenger
  const clearAllItemsForPassenger = (passengerId: string) => {
    setSelectedItems(prev => {
      const newSelectedItems = { ...prev };
      delete newSelectedItems[passengerId];
      return newSelectedItems;
    });
    
    // Also remove from selected passengers if present
    setSelectedPassengers(prev => prev.filter(id => id !== passengerId));
    
    // Clean up payment methods for this passenger
    const passengerIndex = resolvePassengerIndex(passengerId);
    const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    if (!passengerData) return;
    
    const unpaidItems: string[] = [];
    if (passengerData.ticket.status !== 'Paid') unpaidItems.push('ticket');
    if (passengerData.ancillaries.seat && passengerData.ancillaries.seat.status !== 'Paid') unpaidItems.push('seat');
    if (passengerData.ancillaries.bag && passengerData.ancillaries.bag.status !== 'Paid') unpaidItems.push('bag');
    if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status !== 'Paid') unpaidItems.push('secondBag');
    if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status !== 'Paid') unpaidItems.push('thirdBag');
    if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status !== 'Paid') unpaidItems.push('uatp');
    
    // Remove payment methods for all items of this passenger
    unpaidItems.forEach(itemType => {
      const itemKey = `${passengerId}-${itemType}`;
          setItemMethodForms(prev => {
            const newForms = { ...prev };
        delete newForms[itemKey];
            return newForms;
          });
          setItemPaymentMethods(prev => {
        const newMethods = { ...prev };
        delete newMethods[itemKey];
        return newMethods;
      });
      setItemExpandedMethod(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[itemKey];
        return newExpanded;
      });
    });
  };

  // toggleAllItemsForPassenger is now imported from utils/passengerLogic
  const toggleAllItemsForPassenger = (passengerId: string) => {
    toggleAllItemsForPassengerUtil(
      passengerId, 
      reservation, 
      selectedItems, 
      selectedPassengers, 
      setSelectedItems, 
      setSelectedPassengers, 
      resolvePassengerIndex
    );
    
    // Additional logic for payment methods cleanup
    const passengerIndex = resolvePassengerIndex(passengerId);
    const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    if (!passengerData) return;
    
    const unpaidItems: string[] = [];
    if (passengerData.ticket.status !== 'Paid') unpaidItems.push('ticket');
    if (passengerData.ancillaries.seat && passengerData.ancillaries.seat.status !== 'Paid') unpaidItems.push('seat');
    if (passengerData.ancillaries.bag && passengerData.ancillaries.bag.status !== 'Paid') unpaidItems.push('bag');
    if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status !== 'Paid') unpaidItems.push('secondBag');
    if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status !== 'Paid') unpaidItems.push('thirdBag');
    if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status !== 'Paid') unpaidItems.push('uatp');

    const current = selectedItems[passengerId] || [];
      const allSelected = unpaidItems.every(item => current.includes(item));

      if (allSelected) {
        // Remove payment data for this passenger's items
        setItemPaymentMethods(prevMethods => {
          const newMethods = { ...prevMethods } as any;
          unpaidItems.forEach(itemType => {
            const key = `${passengerId}-${itemType}`;
            delete newMethods[key];
          });
            return newMethods;
          });
        setItemMethodForms(prevForms => {
          const newForms = { ...prevForms } as any;
          unpaidItems.forEach(itemType => {
            const key = `${passengerId}-${itemType}`;
            delete newForms[key];
          });
          return newForms;
        });
        setItemExpandedMethod(prevExpanded => {
          const newExpanded = { ...prevExpanded } as any;
          unpaidItems.forEach(itemType => {
            const key = `${passengerId}-${itemType}`;
            delete newExpanded[key];
          });
          return newExpanded;
        });
    }
  };

  // Old toggleAllItemsForPassenger function (to be removed):

  // Keep active tab in sync with selected items
  useEffect(() => {
    const passengersWithItems = Object.entries(selectedItems)
      .filter(([pid, items]) => {
        if (!items || items.length === 0) return false;
        const idx = resolvePassengerIndex(pid);
        const p = idx >= 0 ? reservation.passengers[idx] : undefined;
        if (!p) return false;
        const hasUnpaid = p.ticket.status !== 'Paid' || 
                          (p.ancillaries.seat && p.ancillaries.seat.status !== 'Paid') || 
                          (p.ancillaries.bag && p.ancillaries.bag.status !== 'Paid');
        return hasUnpaid;
      })
      .map(([pid]) => pid);
    if (passengersWithItems.length === 0) {
      setActivePaymentPassenger('');
      return;
    }
    if (!activePaymentPassenger || !passengersWithItems.includes(activePaymentPassenger)) {
      setActivePaymentPassenger(passengersWithItems[0]);
    }
  }, [selectedItems]);


  // getPassengerTabLabel is now imported from utils/passengerLogic
  const getPassengerTabLabel = (pid: string) => {
    return getPassengerTabLabelUtil(pid, reservation, resolvePassengerIndex);
  };

  // isItemSelected is now imported from utils/passengerLogic
  const isItemSelected = (passengerId: string, itemType: string) => {
    return isItemSelectedUtil(passengerId, itemType, selectedItems);
  };




  // getRemainingAmount function
  const getRemainingAmount = (itemKey: string) => {
        const [passengerId, itemType] = itemKey.split('-');
        const passengerIndex = resolvePassengerIndex(passengerId);
    const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    if (!passenger) return { total: 0, paid: 0, remaining: 0 };
    
        let itemPrice = 0;
        let dbStatus = '';
        if (itemType === 'ticket') {
          itemPrice = passenger.ticket.price;
          dbStatus = passenger.ticket.status;
        } else if (itemType === 'seat') {
          itemPrice = passenger.ancillaries.seat?.price || 0;
          dbStatus = passenger.ancillaries.seat?.status || 'Unpaid';
        } else if (itemType === 'bag') {
          itemPrice = passenger.ancillaries.bag?.price || 0;
          dbStatus = passenger.ancillaries.bag?.status || 'Unpaid';
        } else if (itemType === 'secondBag') {
          itemPrice = passenger.ancillaries.secondBag?.price || 0;
          dbStatus = passenger.ancillaries.secondBag?.status || 'Unpaid';
        } else if (itemType === 'thirdBag') {
          itemPrice = passenger.ancillaries.thirdBag?.price || 0;
          dbStatus = passenger.ancillaries.thirdBag?.status || 'Unpaid';
        } else if (itemType === 'uatp') {
          itemPrice = passenger.ancillaries.uatp?.price || 0;
          dbStatus = passenger.ancillaries.uatp?.status || 'Unpaid';
        }

    // If marked as paid in database, return fully paid
    if (dbStatus === 'Paid') {
      return {
        total: itemPrice,
        paid: itemPrice,
        remaining: 0
      };
    }

    const totalPaid = getTotalPaidAmountWrapper(itemKey);
    
    return {
      total: itemPrice,
      paid: Number.isFinite(totalPaid) ? totalPaid : 0,
      remaining: Math.max(0, itemPrice - (Number.isFinite(totalPaid) ? totalPaid : 0))
    };
  };

  // getOriginalItemPrice function - returns the original price of the item for capping
  const getOriginalItemPrice = (itemKey: string) => {
    const [passengerId, itemType] = itemKey.split('-');
    const passengerIndex = resolvePassengerIndex(passengerId);
    const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    if (!passenger) return 0;
    
    if (itemType === 'ticket') {
      return passenger.ticket.price;
    } else if (itemType === 'seat') {
      return passenger.ancillaries.seat?.price || 0;
    } else if (itemType === 'bag') {
      return passenger.ancillaries.bag?.price || 0;
    } else if (itemType === 'secondBag') {
      return passenger.ancillaries.secondBag?.price || 0;
    } else if (itemType === 'thirdBag') {
      return passenger.ancillaries.thirdBag?.price || 0;
    } else if (itemType === 'uatp') {
      return passenger.ancillaries.uatp?.price || 0;
    }
    
    return 0;
  };

  // Old getPassengerTabLabel function (to be removed):


  // Get all selected items with their details
  const getSelectedItemsDetails = () => {
    const selectedItemsDetails: Array<{
      key: string;
      passengerId: string;
      itemType: string;
      passengerName: string;
      itemName: string;
      amount: number;
      paymentMethods: any;
    }> = [];

    Object.entries(selectedItems).forEach(([passengerId, items]) => {
      const passengerIndex = resolvePassengerIndex(passengerId);
      const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
      if (!passengerData) return;
      
      items.forEach(itemType => {
        const itemKey = `${passengerId}-${itemType}`;
        let itemName = '';
        let amount = 0;
        
        if (itemType === 'ticket') {
          itemName = 'Flight Ticket';
          amount = passengerData.ticket.price;
        } else if (itemType === 'seat') {
          itemName = `Seat (${passengerData.ancillaries.seat.seatNumber || 'N/A'})`;
          amount = passengerData.ancillaries.seat.price;
        } else if (itemType === 'bag') {
          itemName = 'Baggage (XBAF)';
          amount = passengerData.ancillaries.bag.price;
        } else if (itemType === 'secondBag') {
          itemName = 'Second Bag (XBAS)';
          amount = passengerData.ancillaries.secondBag?.price || 0;
        } else if (itemType === 'thirdBag') {
          itemName = 'Third Bag (XBAT)';
          amount = passengerData.ancillaries.thirdBag?.price || 0;
        } else if (itemType === 'uatp') {
          itemName = 'UATP';
          amount = passengerData.ancillaries.uatp?.price || 0;
        }
        
        selectedItemsDetails.push({
          key: itemKey,
          passengerId,
          itemType,
          passengerName: passengerData.name,
          itemName,
          amount,
          paymentMethods: itemPaymentMethods[itemKey] || {}
        });
      });
    });
    
    return selectedItemsDetails;
  };

  if (!mounted) {
  return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#E4DFDA', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h4">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#E4DFDA', p: 2 }}>
      <Container maxWidth="xl" sx={{display: 'flex', flexDirection: 'column' }}>
        {/* Header with PCI title and User Menu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ flex: 1 }}></Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: '#1B358F' }}>
          PCI
        </Typography>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
            {newReservationCode && (
              <Typography variant="body2" sx={{ color: '#48A9A6', fontWeight: 'bold' }}>
                Created: {newReservationCode}
              </Typography>
            )}
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel>Passengers</InputLabel>
              <Select
                value={passengerCount}
                label="Passengers"
                onChange={(e) => setPassengerCount(Number(e.target.value))}
                sx={{ 
                  '& .MuiSelect-select': { 
                    padding: '8px 14px',
                    fontSize: '0.875rem'
                  }
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                  <MenuItem key={count} value={count}>
                    {count} {count === 1 ? 'Passenger' : 'Passengers'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Reservations Dropdown */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Reservations</InputLabel>
              <Select
                value={selectedReservationCode}
                label="Reservations"
                onChange={(e) => setSelectedReservationCode(e.target.value)}
                disabled={isLoadingReservations}
                sx={{ 
                  '& .MuiSelect-select': { 
                    padding: '8px 14px',
                    fontSize: '0.875rem'
                  }
                }}
              >
                <MenuItem value="">
                  <em>Select Reservation</em>
                </MenuItem>
                {allReservations.map((reservation) => (
                  <MenuItem key={reservation.id} value={reservation.reservationCode}>
                    {reservation.reservationCode} ({reservation.passengers.length} passengers)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Refresh Reservations Button */}
            <IconButton
              size="small"
              onClick={loadAllReservations}
              disabled={isLoadingReservations}
              title="Refresh Reservations List"
              sx={{ 
                color: '#1B358F',
                '&:hover': { backgroundColor: 'rgba(27, 53, 143, 0.1)' }
              }}
            >
              <RefreshIcon />
            </IconButton>
            
            {/* Action Buttons */}
            {selectedReservationCode && (
              <>
                <IconButton
                  size="small"
                  onClick={handleCopyReservation}
                  title="Load Reservation to Screen"
                  sx={{ 
                    color: '#48A9A6',
                    '&:hover': { backgroundColor: 'rgba(72, 169, 166, 0.1)' }
                  }}
                >
                  <CopyIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleDeleteReservation}
                  title="Delete Reservation"
                  sx={{ 
                    color: '#C1666B',
                    '&:hover': { backgroundColor: 'rgba(193, 102, 107, 0.1)' }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </>
            )}
            
            {/* Delete All Button */}
            {allReservations.length > 0 && (
              <IconButton
                size="small"
                onClick={handleDeleteAllReservations}
                title="Delete All Reservations"
                sx={{ 
                  color: '#C1666B',
                  '&:hover': { backgroundColor: 'rgba(193, 102, 107, 0.1)' }
                }}
              >
                <DeleteAllIcon />
              </IconButton>
            )}
            <Button
              variant="contained"
              size="small"
              onClick={handleCreateNewReservation}
              disabled={isCreatingReservation}
              sx={{ 
                color: '#1B358F',
                minWidth: 120,
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              {isCreatingReservation ? 'Creating...' : 'New Reservation'}
            </Button>
            <UserMenu 
              onSyncToCloud={syncToFirebase}
              onSyncFromCloud={syncFromFirebase}
              onShowAuthModal={() => setShowAuthModal(true)}
            />
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ flex: 1, height: '100%' }}>
          {/* סקשן נוסעים - שמאל - 25% */}
          <Grid size={{ xs: 12, lg: 3 }} style={{ height: '100vh' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonIcon sx={{ color: '#1B358F', mr: 1, fontSize: 28 }} />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'semibold' }}>
                    Passenger Details
                  </Typography>
                </Box>
                
                <PassengerHeader
                  reservationCode={reservationCode}
                  onChangeReservationCode={setReservationCode}
                  onLoad={handleLoadReservation}
                  loadDisabled={!reservationCode.trim()}
                  onToggleSelectAll={() => {
                    // Check if all available items are selected (only for passengers with unpaid items)
                    const passengersWithUnpaidItems = availablePassengers.filter(p => p.hasUnpaidItems);
                    const allAvailableItemsSelected = passengersWithUnpaidItems.every(passenger => {
                      const passengerIndex = resolvePassengerIndex(passenger.id);
                      const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
                      if (!passengerData) return false;
                      const passengerItems = selectedItems[passenger.id] || [];
                      
                      // Check if all unpaid items for this passenger are selected
                      const unpaidItems = [];
                      if (passengerData.ticket.status !== 'Paid') unpaidItems.push('ticket');
                      if (passengerData.ancillaries.seat && passengerData.ancillaries.seat.status !== 'Paid') unpaidItems.push('seat');
                      if (passengerData.ancillaries.bag && passengerData.ancillaries.bag.status !== 'Paid') unpaidItems.push('bag');
                      if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status !== 'Paid') unpaidItems.push('secondBag');
                      if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status !== 'Paid') unpaidItems.push('thirdBag');
                      if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status !== 'Paid') unpaidItems.push('uatp');
                      
                      return unpaidItems.every(item => passengerItems.includes(item));
                    });
                    
                    if (allAvailableItemsSelected) {
                      // Deselect all items
                      setSelectedItems({});
                    } else {
                      // Select all unpaid items
                      const newSelectedItems: {[key: string]: string[]} = {};
                      availablePassengers.forEach(passenger => {
                        const passengerIndex = resolvePassengerIndex(passenger.id);
                        const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
                        if (!passengerData) return;
                        const itemsToSelect = [];
                        
                        if (passengerData.ticket.status !== 'Paid') itemsToSelect.push('ticket');
                        if (passengerData.ancillaries.seat && passengerData.ancillaries.seat.status !== 'Paid') itemsToSelect.push('seat');
                        if (passengerData.ancillaries.bag && passengerData.ancillaries.bag.status !== 'Paid') itemsToSelect.push('bag');
                        if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status !== 'Paid') itemsToSelect.push('secondBag');
                        if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status !== 'Paid') itemsToSelect.push('thirdBag');
                        if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status !== 'Paid') itemsToSelect.push('uatp');
                        
                        if (itemsToSelect.length > 0) {
                          newSelectedItems[passenger.id] = itemsToSelect;
                        }
                      });
                      setSelectedItems(newSelectedItems);
                    }
                  }}
                  isAllSelected={(() => {
                    // Check if all available items are selected
                    const allAvailableItemsSelected = availablePassengers.every(passenger => {
                      const passengerIndex = resolvePassengerIndex(passenger.id);
                      const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
                      if (!passengerData) return false;
                      const passengerItems = selectedItems[passenger.id] || [];
                      
                      const unpaidItems = [];
                      if (passengerData.ticket.status !== 'Paid') unpaidItems.push('ticket');
                      if (passengerData.ancillaries.seat && passengerData.ancillaries.seat.status !== 'Paid') unpaidItems.push('seat');
                      if (passengerData.ancillaries.bag && passengerData.ancillaries.bag.status !== 'Paid') unpaidItems.push('bag');
                      if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status !== 'Paid') unpaidItems.push('secondBag');
                      if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status !== 'Paid') unpaidItems.push('thirdBag');
                      if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status !== 'Paid') unpaidItems.push('uatp');
                      
                      return unpaidItems.every(item => passengerItems.includes(item));
                    });
                      return allAvailableItemsSelected;
                    })()}
                />
                {/* Invoice Email Field (between reservation code and passenger list) */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Email for invoice"
                    value={invoiceEmail}
                    onChange={(e) => setInvoiceEmail(e.target.value)}
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                  />
                </Box>
                
                <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                  {availablePassengers.map((passenger) => {
                    const passengerIndex = parseInt(passenger.id) - 1;
                    const passengerData = reservation.passengers[passengerIndex];
                    const isExpanded = expandedPassengers.includes(passenger.id);
                    
                    // Skip if passengerData is undefined
                    if (!passengerData) {
                      return null;
                    }
                    
                    return (
                      <PassengerCard
                        key={passenger.id}
                        passenger={passengerData}
                        passengerData={passengerData}
                        isExpanded={isExpanded}
                        isItemSelected={isItemSelected}
                        hasSelectedItems={(passengerId: string) => {
                          const passengerIndex = resolvePassengerIndex(passengerId);
                          const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
                          if (!passengerData) {
                            console.log(`[HAS_SELECTED] ${passengerId}: No passenger data found`);
                            return false;
                          }
                          
                          const passengerItems = selectedItems[passengerId] || [];
                          console.log(`[HAS_SELECTED] ${passengerId}: passengerItems =`, passengerItems);
                          console.log(`[HAS_SELECTED] ${passengerId}: selectedItems =`, selectedItems);
                          console.log(`[HAS_SELECTED] ${passengerId}: passengerData =`, passengerData);
                          
                          if (passengerItems.length === 0) {
                            console.log(`[HAS_SELECTED] ${passengerId}: No items selected, returning false`);
                            return false;
                          }
                          
                          // Check if any of the selected items are actually unpaid
                          const hasUnpaidItems = passengerItems.some(itemType => {
                            let isUnpaid = false;
                            if (itemType === 'ticket') isUnpaid = passengerData.ticket.status !== 'Paid';
                            if (itemType === 'seat') isUnpaid = passengerData.ancillaries.seat?.status !== 'Paid';
                            if (itemType === 'bag') isUnpaid = passengerData.ancillaries.bag?.status !== 'Paid';
                            if (itemType === 'secondBag') isUnpaid = passengerData.ancillaries.secondBag?.status !== 'Paid';
                            if (itemType === 'thirdBag') isUnpaid = passengerData.ancillaries.thirdBag?.status !== 'Paid';
                            if (itemType === 'uatp') isUnpaid = passengerData.ancillaries.uatp?.status !== 'Paid';
                            
                            console.log(`[HAS_SELECTED] ${passengerId}: ${itemType} isUnpaid = ${isUnpaid}`);
                            return isUnpaid;
                          });
                          
                          console.log(`[HAS_SELECTED] ${passengerId}: hasUnpaidItems = ${hasUnpaidItems}`);
                          return hasUnpaidItems;
                        }}
                        togglePassenger={togglePassenger}
                        toggleAllItemsForPassenger={toggleAllItemsForPassenger}
                        toggleItem={toggleItem}
                        toggleExpanded={toggleExpanded}
                        copyToClipboard={copyToClipboard}
                      />
                    );
                  })}
                </Box>
              </CardContent>
              
              <Paper sx={{ p: 2, bgcolor: '#E4DFDA', m: 2, mt: 0 }}>
                <Typography variant="body2" sx={{ color: '#1B358F' }}>
                  {Object.values(selectedItems).filter((items) => items && items.length > 0).length} passengers selected
                </Typography>
              </Paper>
            </Card>
          </Grid>

          {/* סקשן אמצעי תשלום - אמצע - 50% */}
          <Grid size={{ xs: 12, lg: 6 }} style={{ height: '100vh' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CreditCardIcon sx={{ color: '#48A9A6', mr: 1, fontSize: 28 }} />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'semibold' }}>
                    Payment Methods
                  </Typography>
                </Box>
                
                {/* Payment Tabs per selected passengers */}
                <PaymentTabs
                  selectedItems={selectedItems}
                  activePaymentPassenger={activePaymentPassenger}
                  setActivePaymentPassenger={setActivePaymentPassenger}
                  reservation={reservation}
                  itemMethodForms={itemMethodForms}
                  itemPaymentMethods={itemPaymentMethods}
                  itemExpandedMethod={itemExpandedMethod}
                  getPassengerTabLabel={getPassengerTabLabel}
                  getRemainingAmount={getRemainingAmount}
                  getOriginalItemPrice={getOriginalItemPrice}
                  getTotalPaidAmountWrapper={getTotalPaidAmountWrapper}
                  isItemFullyPaid={isItemFullyPaidWrapper}
                  confirmAddMethod={confirmAddMethodWrapper}
                  isPaymentMethodComplete={isPaymentMethodCompleteWrapper}
                  updateMethodField={updateMethodFieldWrapper}
                  setItemExpandedMethod={setItemExpandedMethod}
                  removeMethod={removeMethodWrapper}
                  toggleItem={toggleItem}
                  clearAllItemsForPassenger={clearAllItemsForPassenger}
                  onCopyMethod={handleCopyMethod}
                  getGeneratedNumber={getGeneratedNumber}
                  checkVoucherBalance={checkVoucherBalance}
                  getVoucherBalance={getVoucherBalance}
                  updateVoucherBalance={updateVoucherBalance}
                />

                {/* No items selected message */}
                {getSelectedItemsDetails().length === 0 && (
                  <Box sx={{ mb: 3, p: 3, textAlign: 'center', bgcolor: '#E4DFDA', borderRadius: 2 }}>
                    <Typography variant="body1" sx={{ color: '#1B358F' }}>
                      No items selected for payment
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1B358F', mt: 1 }}>
                      Select items from the passengers section to configure payment methods
                    </Typography>
                  </Box>
                )}

              </CardContent>
            </Card>
          </Grid>

          {/* סקשן סיכום מפורט - ימין - 25% */}
          <Grid size={{ xs: 12, lg: 3 }} style={{ height: '100vh' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', p: 0 }}>
                {/* Header */}
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#1B358F', mr: 2, width: 40, height: 40 }}>
                      <ReceiptLongIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: '#1B358F' }}>
                    Payment Summary
                  </Typography>
                      <Typography variant="caption" sx={{ color: '#1B358F' }}>
                        Real-time calculation
                  </Typography>
                    </Box>
                </Box>
                
                  {/* Quick Stats */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Chip 
                      icon={<PersonIcon />} 
                      label={`${passengersWithSelectedItems.length} Passengers`} 
                      size="small" 
                      sx={{ color: '#1B358F' }} 
                      variant="outlined"
                    />
                    <Chip 
                      icon={<ShoppingCartIcon />} 
                      label={`${Object.values(selectedItems).flat().length} Items`} 
                      size="small" 
                      sx={{ color: '#48A9A6' }} 
                      variant="outlined"
                    />
                  </Box>
                  </Box>

                  {/* Payment Progress Bar */}
                  {total > 0 && (
                    <Box sx={{ mb: 3, px: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1B358F' }}>
                          Payment Progress
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: paymentProgress === 100 ? '#48A9A6' : '#1B358F' }}>
                          {paymentProgress.toFixed(1)}%
                    </Typography>
                  </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 8, 
                        backgroundColor: '#E4DFDA', 
                        borderRadius: 4,
                        overflow: 'hidden',
                        position: 'relative',
                        mb: 1.5
                      }}>
                        <Box sx={{
                          width: `${paymentProgress}%`,
                          height: '100%',
                          backgroundColor: paymentProgress === 100 ? '#48A9A6' : '#1B358F',
                          borderRadius: 4,
                          transition: 'all 0.3s ease-in-out'
                        }} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#1B358F', fontSize: '0.75rem' }}>
                          Total: ${total.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#1B358F', fontSize: '0.75rem' }}>
                          Selected: ${computeSelectedAmount(reservation, selectedItems).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Items Summary */}
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <SelectedItemsBreakdown 
                    selectedItems={selectedItems}
                    reservation={reservation}
                  />

                  <PaymentMethodsSummary 
                    itemPaymentMethods={itemPaymentMethods}
                    onClearAll={clearAllPaymentMethods}
                  />

                  <TotalSummary 
                    reservationTotal={total}
                    selectedAmount={computeSelectedAmount(reservation, selectedItems)}
                  />
                          </Box>

                <ActionButtons 
                  confirmDisabled={(() => {
                    // Convert selectedItems to the correct format
                    const selectedItemsList: string[] = [];
                    for (const [passengerId, items] of Object.entries(selectedItems)) {
                      for (const itemType of items) {
                        selectedItemsList.push(`${passengerId}-${itemType}`);
                      }
                    }
                    
                    // Debug logging removed for production
                    
                    if (selectedItemsList.length === 0) {
                      return true;
                    }
                    
                    // Check if all selected items are fully paid
                    const unpaidItems = selectedItemsList.filter(itemKey => {
                      const totalPaid = getTotalPaidAmount(itemKey, itemPaymentMethods);
                      
                      // Get item price
                      const [passengerId, itemType] = itemKey.split('-');
                      
                      // Use resolvePassengerIndex to get the correct index
                      const passengerIndex = resolvePassengerIndex(passengerId);
                      const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
                      
                      if (!passenger) {
                        return true; // If passenger not found, consider it unpaid
                      }
                      
                      let itemPrice = 0;
                      if (itemType === 'ticket') {
                        itemPrice = passenger.ticket.price;
                      } else if (itemType === 'seat') {
                        itemPrice = passenger.ancillaries.seat.price;
                      } else if (itemType === 'bag') {
                        itemPrice = passenger.ancillaries.bag.price;
                      } else if (itemType === 'secondBag') {
                        itemPrice = passenger.ancillaries.secondBag?.price || 0;
                      } else if (itemType === 'thirdBag') {
                        itemPrice = passenger.ancillaries.thirdBag?.price || 0;
                      } else if (itemType === 'uatp') {
                        itemPrice = passenger.ancillaries.uatp?.price || 0;
                      }
                      
                      return totalPaid < itemPrice;
                    });
                    
                    const isDisabled = unpaidItems.length > 0;
                    
                    return isDisabled;
                  })()}
                  onConfirm={handleConfirmPayment}
                  onCancel={() => {
                    // Clear all selections
                    setSelectedItems({});
                    setItemPaymentMethods({});
                    setItemMethodForms({});
                    setItemExpandedMethod({});
                    setActivePaymentPassenger('');
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>
      
      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      {/* Copy Payment Method Modal */}
      <CopyPaymentMethodModal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        onConfirm={handleCopyConfirm}
        passengers={reservation.passengers.map((p, idx) => ({
          id: (idx + 1).toString(), // Use 1-based ID to match passengerId format
          fullName: p.name || `Passenger ${idx + 1}`,
          hasUnpaidItems: true
        }))}
        selectedPassengers={selectedPassengers}
        sourceItemKey={copySourceItemKey}
        paymentMethodType={copySourceMethod}
        getRemainingAmount={getRemainingAmount}
        selectedItems={selectedItems}
      />
      
      {/* Toast notification for copy to clipboard */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setToastOpen(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
