'use client';

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Paper,
  Grid,
  Container,
  Divider,
  IconButton,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Avatar
} from '@mui/material';
import {
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  AttachMoney as MoneyIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Flight as FlightIcon,
  EventSeat as SeatIcon,
  Luggage as BagIcon,
  CardGiftcard as VoucherIcon,
  Star as PointsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ReceiptLong as ReceiptLongIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  LocalAtm as LocalAtmIcon,
  MonetizationOn as MonetizationOnIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { Tabs, Tab, Stack, CircularProgress, Slider } from '@mui/material';
import { PassengerHeader } from './components/PassengerHeader';
import { PassengerList } from './components/PassengerList';
import { PaymentMethodsSummary } from './components/PaymentMethodsSummary';
import { TotalSummary } from './components/TotalSummary';
import { ActionButtons } from './components/ActionButtons';
import { MOCK_RESERVATION, Reservation } from '@/types/reservation';
import { PaymentTabs } from './components/PaymentTabs';
import { SelectedItemsBreakdown } from './components/SelectedItemsBreakdown';
import { computeSelectedAmount } from './utils/paymentCalculations';

// Loading component for lazy loading
const LoadingSpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
    <CircularProgress size={24} />
    <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
      Loading...
    </Typography>
  </Box>
);

interface Passenger {
  id: string;
  fullName: string;
  hasUnpaidItems: boolean;
}


export default function PaymentPortal() {
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

  // Local storage functions for progress saving
  const saveProgressToLocalStorage = () => {
    try {
      const progressData = {
        selectedPassengers,
        selectedItems,
        itemPaymentMethods,
        itemMethodForms,
        itemExpandedMethod,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('paymentPortalProgress', JSON.stringify(progressData));
      console.log('💾 Progress saved to localStorage');
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
    }
  };

  const loadProgressFromLocalStorage = () => {
    try {
      const savedProgress = localStorage.getItem('paymentPortalProgress');
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        const savedTime = new Date(progressData.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
        
        // Only load if saved within last 24 hours
        if (hoursDiff < 24) {
          setSelectedPassengers(progressData.selectedPassengers || []);
          setSelectedItems(progressData.selectedItems || {});
          setItemPaymentMethods(progressData.itemPaymentMethods || {});
          setItemMethodForms(progressData.itemMethodForms || {});
          setItemExpandedMethod(progressData.itemExpandedMethod || {});
          console.log('📂 Progress loaded from localStorage');
          return true;
        } else {
          // Clear old progress
          localStorage.removeItem('paymentPortalProgress');
          console.log('🗑️ Old progress cleared (older than 24 hours)');
        }
      }
    } catch (error) {
      console.error('Error loading progress from localStorage:', error);
    }
    return false;
  };

  const clearProgressFromLocalStorage = () => {
    try {
      localStorage.removeItem('paymentPortalProgress');
      console.log('🗑️ Progress cleared from localStorage');
    } catch (error) {
      console.error('Error clearing progress from localStorage:', error);
    }
  };

  // Clear all payment methods for all passengers
  const clearAllPaymentMethods = () => {
    if (window.confirm('Are you sure you want to delete all payment methods for all passengers? This action cannot be undone.')) {
      setItemPaymentMethods({});
      setItemMethodForms({});
      setItemExpandedMethod({});
      setFieldErrors({});
      console.log('🗑️ All payment methods cleared');
    }
  };

  const reservation: Reservation = MOCK_RESERVATION;
  // Passenger data from reservation structure, sorted by payment status
  const availablePassengers: Passenger[] = reservation.passengers
    .map((passenger, index) => ({
      id: (index + 1).toString(),
      fullName: passenger.name,
      hasUnpaidItems: passenger.ticket.status !== 'Paid' || 
                     passenger.ancillaries.seat.status !== 'Paid' || 
                     passenger.ancillaries.bag.status !== 'Paid'
    }))
    .sort((a, b) => {
      // Passengers with unpaid items first, then fully paid passengers
      if (a.hasUnpaidItems && !b.hasUnpaidItems) return -1;
      if (!a.hasUnpaidItems && b.hasUnpaidItems) return 1;
      return 0;
    });

  const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
  const [expandedPassengers, setExpandedPassengers] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: string[]}>({});
  const [isClient, setIsClient] = useState(false);
  
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
  // UI state: show credit card edit form in unified payment card
  const [showEditCard, setShowEditCard] = useState(false);
  
  // Error states for form validation
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  
  // Mock frequent flyers data
  const frequentFlyers = [
    { memberNumber: '1234567', name: 'John Smith', points: 25000 },
    { memberNumber: '2345678', name: 'Sarah Johnson', points: 18000 },
    { memberNumber: '3456789', name: 'Michael Brown', points: 32000 }
  ];
  
  // Helper function to set field error
  const setFieldError = (fieldKey: string, error: string) => {
    setFieldErrors(prev => ({ ...prev, [fieldKey]: error }));
  };
  
  // Helper function to clear field error
  const clearFieldError = (fieldKey: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldKey];
      return newErrors;
    });
  };
  

  useEffect(() => {
    setIsClient(true);
  }, []);


  // Memoized calculations for better performance
  const passengersWithSelectedItems = useMemo(() => Object.keys(selectedItems), [selectedItems]);
  
  const resolvePassengerIndex = (passengerId: string): number => {
    if (!passengerId) return -1;
    if (/^\d+$/.test(passengerId)) {
      const idx = Number(passengerId) - 1;
      return reservation.passengers[idx] ? idx : -1;
    }
    const match = passengerId.match(/\d+/);
    if (match) {
      const idx = Number(match[0]) - 1;
      return reservation.passengers[idx] ? idx : -1;
    }
    return -1;
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
      if (selectedPassengerItems.includes('seat') && passenger.ancillaries.seat.status !== 'Paid') {
        passengerTotal += passenger.ancillaries.seat.price;
      }
      
      // Only count bag price if bag is selected and not paid
      if (selectedPassengerItems.includes('bag') && passenger.ancillaries.bag.status !== 'Paid') {
        passengerTotal += passenger.ancillaries.bag.price;
      }
      
      return sum + passengerTotal;
  }, 0);
  }, [passengersWithSelectedItems, selectedItems, reservation.passengers]);
  
  const total = useMemo(() => flightPrice + additionalServices, [flightPrice, additionalServices]);

  const togglePassenger = (passengerId: string) => {
    setSelectedPassengers(prev => 
      prev.includes(passengerId) 
        ? prev.filter(id => id !== passengerId)
        : [...prev, passengerId]
    );
  };

  const toggleExpanded = (passengerId: string) => {
    setExpandedPassengers(prev => {
      // If the passenger is already expanded, collapse it
      if (prev.includes(passengerId)) {
        return prev.filter(id => id !== passengerId);
      }
      // If expanding a passenger, close all others (accordion behavior)
      return [passengerId];
    });
  };

  const toggleItem = (passengerId: string, itemType: string) => {
    setSelectedItems(prev => {
      const passengerItems = prev[passengerId] || [];
      const isSelected = passengerItems.includes(itemType);
      
      if (isSelected) {
        // Remove item
        const newItems = passengerItems.filter(item => item !== itemType);
        
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
        
        // If no items left for this passenger, remove passenger from selectedPassengers and selectedItems
        if (newItems.length === 0) {
          setSelectedPassengers(prev => prev.filter(id => id !== passengerId));
          // Remove passenger from selectedItems completely
          const { [passengerId]: removed, ...rest } = prev;
          return rest;
        }
        
        return {
          ...prev,
          [passengerId]: newItems
        };
      } else {
        // Add item
        const newItems = [...passengerItems, itemType];
        
        // Add passenger to selectedPassengers if not already there
        setSelectedPassengers(prev => 
          prev.includes(passengerId) ? prev : [...prev, passengerId]
        );
        
        return {
          ...prev,
          [passengerId]: newItems
        };
      }
    });
  };

  // Toggle select all/deselect all unpaid items for a passenger
  const toggleAllItemsForPassenger = (passengerId: string) => {
    const passengerIndex = resolvePassengerIndex(passengerId);
    const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    if (!passengerData) return;
    const unpaidItems: string[] = [];
    if (passengerData.ticket.status !== 'Paid') unpaidItems.push('ticket');
    if (passengerData.ancillaries.seat.status !== 'Paid') unpaidItems.push('seat');
    if (passengerData.ancillaries.bag.status !== 'Paid') unpaidItems.push('bag');

    setSelectedItems(prev => {
      const current = prev[passengerId] || [];
      const allSelected = unpaidItems.every(item => current.includes(item));

      if (allSelected) {
        // Deselect all unpaid items: remove selections and clear methods/forms for this passenger
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

        // Remove passenger entirely from selected lists
        setSelectedPassengers(prevSel => prevSel.filter(id => id !== passengerId));
        const { [passengerId]: removed, ...rest } = prev;
        return rest;
      } else {
        // Select all unpaid items
        // Ensure passenger is marked selected
        setSelectedPassengers(prevSel => (prevSel.includes(passengerId) ? prevSel : [...prevSel, passengerId]));
        return {
          ...prev,
          [passengerId]: unpaidItems
        };
      }
    });
  };

  const isItemSelected = (passengerId: string, itemType: string) => {
    return selectedItems[passengerId]?.includes(itemType) || false;
  };

  // Active passenger tab for payment methods section
  const [activePaymentPassenger, setActivePaymentPassenger] = useState<string>('');
  // UI: add-payment-method dialog state (removed - using direct icon buttons now)

  // ---------------------------------------------
  // Credit card utils: type detection and formatting
  // ---------------------------------------------
  // detectCardType: Given a raw card number string, returns best-effort card scheme.
  const detectCardType = (cardNumber: string) => {
    const number = cardNumber.replace(/\D/g, '');
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'Mastercard';
    if (number.startsWith('3')) return 'American Express';
    if (number.startsWith('6')) return 'Discover';
    return 'Unknown';
  };

  // getCardIcon: Returns the appropriate icon component for each card type
  const getCardIcon = (cardType: string) => {
    switch (cardType) {
      case 'Visa':
        return (
          <Box sx={{ 
            width: 24, 
            height: 16, 
            borderRadius: 2, 
            bgcolor: '#1A1F71', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            VISA
          </Box>
        );
      case 'Mastercard':
        return (
          <Box sx={{ 
            width: 24, 
            height: 16, 
            borderRadius: 2, 
            bgcolor: '#EB001B', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{
              position: 'absolute',
              left: -2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: '#F79E1B'
            }} />
            <Box sx={{
              position: 'absolute',
              right: -2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: '#FF5F00'
            }} />
          </Box>
        );
      case 'American Express':
        return (
          <Box sx={{ 
            width: 24, 
            height: 16, 
            borderRadius: 2, 
            bgcolor: '#006FCF', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: '8px',
            fontWeight: 'bold'
          }}>
            AMEX
          </Box>
        );
      case 'Discover':
        return (
          <Box sx={{ 
            width: 24, 
            height: 16, 
            borderRadius: 2, 
            bgcolor: '#FF6000', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: '8px',
            fontWeight: 'bold'
          }}>
            DISC
          </Box>
        );
      default:
        return (
          <Box sx={{ 
            width: 24, 
            height: 16, 
            borderRadius: 2, 
            bgcolor: '#9E9E9E', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: '8px',
            fontWeight: 'bold'
          }}>
            ?
          </Box>
        );
    }
  };

  // ---------------------------------------------
  // Amounts/Remaining logic per item (ticket/seat/bag)
  // ---------------------------------------------
  // getRemainingAmount: derives total, already paid and remaining for a specific item key.
  // itemKey format: "<passengerId>-<itemType>" where itemType in [ticket|seat|bag]
  const getRemainingAmount = (itemKey: string) => {
    const [passengerId, itemType] = itemKey.split('-');
    const passengerIndex = resolvePassengerIndex(passengerId);
    const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    if (!passenger) return { total: 0, paid: 0, remaining: 0 };
    let itemPrice = 0;
    
    if (itemType === 'ticket') {
      itemPrice = passenger.ticket.price;
    } else if (itemType === 'seat') {
      itemPrice = passenger.ancillaries.seat.price;
    } else if (itemType === 'bag') {
      itemPrice = passenger.ancillaries.bag.price;
    }
    
    const currentMethods = (itemPaymentMethods as any)[itemKey] || {};
    let totalPaid = 0;
    
    if (currentMethods.credit && currentMethods.credit.amount != null) {
      totalPaid += Number(currentMethods.credit.amount) || 0;
    }
    if (currentMethods.vouchers && Array.isArray(currentMethods.vouchers)) {
      currentMethods.vouchers.forEach((voucher: any) => {
        if (voucher && voucher.amount != null) {
          totalPaid += Number(voucher.amount) || 0;
        }
      });
    }
    if (currentMethods.points && currentMethods.points.amount != null) {
      totalPaid += Number(currentMethods.points.amount) || 0;
    }
    
    return {
      total: itemPrice,
      paid: Number.isFinite(totalPaid) ? totalPaid : 0,
      remaining: Math.max(0, itemPrice - (Number.isFinite(totalPaid) ? totalPaid : 0))
    };
  };

  // formatCardNumber: applies spacing per detected scheme (Amex 4-6-5, others 4-4-4-4)
  const formatCardNumber = (value: string) => {
    const number = value.replace(/\D/g, '');
    const cardType = detectCardType(number);
    
    if (cardType === 'American Express') {
      // Amex: 4-6-5 format
      return number.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').substring(0, 17);
    } else {
      // Visa, Mastercard, Discover: 4-4-4-4 format
      return number.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4').substring(0, 19);
    }
  };


  // UI: which method forms to show under each item (supports multiple)
  const [itemMethodForms, setItemMethodForms] = useState<{ [key: string]: Array<'credit' | 'voucher' | 'points'> }>({});
  // Which method is expanded per item (single expand accordion)
  const [itemExpandedMethod, setItemExpandedMethod] = useState<{ [key: string]: number | null }>({});

  // Reservation loading controls
  const [reservationCode, setReservationCode] = useState<string>('');
  const [isReservationLoaded, setIsReservationLoaded] = useState<boolean>(true);

  const loadReservation = () => {
    const trimmed = (reservationCode || '').trim();
    if (!trimmed) {
      console.warn('Reservation code is empty');
      return;
    }
    // Simulate loading reservation by resetting selections and payments
    setSelectedPassengers([]);
    setSelectedItems({});
    setItemPaymentMethods({});
    setItemMethodForms({});
    setItemExpandedMethod({});
    setFieldErrors({});
    setIsReservationLoaded(true);
    console.log('📦 Reservation loaded for code:', trimmed);
  };

  // Load progress on component mount
  useEffect(() => {
    loadProgressFromLocalStorage();
  }, []);

  // Save progress whenever state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveProgressToLocalStorage();
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(timeoutId);
  }, [selectedPassengers, selectedItems, itemPaymentMethods, itemMethodForms, itemExpandedMethod]);

  // getTotalPaidAmount: sums all assigned payment method amounts for an item
  const getTotalPaidAmount = (itemKey: string) => {
    const currentMethods = (itemPaymentMethods as any)[itemKey] || {};
    let totalPaid = 0;
    
    if (currentMethods.credit && currentMethods.credit.amount != null) {
      totalPaid += Number(currentMethods.credit.amount) || 0;
    }
    if (currentMethods.vouchers && Array.isArray(currentMethods.vouchers)) {
      currentMethods.vouchers.forEach((voucher: any) => {
        if (voucher && voucher.amount != null) {
          totalPaid += Number(voucher.amount) || 0;
        }
      });
    }
    if (currentMethods.points && currentMethods.points.amount != null) {
      totalPaid += Number(currentMethods.points.amount) || 0;
    }
    
    return Number.isFinite(totalPaid) ? totalPaid : 0;
  };

  // isItemFullyPaid: convenience to check if total paid >= item price
  const isItemFullyPaid = (itemKey: string) => {
    const [passengerId, itemType] = itemKey.split('-');
    const passengerIndex = resolvePassengerIndex(passengerId);
    const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    if (!passenger) return false;
    let itemPrice = 0;
    
    if (itemType === 'ticket') {
      itemPrice = passenger.ticket.price;
    } else if (itemType === 'seat') {
      itemPrice = passenger.ancillaries.seat.price;
    } else if (itemType === 'bag') {
      itemPrice = passenger.ancillaries.bag.price;
    }
    
    const totalPaid = getTotalPaidAmount(itemKey);
    return totalPaid >= itemPrice;
  };

  // Calculate total paid amount across all selected items
  const totalPaidAmount = passengersWithSelectedItems.reduce((sum, passengerId) => {
    const selectedPassengerItems = selectedItems[passengerId] || [];
    let passengerPaid = 0;
    
    selectedPassengerItems.forEach(itemType => {
      const itemKey = `${passengerId}-${itemType}`;
      passengerPaid += getTotalPaidAmount(itemKey);
    });
    
    return sum + passengerPaid;
  }, 0);

  // Calculate payment progress percentage
  const paymentProgress = total > 0 ? Math.min(100, (totalPaidAmount / total) * 100) : 0;

  // confirmAddMethod: adds a method UI form for an item while respecting constraints
  // - Up to 3 methods total
  // - Only one credit
  // - Up to 3 vouchers
  // - Only one points
  // Also initializes the new method amount with the current remaining balance
  const confirmAddMethod = (itemKey: string, method: 'credit' | 'voucher' | 'points') => {
    console.log('➕ confirmAddMethod called:', { itemKey, method });
    if (!itemKey) return;
    
    // Get the item price
    const [passengerId, itemType] = itemKey.split('-');
    const passengerIndex = resolvePassengerIndex(passengerId);
    const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    if (!passenger) return;
    let itemPrice = 0;
    
    if (itemType === 'ticket') {
      itemPrice = passenger.ticket.price;
    } else if (itemType === 'seat') {
      itemPrice = passenger.ancillaries.seat.price;
    } else if (itemType === 'bag') {
      itemPrice = passenger.ancillaries.bag.price;
    }
    
    // Calculate remaining amount to pay based on current state
    const totalPaid = getTotalPaidAmount(itemKey);
    const formsLen = (itemMethodForms[itemKey] || []).length;
    
    // Calculate remaining amount
    let remainingAmount = Math.max(0, itemPrice - (Number.isFinite(totalPaid) ? totalPaid : 0));
    // If this is the first method being added and remaining is 0 (edge), use full price
    if (formsLen === 0 && remainingAmount === 0) {
      remainingAmount = itemPrice;
    }
    
    // For vouchers, if there are existing vouchers, calculate the remaining amount properly
    if (method === 'voucher') {
      const currentMethods = (itemPaymentMethods as any)[itemKey] || {};
      const existingVouchers = Array.isArray(currentMethods.vouchers) ? currentMethods.vouchers : [];
      if (existingVouchers.length > 0) {
        // Calculate remaining amount based on current payment methods
        const currentTotalPaid = getTotalPaidAmount(itemKey);
        remainingAmount = Math.max(0, itemPrice - currentTotalPaid);
        console.log('🎫 Recalculating remaining amount for additional voucher:', { itemPrice, currentTotalPaid, remainingAmount });
      }
    }
    
    
    // First, initialize structure in itemPaymentMethods so values are ready for first render
    setItemPaymentMethods(prev => {
      const current = { ...prev } as any;
      if (!current[itemKey]) current[itemKey] = {};
      if (method === 'credit') {
        if (!current[itemKey].credit) {
          current[itemKey].credit = { 
            amount: remainingAmount, 
            cardNumber: '', 
            holderName: '', 
            expiryDate: '', 
            cvv: '',
            idNumber: '',
            installments: 1
          };
        } else {
          current[itemKey].credit.amount = remainingAmount;
        }
      }
      if (method === 'voucher') {
        const key = 'vouchers';
        if (!Array.isArray(current[itemKey][key])) current[itemKey][key] = [];
        console.log('🎫 Adding voucher - current length:', current[itemKey][key].length, 'remainingAmount:', remainingAmount);
        
        // Calculate which voucher index this should be based on existing form entries
        const voucherCountInForms = (itemMethodForms[itemKey] || []).filter((m: string) => m === 'voucher').length;
        console.log('🎫 Voucher count in forms:', voucherCountInForms, 'Vouchers in array:', current[itemKey][key].length);
        
        // Only add a new voucher if the array doesn't have enough vouchers yet
        if (current[itemKey][key].length < voucherCountInForms + 1 && current[itemKey][key].length < 2) {
          current[itemKey][key].push({ 
            uatpNumber: '', 
            balance: 0, 
            expirationDate: '', 
            amount: remainingAmount 
          });
          console.log('🎫 Added new voucher, new length:', current[itemKey][key].length);
        } else {
          console.log('🎫 Voucher already exists in array or at limit');
        }
      }
      if (method === 'points' && !current[itemKey].points) {
        current[itemKey].points = { 
          amount: remainingAmount, 
          accountId: '', 
          memberNumber: '', 
          pointsToUse: 0,
          awardReference: '' 
        };
      }
      return current;
    });

    // Then, add the form entry and set expanded index based on the new length
    setItemMethodForms(prev => {
      const current = [...(prev[itemKey] || [])];
      // constraints: max 3 methods per item; only one credit; up to 3 vouchers; only one points
      if (current.length >= 3) return prev;
      if (method === 'credit' && current.includes('credit')) return prev;
      if (method === 'points' && current.includes('points')) return prev;
      current.push(method);
      const nextForms = { ...prev, [itemKey]: current };
      // Set expanded to the last added method index and collapse all others
      setItemExpandedMethod(prevExp => {
        const newExpanded = { ...prevExp };
        // Collapse all other items
        Object.keys(newExpanded).forEach(key => {
          if (key !== itemKey) {
            newExpanded[key] = null;
          }
        });
        // Expand the new method for this item
        newExpanded[itemKey] = current.length - 1;
        return newExpanded;
      });
      return nextForms;
    });
  };

  // updateMethodField: controlled form updates for payment methods per item
  // Enforces that amount never exceeds the current remaining balance (excluding the
  // method's previous value), and allows empty string while typing. Voucher fields
  // receive a voucherIndex to address the correct voucher in the array.
  const updateMethodField = (
    itemKey: string,
    method: 'credit' | 'voucher' | 'points',
    field: string,
    value: string,
    voucherIndex?: number
  ) => {
    console.log('🔧 updateMethodField called:');
    console.log('📋 itemKey:', itemKey);
    console.log('📋 method:', method);
    console.log('📋 field:', field);
    console.log('📋 value:', value);
    console.log('📋 voucherIndex:', voucherIndex);
    
    setItemPaymentMethods(prev => {
      const next = { ...prev } as any;
      if (!next[itemKey]) next[itemKey] = {};
      
      // Coerce amount within remaining balance (excluding this method's previous value)
      let coercedAmount: number | string | null = null;
    if (field === 'amount' || field === 'pointsToUse') {
        // Allow empty while typing
        if (value === '') {
          coercedAmount = '';
        } else {
        const [passengerId, itemType] = itemKey.split('-');
        const passengerIndex = resolvePassengerIndex(passengerId);
        const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
        if (!passenger) return prev;
        let itemPrice = 0;
        if (itemType === 'ticket') {
          itemPrice = passenger.ticket.price;
        } else if (itemType === 'seat') {
          itemPrice = passenger.ancillaries.seat.price;
        } else if (itemType === 'bag') {
          itemPrice = passenger.ancillaries.bag.price;
        }

        const methodsForItem = (prev as any)[itemKey] || {};
        let currentAmountOfThisMethod = 0;
        if (method === 'credit') {
          currentAmountOfThisMethod = Number(methodsForItem?.credit?.amount) || 0;
        } else if (method === 'voucher') {
          // For vouchers, use the specific voucher index
          const idx = typeof voucherIndex === 'number' ? voucherIndex : 0;
            if (field === 'amount') {
          currentAmountOfThisMethod = Number(methodsForItem?.vouchers?.[idx]?.amount) || 0;
            }
        } else if (method === 'points') {
          if (field === 'amount') {
          currentAmountOfThisMethod = Number(methodsForItem?.points?.amount) || 0;
          } else if (field === 'pointsToUse') {
            // For pointsToUse, convert to dollar amount for comparison
            currentAmountOfThisMethod = (Number(methodsForItem?.points?.pointsToUse) || 0) / 50;
          }
        }

        // Calculate total paid excluding the current method being edited
        const totalPaidAll = getTotalPaidAmount(itemKey);
        const totalPaidOther = Math.max(0, totalPaidAll - currentAmountOfThisMethod);
        const remaining = Math.max(0, itemPrice - totalPaidOther);
        
        // For all methods, limit the amount to the remaining balance
        const numericNew = Number(value) || 0;
        if (numericNew > remaining) {
          coercedAmount = remaining;
        } else {
          coercedAmount = numericNew;
        }
        
        // Special handling for pointsToUse field - convert back to points
        if (field === 'pointsToUse' && method === 'points') {
          // For pointsToUse, we don't want to limit by remaining balance
          // because the user is directly specifying the points to use
          coercedAmount = numericNew;
          console.log(`PointsToUse coercion: ${numericNew} -> ${coercedAmount} (no limit)`);
        }
        
        }
      } else if (field === 'balance') {
        // For balance field, allow any positive number without restriction
        if (value === '') {
          coercedAmount = '';
        } else {
          const numericNew = Number(value) || 0;
          coercedAmount = Math.max(0, numericNew);
        }
      }
      if (method === 'credit') {
        next[itemKey].credit = { 
          ...(next[itemKey].credit || { 
            amount: 0, 
            cardNumber: '', 
            holderName: '', 
            expiryDate: '', 
            cvv: '',
            idNumber: '',
            installments: 1
          }), 
          [field]: field === 'amount' ? (coercedAmount ?? 0) : value 
        };
      } else if (method === 'voucher') {
        const list = Array.isArray(next[itemKey].vouchers) ? next[itemKey].vouchers : [];
        const idx = typeof voucherIndex === 'number' ? voucherIndex : 0;
        console.log('🎫 Updating voucher:', { idx, listLength: list.length, field, value, coercedAmount, listBefore: [...list] });
        if (idx < list.length) {
          const oldVoucher = list[idx];
          const newAmount = field === 'amount' ? (coercedAmount ?? 0) : oldVoucher?.amount || 0;
          const oldAmount = oldVoucher?.amount || 0;
          
          list[idx] = { 
            ...(list[idx] || { 
              amount: 0, 
                uatpNumber: '', 
                balance: 0, 
                expirationDate: '' 
            }), 
              [field]: field === 'amount' || field === 'balance' ? (coercedAmount ?? 0) : value 
          };
          
          
          console.log('🎫 Updated voucher:', list[idx]);
        }
        next[itemKey].vouchers = list;
        console.log('🎫 Final vouchers array:', next[itemKey].vouchers);
      } else if (method === 'points') {
        next[itemKey].points = { 
          ...(next[itemKey].points || { 
            amount: 0, 
            accountId: '', 
            memberNumber: '', 
            pointsToUse: 0,
            awardReference: '' 
          }), 
          [field]: field === 'amount' || field === 'pointsToUse' ? (coercedAmount ?? 0) : value 
        };
      }
      console.log('🔄 State updated, new state:', next);
      return next;
    });
  };

  // (removed duplicate resolvePassengerIndex; using the single definition above)



  // Luhn algorithm for credit card validation
  const validateCreditCard = (cardNumber: string) => {
    // Remove all non-digit characters
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // Check if the number is empty or too short
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    // Process digits from right to left
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Check if payment method has all required fields filled
  const isPaymentMethodComplete = (itemKey: string, method: string, methodIndex: number) => {
    const methods = (itemPaymentMethods as any)[itemKey] || {};
    
    if (method === 'credit') {
      const credit = methods.credit;
      return credit && 
             credit.cardNumber && 
             validateCreditCard(credit.cardNumber) &&
             credit.holderName && 
             credit.expiryDate && 
             credit.cvv && 
             credit.idNumber && 
             credit.amount > 0;
    } else if (method === 'voucher') {
      const vouchers = methods.vouchers || [];
      const voucher = vouchers[methodIndex];
      return voucher && 
             voucher.uatpNumber && 
             voucher.balance > 0 && 
             voucher.expirationDate && 
             voucher.amount > 0;
    } else if (method === 'points') {
      const points = methods.points;
      return points && 
             points.memberNumber && 
             points.awardReference && 
             points.amount > 0 && 
             points.pointsToUse > 0;
    }
    
    return false;
  };

  // Copy credit card details to all selected passengers and items
  const copyCreditCardDetails = (sourceItemKey: string) => {
    const sourceCreditData = (itemPaymentMethods as any)[sourceItemKey]?.credit;
    if (!sourceCreditData) return;

    // Get all selected passengers and their items
    const allSelectedItems = Object.entries(selectedItems);
    
    allSelectedItems.forEach(([passengerId, items]) => {
      items.forEach(itemType => {
        const targetItemKey = `${passengerId}-${itemType}`;
        
        // Skip the source item itself
        if (targetItemKey === sourceItemKey) return;
        
        // Only copy to items that have credit payment method or can have one
        const targetMethods = (itemPaymentMethods as any)[targetItemKey] || {};
        
        // If target doesn't have credit method, add it first
        if (!targetMethods.credit) {
          // Add credit method to forms list first
          setItemMethodForms(prev => {
            const newForms = { ...prev };
            if (!newForms[targetItemKey]) newForms[targetItemKey] = [];
            // Add 'credit' to the forms list if not already there
            if (!newForms[targetItemKey].includes('credit')) {
              newForms[targetItemKey] = [...newForms[targetItemKey], 'credit'];
            }
            return newForms;
          });

          // Then add the payment method data
          setItemPaymentMethods(prev => {
            const newMethods = { ...prev } as any;
            if (!newMethods[targetItemKey]) newMethods[targetItemKey] = {};
            
            // Get the item price for amount calculation
            const [targetPassengerId, targetItemType] = targetItemKey.split('-');
            const targetPassengerIndex = resolvePassengerIndex(targetPassengerId);
            const targetPassenger = targetPassengerIndex >= 0 ? reservation.passengers[targetPassengerIndex] : undefined;
            if (!targetPassenger) return newMethods;
            let targetItemPrice = 0;
            if (targetItemType === 'ticket') {
              targetItemPrice = targetPassenger.ticket.price;
            } else if (targetItemType === 'seat') {
              targetItemPrice = targetPassenger.ancillaries.seat.price;
            } else if (targetItemType === 'bag') {
              targetItemPrice = targetPassenger.ancillaries.bag.price;
            }
            
            // Calculate remaining amount for this item
            const totalPaid = getTotalPaidAmount(targetItemKey);
            const remainingAmount = Math.max(0, targetItemPrice - totalPaid);
            
            newMethods[targetItemKey].credit = {
              amount: remainingAmount,
              cardNumber: sourceCreditData.cardNumber,
              holderName: sourceCreditData.holderName,
              expiryDate: sourceCreditData.expiryDate,
              cvv: sourceCreditData.cvv,
              idNumber: sourceCreditData.idNumber,
              installments: sourceCreditData.installments
            };
            
            return newMethods;
          });
        } else {
          // Update existing credit method with copied data
          setItemPaymentMethods(prev => {
            const newMethods = { ...prev } as any;
            if (newMethods[targetItemKey]?.credit) {
              newMethods[targetItemKey].credit = {
                ...newMethods[targetItemKey].credit,
                cardNumber: sourceCreditData.cardNumber,
                holderName: sourceCreditData.holderName,
                expiryDate: sourceCreditData.expiryDate,
                cvv: sourceCreditData.cvv,
                idNumber: sourceCreditData.idNumber,
                installments: sourceCreditData.installments
              };
            }
            return newMethods;
          });
        }
      });
    });
  };

  // removeMethod: removes one method UI form and clears only its stored data
  // Voucher removal computes the voucher-specific index to avoid clearing others.
  const removeMethod = (itemKey: string, index: number) => {
    setItemMethodForms(prev => {
      const arr = [...(prev[itemKey] || [])];
      if (index < 0 || index >= arr.length) return prev;
      const method = arr[index];
      // Compute voucher-specific index BEFORE removing from arr
      const voucherIdx = method === 'voucher' 
        ? arr.slice(0, index).filter(m => m === 'voucher').length 
        : -1;
      arr.splice(index, 1);
      // Also clean data for this method index if voucher
      setItemPaymentMethods(curr => {
        const next = { ...curr } as any;
        if (!next[itemKey]) return next;
        if (method === 'credit') next[itemKey].credit = undefined;
        if (method === 'points') next[itemKey].points = undefined;
        if (method === 'voucher' && Array.isArray(next[itemKey].vouchers)) {
          if (voucherIdx >= 0 && voucherIdx < next[itemKey].vouchers.length) {
            next[itemKey].vouchers.splice(voucherIdx, 1);
          }
          // If vouchers array becomes empty, remove it
          if (next[itemKey].vouchers.length === 0) {
            delete next[itemKey].vouchers;
          }
        }
        // If no methods remain for this item, remove the item key entirely
        const remaining = arr;
        const hasCredit = remaining.includes('credit') && next[itemKey].credit != null;
        const hasPoints = remaining.includes('points') && next[itemKey].points != null;
        const hasVouchers = remaining.filter((m: string) => m === 'voucher').length > 0 && Array.isArray(next[itemKey].vouchers) && next[itemKey].vouchers.length > 0;
        if (!hasCredit && !hasPoints && !hasVouchers) {
          delete next[itemKey];
        }
        return next;
      });
      // Adjust expanded index
      setItemExpandedMethod(prevExp => {
        const currentIndex = prevExp[itemKey];
        if (currentIndex == null) return prevExp;
        let newIndex: number | null = currentIndex;
        if (currentIndex === index) {
          newIndex = arr.length > 0 ? Math.min(index, arr.length - 1) : null;
        } else if (currentIndex > index) {
          newIndex = currentIndex - 1;
        }
        return { ...prevExp, [itemKey]: newIndex };
      });
      return { ...prev, [itemKey]: arr };
    });
  };

  // Keep active tab in sync with selected items
  useEffect(() => {
    const passengersWithItems = Object.entries(selectedItems)
      .filter(([pid, items]) => {
        if (!items || items.length === 0) return false;
        const idx = resolvePassengerIndex(pid);
        const p = idx >= 0 ? reservation.passengers[idx] : undefined;
        if (!p) return false;
        const hasUnpaid = p.ticket.status !== 'Paid' || p.ancillaries.seat.status !== 'Paid' || p.ancillaries.bag.status !== 'Paid';
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

  const getPassengerNameById = (pid: string) => {
    const idx = resolvePassengerIndex(pid);
    return idx >= 0 ? (reservation.passengers[idx]?.name || pid) : pid;
  };

  const getPassengerTabLabel = (pid: string) => {
    const idx = resolvePassengerIndex(pid);
    const passenger = idx >= 0 ? reservation.passengers[idx] : undefined;
    const passengerName = passenger?.name || pid;
    
    // Calculate total amount for selected items
    const selectedPassengerItems = selectedItems[pid] || [];
    let totalAmount = 0;
    
    selectedPassengerItems.forEach(itemType => {
      if (!passenger) return;
      if (itemType === 'ticket' && passenger.ticket.status !== 'Paid') {
        totalAmount += passenger.ticket.price;
      } else if (itemType === 'seat' && passenger.ancillaries.seat.status !== 'Paid') {
        totalAmount += passenger.ancillaries.seat.price;
      } else if (itemType === 'bag' && passenger.ancillaries.bag.status !== 'Paid') {
        totalAmount += passenger.ancillaries.bag.price;
      }
    });
    
    // Calculate total paid amount
    const totalPaid = getTotalPaidAmount(`${pid}-ticket`) + 
                     getTotalPaidAmount(`${pid}-seat`) + 
                     getTotalPaidAmount(`${pid}-bag`);
    
    const remaining = Math.max(0, totalAmount - totalPaid);
    const isFullyPaid = remaining === 0 && totalAmount > 0;
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120, position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          {isFullyPaid ? (
            <Box sx={{ 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              backgroundColor: 'success.main', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              animation: 'pulse 2s infinite'
            }}>
              ✓
            </Box>
          ) : (
            <Box sx={{ 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              backgroundColor: 'grey.400', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              ○
            </Box>
          )}
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
            {passengerName}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          ${totalAmount.toFixed(2)}
        </Typography>
        
        
        {isFullyPaid ? (
          <Typography variant="caption" sx={{ color: 'success.main', fontSize: '0.7rem', fontWeight: 600 }}>
            ✓ Done
          </Typography>
        ) : remaining > 0 ? (
          <Typography variant="caption" sx={{ color: 'warning.main', fontSize: '0.7rem', fontWeight: 600 }}>
            ${remaining.toFixed(2)} left
          </Typography>
        ) : null}
      </Box>
    );
  };

  // Tab PIDs (selected + has unpaid)
  const paymentTabPids = useMemo(() => {
    return Object.entries(selectedItems)
      .filter(([pid, items]) => {
        if (!items || items.length === 0) return false;
        const idx = resolvePassengerIndex(pid);
        const p = idx >= 0 ? reservation.passengers[idx] : undefined;
        if (!p) return false;
        return p.ticket.status !== 'Paid' || p.ancillaries.seat.status !== 'Paid' || p.ancillaries.bag.status !== 'Paid';
      })
      .map(([pid]) => pid);
  }, [selectedItems]);

  const goToNextPassenger = () => {
    if (!activePaymentPassenger || activePaymentPassenger === '') return;
    const i = paymentTabPids.indexOf(activePaymentPassenger);
    if (i >= 0 && i < paymentTabPids.length - 1) {
      setActivePaymentPassenger(paymentTabPids[i + 1]);
    }
  };


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
          itemName = 'Seat Selection';
          amount = passengerData.ancillaries.seat.price;
        } else if (itemType === 'bag') {
          itemName = 'Baggage';
          amount = passengerData.ancillaries.bag.price;
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

  if (!isClient) {
  return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h4">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 2 }}>
      <Container maxWidth="xl" sx={{display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h3" component="h1" align="center" sx={{ mb: 4, fontWeight: 'bold', color: 'grey.800' }}>
          PCI
        </Typography>
        

        <Grid container spacing={3} sx={{ flex: 1, height: '100%' }}>
          {/* סקשן נוסעים - שמאל - 25% */}
          <Grid size={{ xs: 12, lg: 3 }} style={{ height: '100vh' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'semibold' }}>
                    Passenger Details
                  </Typography>
                </Box>
                
                <PassengerHeader
                  reservationCode={reservationCode}
                  onChangeReservationCode={(v) => setReservationCode(v)}
                  onLoad={loadReservation}
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
                      if (passengerData.ancillaries.seat.status !== 'Paid') unpaidItems.push('seat');
                      if (passengerData.ancillaries.bag.status !== 'Paid') unpaidItems.push('bag');
                      
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
                        if (passengerData.ancillaries.seat.status !== 'Paid') itemsToSelect.push('seat');
                        if (passengerData.ancillaries.bag.status !== 'Paid') itemsToSelect.push('bag');
                        
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
                      if (passengerData.ancillaries.seat.status !== 'Paid') unpaidItems.push('seat');
                      if (passengerData.ancillaries.bag.status !== 'Paid') unpaidItems.push('bag');
                      
                      return unpaidItems.every(item => passengerItems.includes(item));
                    });
                      return allAvailableItemsSelected;
                    })()}
                />
                
                <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                  {availablePassengers.map((passenger) => {
                    const passengerIndex = parseInt(passenger.id) - 1;
                    const passengerData = reservation.passengers[passengerIndex];
                    const isExpanded = expandedPassengers.includes(passenger.id);
                    
                    return (
                      <Paper
                        key={passenger.id}
                        elevation={2}
                        sx={{
                          mb: 1.5,
                          border: 1,
                          borderColor: 'grey.300',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Passenger Header */}
                        <Box
                          sx={{
                            p: 1.5,
                            cursor: passenger.hasUnpaidItems ? 'pointer' : 'not-allowed',
                            bgcolor: (() => {
                              if (!passenger.hasUnpaidItems) return 'grey.100';
                              // Keep header background neutral (no blue) regardless of selection
                              return 'white';
                            })(),
                            color: (() => {
                              if (!passenger.hasUnpaidItems) return 'grey.500';
                              // Keep default text color; no forced white text
                              return 'inherit';
                            })(),
                            opacity: passenger.hasUnpaidItems ? 1 : 0.6,
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: (() => {
                                if (!passenger.hasUnpaidItems) return 'grey.100';
                                return 'grey.50';
                              })()
                            }
                          }}
                          onClick={() => {
                            if (passenger.hasUnpaidItems) {
                              togglePassenger(passenger.id);
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <PersonIcon sx={{ mr: 1 }} />
                              <Typography 
                                variant="body1" 
                                sx={{ fontWeight: 'medium', mr: 2, cursor: 'pointer', userSelect: 'none' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (passenger.hasUnpaidItems) {
                                    toggleAllItemsForPassenger(passenger.id);
                                  }
                                }}
                                title="Select/Deselect all items for this passenger"
                              >
                                {passenger.fullName}
                              </Typography>
                              
                              {/* Product Icons - Show all items, gray out unselected, clickable */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
                                {/* Flight Ticket Icon */}
                                <Box
                                  sx={{
                                    position: 'relative',
                                    cursor: passengerData.ticket.status === 'Paid' ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      transform: passengerData.ticket.status === 'Paid' ? 'none' : 'scale(1.1)'
                                    }
                                  }}
                                  title={passengerData.ticket.status === 'Paid' ? 'Flight Ticket Already Paid' : (isItemSelected(passenger.id, 'ticket') ? 'Click to deselect Flight Ticket' : 'Click to select Flight Ticket')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (passengerData.ticket.status !== 'Paid') {
                                      toggleItem(passenger.id, 'ticket');
                                    }
                                  }}
                                >
                                  <FlightIcon
                                    sx={{
                                      fontSize: 20,
                                      color: (() => {
                                        if (passengerData.ticket.status === 'Paid') return 'grey.500';
                                        return isItemSelected(passenger.id, 'ticket') ? 'success.main' : 'success.main';
                                      })(),
                                      opacity: passengerData.ticket.status === 'Paid' ? 0.3 : 1,
                                      zIndex: 2,
                                      position: 'relative'
                                    }}
                                  />
                                  {/* Background circle only when selected */}
                                  {isItemSelected(passenger.id, 'ticket') && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        border: '2px solid',
                                        borderColor: 'success.main',
                                        zIndex: 0
                                      }}
                                    />
                                  )}
                                </Box>
                                
                                {/* Seat Icon */}
                                <Box
                                  sx={{
                                    position: 'relative',
                                    cursor: passengerData.ancillaries.seat.status === 'Paid' ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      transform: passengerData.ancillaries.seat.status === 'Paid' ? 'none' : 'scale(1.1)'
                                    }
                                  }}
                                  title={passengerData.ancillaries.seat.status === 'Paid' ? 'Seat Already Paid' : (isItemSelected(passenger.id, 'seat') ? 'Click to deselect Seat' : 'Click to select Seat')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (passengerData.ancillaries.seat.status !== 'Paid') {
                                      toggleItem(passenger.id, 'seat');
                                    }
                                  }}
                                >
                                  <SeatIcon
                                    sx={{
                                      fontSize: 20,
                                      color: (() => {
                                        if (passengerData.ancillaries.seat.status === 'Paid') return 'grey.500';
                                        return isItemSelected(passenger.id, 'seat') ? 'info.main' : 'info.main';
                                      })(),
                                      opacity: passengerData.ancillaries.seat.status === 'Paid' ? 0.3 : 1,
                                      zIndex: 2,
                                      position: 'relative'
                                    }}
                                  />
                                  {/* Background circle only when selected */}
                                  {isItemSelected(passenger.id, 'seat') && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        border: '2px solid',
                                        borderColor: 'info.main',
                                        zIndex: 0
                                      }}
                                    />
                                  )}
                                </Box>
                                
                                {/* Baggage Icon */}
                                <Box
                                  sx={{
                                    position: 'relative',
                                    cursor: passengerData.ancillaries.bag.status === 'Paid' ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      transform: passengerData.ancillaries.bag.status === 'Paid' ? 'none' : 'scale(1.1)'
                                    }
                                  }}
                                  title={passengerData.ancillaries.bag.status === 'Paid' ? 'Baggage Already Paid' : (isItemSelected(passenger.id, 'bag') ? 'Click to deselect Baggage' : 'Click to select Baggage')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (passengerData.ancillaries.bag.status !== 'Paid') {
                                      toggleItem(passenger.id, 'bag');
                                    }
                                  }}
                                >
                                  <BagIcon
                                    sx={{
                                      fontSize: 20,
                                      color: (() => {
                                        if (passengerData.ancillaries.bag.status === 'Paid') return 'grey.500';
                                        return isItemSelected(passenger.id, 'bag') ? 'warning.main' : 'warning.main';
                                      })(),
                                      opacity: passengerData.ancillaries.bag.status === 'Paid' ? 0.3 : 1,
                                      zIndex: 2,
                                      position: 'relative'
                                    }}
                                  />
                                  {/* Background circle only when selected */}
                                  {isItemSelected(passenger.id, 'bag') && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        border: '2px solid',
                                        borderColor: 'warning.main',
                                        zIndex: 0
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <IconButton
                                size="small"
                                disabled={!passenger.hasUnpaidItems}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (passenger.hasUnpaidItems) {
                                    toggleExpanded(passenger.id);
                                  }
                                }}
                                sx={{
                                  opacity: passenger.hasUnpaidItems ? 1 : 0.3,
                                  color: passenger.hasUnpaidItems ? 'inherit' : 'grey.500'
                                }}
                              >
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <Box sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                            {/* Flight Ticket */}
                            <Paper
                              sx={{
                                p: 1,
                                mb: 0.5,
                                cursor: passengerData.ticket.status === 'Paid' ? 'not-allowed' : 'pointer',
                                border: 1,
                                borderColor: (() => {
                                  if (passengerData.ticket.status === 'Paid') return 'grey.400';
                                  return isItemSelected(passenger.id, 'ticket') ? 'success.main' : 'grey.300';
                                })(),
                                bgcolor: (() => {
                                  if (passengerData.ticket.status === 'Paid') return 'grey.100';
                                  return isItemSelected(passenger.id, 'ticket') ? 'success.light' : 'white';
                                })(),
                                opacity: passengerData.ticket.status === 'Paid' ? 0.6 : 1,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: passengerData.ticket.status === 'Paid' ? 'grey.400' : 'success.main',
                                  bgcolor: passengerData.ticket.status === 'Paid' ? 'grey.100' : (isItemSelected(passenger.id, 'ticket') ? 'success.main' : 'success.light')
                                }
                              }}
                              onClick={() => {
                                if (passengerData.ticket.status !== 'Paid') {
                                  toggleItem(passenger.id, 'ticket');
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                  <FlightIcon sx={{ mr: 1, color: passengerData.ticket.status === 'Paid' ? 'grey.500' : 'primary.main', fontSize: 18 }} />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                                      Flight Ticket
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                      {passengerData.ticket.ticketNumber}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ 
                                    color: passengerData.ticket.status === 'Paid' ? 'success.main' : 'warning.main',
                                    fontWeight: 'medium',
                                    fontSize: '0.75rem'
                                  }}>
                                    {passengerData.ticket.status}
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem',
                                    color: 'primary.main'
                                  }}>
                                    ${passengerData.ticket.price}
                                  </Typography>
                                  {isItemSelected(passenger.id, 'ticket') && (
                                    <CheckIcon sx={{ color: 'success.main', fontSize: 16 }} />
                                  )}
                                </Box>
                              </Box>
                            </Paper>

                            {/* Ancillaries */}
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                              Ancillaries:
                            </Typography>
                            
                            {/* Seat */}
                            <Paper
                              sx={{
                                p: 1,
                                mb: 0.5,
                                cursor: passengerData.ancillaries.seat.status === 'Paid' ? 'not-allowed' : 'pointer',
                                border: 1,
                                borderColor: (() => {
                                  if (passengerData.ancillaries.seat.status === 'Paid') return 'grey.400';
                                  return isItemSelected(passenger.id, 'seat') ? 'info.main' : 'grey.300';
                                })(),
                                bgcolor: (() => {
                                  if (passengerData.ancillaries.seat.status === 'Paid') return 'grey.100';
                                  return isItemSelected(passenger.id, 'seat') ? 'info.light' : 'white';
                                })(),
                                opacity: passengerData.ancillaries.seat.status === 'Paid' ? 0.6 : 1,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: passengerData.ancillaries.seat.status === 'Paid' ? 'grey.400' : 'info.main',
                                  bgcolor: passengerData.ancillaries.seat.status === 'Paid' ? 'grey.100' : (isItemSelected(passenger.id, 'seat') ? 'info.main' : 'info.light')
                                }
                              }}
                              onClick={() => {
                                if (passengerData.ancillaries.seat.status !== 'Paid') {
                                  toggleItem(passenger.id, 'seat');
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                  <SeatIcon sx={{ mr: 1, color: passengerData.ancillaries.seat.status === 'Paid' ? 'grey.500' : 'info.main', fontSize: 18 }} />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                                      Seat Selection
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                      {passengerData.ancillaries.seat.emdNumber}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ 
                                    color: passengerData.ancillaries.seat.status === 'Paid' ? 'success.main' : 'warning.main',
                                    fontWeight: 'medium',
                                    fontSize: '0.75rem'
                                  }}>
                                    {passengerData.ancillaries.seat.status}
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem',
                                    color: 'primary.main'
                                  }}>
                                    ${passengerData.ancillaries.seat.price}
                                  </Typography>
                                  {isItemSelected(passenger.id, 'seat') && (
                                    <CheckIcon sx={{ color: 'info.main', fontSize: 16 }} />
                                  )}
                                </Box>
                              </Box>
                            </Paper>

                            {/* Baggage */}
                            <Paper
                              sx={{
                                p: 1,
                                cursor: passengerData.ancillaries.bag.status === 'Paid' ? 'not-allowed' : 'pointer',
                                border: 1,
                                borderColor: (() => {
                                  if (passengerData.ancillaries.bag.status === 'Paid') return 'grey.400';
                                  return isItemSelected(passenger.id, 'bag') ? 'warning.main' : 'grey.300';
                                })(),
                                bgcolor: (() => {
                                  if (passengerData.ancillaries.bag.status === 'Paid') return 'grey.100';
                                  return isItemSelected(passenger.id, 'bag') ? 'warning.light' : 'white';
                                })(),
                                opacity: passengerData.ancillaries.bag.status === 'Paid' ? 0.6 : 1,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: passengerData.ancillaries.bag.status === 'Paid' ? 'grey.400' : 'warning.main',
                                  bgcolor: passengerData.ancillaries.bag.status === 'Paid' ? 'grey.100' : (isItemSelected(passenger.id, 'bag') ? 'warning.main' : 'warning.light')
                                }
                              }}
                              onClick={() => {
                                if (passengerData.ancillaries.bag.status !== 'Paid') {
                                  toggleItem(passenger.id, 'bag');
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                  <BagIcon sx={{ mr: 1, color: passengerData.ancillaries.bag.status === 'Paid' ? 'grey.500' : 'warning.main', fontSize: 18 }} />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                                      Baggage
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                      {passengerData.ancillaries.bag.emdNumber}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ 
                                    color: passengerData.ancillaries.bag.status === 'Paid' ? 'success.main' : 'warning.main',
                                    fontWeight: 'medium',
                                    fontSize: '0.75rem'
                                  }}>
                                    {passengerData.ancillaries.bag.status}
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem',
                                    color: 'primary.main'
                                  }}>
                                    ${passengerData.ancillaries.bag.price}
                                  </Typography>
                                  {isItemSelected(passenger.id, 'bag') && (
                                    <CheckIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                                  )}
                                </Box>
                              </Box>
                            </Paper>
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              </CardContent>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.100', m: 2, mt: 0 }}>
                <Typography variant="body2" color="text.secondary">
                  {passengersWithSelectedItems.length} passengers selected
                </Typography>
              </Paper>
            </Card>
          </Grid>

          {/* סקשן אמצעי תשלום - אמצע - 50% */}
          <Grid size={{ xs: 12, lg: 6 }} style={{ height: '100vh' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CreditCardIcon sx={{ color: 'success.main', mr: 1, fontSize: 28 }} />
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
                  isItemFullyPaid={isItemFullyPaid}
                  confirmAddMethod={confirmAddMethod}
                  isPaymentMethodComplete={isPaymentMethodComplete}
                  updateMethodField={updateMethodField}
                  setItemExpandedMethod={setItemExpandedMethod}
                  removeMethod={removeMethod}
                />

                {/* No items selected message */}
                {getSelectedItemsDetails().length === 0 && (
                  <Box sx={{ mb: 3, p: 3, textAlign: 'center', bgcolor: 'grey.100', borderRadius: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                      No items selected for payment
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
                      <ReceiptLongIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Payment Summary
                  </Typography>
                      <Typography variant="caption" color="text.secondary">
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
                      color="primary" 
                      variant="outlined"
                    />
                    <Chip 
                      icon={<ShoppingCartIcon />} 
                      label={`${Object.values(selectedItems).flat().length} Items`} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  </Box>
                  </Box>

                  {/* Payment Progress Bar */}
                  {total > 0 && (
                    <Box sx={{ mb: 3, px: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Payment Progress
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: paymentProgress === 100 ? 'success.main' : 'primary.main' }}>
                          {paymentProgress.toFixed(1)}%
                    </Typography>
                  </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 8, 
                        backgroundColor: 'grey.200', 
                        borderRadius: 4,
                        overflow: 'hidden',
                        position: 'relative',
                        mb: 1.5
                      }}>
                        <Box sx={{
                          width: `${paymentProgress}%`,
                          height: '100%',
                          backgroundColor: paymentProgress === 100 ? 'success.main' : 'primary.main',
                          borderRadius: 4,
                          transition: 'all 0.3s ease-in-out'
                        }} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                          Total: ${total.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
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
                  confirmDisabled={Object.values(selectedItems).flat().length === 0}
                />
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}
