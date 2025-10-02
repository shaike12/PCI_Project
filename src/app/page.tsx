'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Tabs, Tab, Stack } from '@mui/material';
import { MOCK_RESERVATION, Reservation } from '@/types/reservation';

interface Passenger {
  id: string;
  fullName: string;
  hasUnpaidItems: boolean;
}


export default function PaymentPortal() {
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

  // Calculate costs only for passengers with selected items
  const passengersWithSelectedItems = Object.keys(selectedItems);
  
  const flightPrice = passengersWithSelectedItems.reduce((sum, passengerId) => {
    const passengerIndex = parseInt(passengerId) - 1;
    const passenger = reservation.passengers[passengerIndex];
    const selectedPassengerItems = selectedItems[passengerId] || [];
    
    // Only count ticket price if ticket is selected and not paid
    if (selectedPassengerItems.includes('ticket') && passenger.ticket.status !== 'Paid') {
      return sum + passenger.ticket.price;
    }
    return sum;
  }, 0);
  
  const additionalServices = passengersWithSelectedItems.reduce((sum, passengerId) => {
    const passengerIndex = parseInt(passengerId) - 1;
    const passenger = reservation.passengers[passengerIndex];
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
  
  const total = flightPrice + additionalServices;

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
        
        // Auto-assign credit card payment to this item
        const itemKey = `${passengerId}-${itemType}`;
        setItemPaymentMethods(prev => ({
          ...prev,
          [itemKey]: {
            credit: { amount: 0, cardId: 'default-card' } // Will be calculated based on item amount
          }
        }));
        
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
    const passenger = reservation.passengers[passengerIndex];
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
    const passenger = reservation.passengers[passengerIndex];
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
    const passenger = reservation.passengers[passengerIndex];
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
        const passenger = reservation.passengers[passengerIndex];
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

  // Helper: resolve passenger index from possibly non-numeric ids (e.g., 'p1', 'passenger-2')
  function resolvePassengerIndex(passengerId: string): number {
    if (!passengerId) return 0;
    // Try direct numeric
    if (/^\d+$/.test(passengerId)) {
      const idx = Number(passengerId) - 1;
      return reservation.passengers[idx] ? idx : 0;
    }
    // Extract first number found
    const match = passengerId.match(/\d+/);
    if (match) {
      const idx = Number(match[0]) - 1;
      return reservation.passengers[idx] ? idx : 0;
    }
    // Fallback
    return 0;
  }

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
        const idx = parseInt(pid) - 1;
        const p = reservation.passengers[idx];
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
    const idx = parseInt(pid) - 1;
    return reservation.passengers[idx]?.name || pid;
  };

  const getPassengerTabLabel = (pid: string) => {
    const idx = parseInt(pid) - 1;
    const passenger = reservation.passengers[idx];
    const passengerName = passenger?.name || pid;
    
    // Calculate total amount for selected items
    const selectedPassengerItems = selectedItems[pid] || [];
    let totalAmount = 0;
    
    selectedPassengerItems.forEach(itemType => {
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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
          {passengerName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          ${totalAmount.toFixed(2)}
        </Typography>
        {isFullyPaid ? (
          <Typography variant="caption" sx={{ color: 'success.main', fontSize: '0.7rem', fontWeight: 600 }}>
            ✓ Paid
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
        const idx = parseInt(pid) - 1;
        const p = reservation.passengers[idx];
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
      const passengerIndex = parseInt(passengerId) - 1;
      const passengerData = reservation.passengers[passengerIndex];
      
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
                
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    // Check if all available items are selected (only for passengers with unpaid items)
                    const passengersWithUnpaidItems = availablePassengers.filter(p => p.hasUnpaidItems);
                    const allAvailableItemsSelected = passengersWithUnpaidItems.every(passenger => {
                      const passengerIndex = parseInt(passenger.id) - 1;
                      const passengerData = reservation.passengers[passengerIndex];
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
                        const passengerIndex = parseInt(passenger.id) - 1;
                        const passengerData = reservation.passengers[passengerIndex];
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
                  sx={{ 
                    mb: 2,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'primary.50'
                    }
                  }}
                >
                  {(() => {
                    // Check if all available items are selected
                    const allAvailableItemsSelected = availablePassengers.every(passenger => {
                      const passengerIndex = parseInt(passenger.id) - 1;
                      const passengerData = reservation.passengers[passengerIndex];
                      const passengerItems = selectedItems[passenger.id] || [];
                      
                      const unpaidItems = [];
                      if (passengerData.ticket.status !== 'Paid') unpaidItems.push('ticket');
                      if (passengerData.ancillaries.seat.status !== 'Paid') unpaidItems.push('seat');
                      if (passengerData.ancillaries.bag.status !== 'Paid') unpaidItems.push('bag');
                      
                      return unpaidItems.every(item => passengerItems.includes(item));
                    });
                    
                    return allAvailableItemsSelected ? 'Deselect All Items' : 'Select All Items';
                  })()}
                </Button>
                
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
                              <Typography variant="body1" sx={{ fontWeight: 'medium', mr: 2 }}>
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
                {Object.values(selectedItems).flat().length > 0 && (
                  <Box sx={{ mb: 2, minHeight: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Tabs
                      value={activePaymentPassenger || false}
                      onChange={(_, v) => setActivePaymentPassenger(v)}
                      variant="scrollable"
                      scrollButtons="auto"
                      allowScrollButtonsMobile
                      sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                      {Object.entries(selectedItems)
                        .filter(([pid, items]) => {
                          if (!items || items.length === 0) return false;
                          const idx = parseInt(pid) - 1;
                          const p = reservation.passengers[idx];
                          const hasUnpaid = p.ticket.status !== 'Paid' || p.ancillaries.seat.status !== 'Paid' || p.ancillaries.bag.status !== 'Paid';
                          return hasUnpaid;
                        })
                        .map(([pid]) => (
                          <Tab key={pid} value={pid} label={getPassengerTabLabel(pid)} />
                        ))}
                    </Tabs>

                    {activePaymentPassenger && activePaymentPassenger !== '' && (
                      <Paper sx={{ p: 2, mt: 2, border: 1, borderColor: 'grey.300', bgcolor: 'white', minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, overflowY: 'auto', pr: 1 }}>
                          {(selectedItems[activePaymentPassenger] || []).map((itemType) => {
                            const pIndex = parseInt(activePaymentPassenger) - 1;
                            const p = reservation.passengers[pIndex];
                            let title = '';
                            let price = 0;
                            let color: any = 'primary.main';
                            let icon: any = <FlightIcon sx={{ fontSize: 18, mr: 1 }} />;
                            if (itemType === 'ticket') {
                              title = 'Flight Ticket';
                              price = p.ticket.price;
                              color = 'success.main';
                              icon = <FlightIcon sx={{ fontSize: 18, mr: 1 }} />;
                            } else if (itemType === 'seat') {
                              title = 'Seat Selection';
                              price = p.ancillaries.seat.price;
                              color = 'info.main';
                              icon = <SeatIcon sx={{ fontSize: 18, mr: 1 }} />;
                            } else if (itemType === 'bag') {
                              title = 'Baggage';
                              price = p.ancillaries.bag.price;
                              color = 'warning.main';
                              icon = <BagIcon sx={{ fontSize: 18, mr: 1 }} />;
                            }

                            const itemKey = `${activePaymentPassenger}-${itemType}`;
                            const formMethods = itemMethodForms[itemKey] || [];
                            return (
                              <Paper key={`${activePaymentPassenger}-${itemType}`} sx={{ p: 1.5, border: 1, borderColor: 'grey.200' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {icon}
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                      {title}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color }}>
                                      ${price.toLocaleString()}
                                    </Typography>
                                    {(() => {
                                      const amounts = getRemainingAmount(itemKey);
                                      // Always show remaining indicator while editing forms
                                      const showAlways = true;
                                      if (showAlways || amounts.paid > 0) {
                                        return (
                                          <Typography variant="caption" sx={{ 
                                            color: amounts.remaining > 0 ? 'warning.main' : 'success.main',
                                            fontWeight: 'medium'
                                          }}>
                                            {amounts.remaining > 0 
                                              ? `Remaining: $${amounts.remaining.toLocaleString()}` 
                                              : 'Fully Paid'
                                            }
                                          </Typography>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </Box>
                                </Box>

                                {/* Add payment method trigger */}
                                {formMethods.length === 0 && !isItemFullyPaid(itemKey) && (
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => confirmAddMethod(itemKey, 'credit')}
                                      sx={{ 
                                        color: 'success.main',
                                        '&:hover': { bgcolor: 'success.light', color: 'white' },
                                        border: 1,
                                        borderColor: 'success.main',
                                        width: 32,
                                        height: 32
                                      }}
                                      title="Add Credit Card"
                                    >
                                      <CreditCardIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => confirmAddMethod(itemKey, 'voucher')}
                                      sx={{ 
                                        color: 'warning.main',
                                        '&:hover': { bgcolor: 'warning.light', color: 'white' },
                                        border: 1,
                                        borderColor: 'warning.main',
                                        width: 32,
                                        height: 32
                                      }}
                                      title="Add Voucher"
                                    >
                                      <VoucherIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => confirmAddMethod(itemKey, 'points')}
                                      sx={{ 
                                        color: 'info.main',
                                        '&:hover': { bgcolor: 'info.light', color: 'white' },
                                        border: 1,
                                        borderColor: 'info.main',
                                        width: 32,
                                        height: 32
                                      }}
                                      title="Add Points"
                                    >
                                      <PointsIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Box>
                                )}

                                {/* Dynamic forms for chosen methods */}
                                {formMethods.map((method, idx) => {
                                  const expanded = itemExpandedMethod[itemKey] === idx;
                                  const paymentData = (itemPaymentMethods as any)[itemKey] || {};
                                  let methodAmount = 0;
                                  if (method === 'credit') {
                                    methodAmount = Number(paymentData?.credit?.amount) || 0;
                                  } else if (method === 'voucher') {
                                    // For vouchers, compute this form's voucher index
                                    const voucherIdx = formMethods.slice(0, idx).filter(m => m === 'voucher').length;
                                    methodAmount = Number(paymentData?.vouchers?.[voucherIdx]?.amount) || 0;
                                  } else if (method === 'points') {
                                    methodAmount = Number(paymentData?.points?.amount) || 0;
                                  }
                                  return (
                                  <Paper key={`${itemKey}-method-${idx}`} sx={{ p: 1.5, mt: 1, border: 1, borderColor: expanded ? 'primary.light' : 'grey.100', bgcolor: expanded ? 'white' : 'grey.50' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: expanded ? 1 : 0 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                        {method === 'credit' ? 'Credit Card' : method === 'voucher' ? 'Voucher' : 'Points'}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                          ${methodAmount.toLocaleString()}
                                        </Typography>
                                        <IconButton 
                                          size="small" 
                                          onClick={() => {
                                            if (expanded) {
                                              // If currently expanded, just collapse this one
                                              setItemExpandedMethod(prev => ({ ...prev, [itemKey]: null }));
                                            } else {
                                              // If not expanded, expand this one and collapse all others
                                              setItemExpandedMethod(prev => {
                                                const newExpanded: { [key: string]: number | null } = {};
                                                // Collapse all items first
                                                Object.keys(prev).forEach(key => {
                                                  newExpanded[key] = null;
                                                });
                                                // Expand the clicked method
                                                newExpanded[itemKey] = idx;
                                                return newExpanded;
                                              });
                                            }
                                          }}
                                          sx={{ color: 'primary.main' }}
                                        >
                                          {expanded ? <ExpandLessIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                                        </IconButton>
                                        <IconButton 
                                          size="small" 
                                          color="error" 
                                          onClick={() => removeMethod(itemKey, idx)}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                    {expanded && method === 'credit' && (
                                      <Box sx={{ 
                                        mt: 2, 
                                        p: 3, 
                                        bgcolor: 'grey.50', 
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'grey.200'
                                      }}>
                                        <Typography variant="subtitle2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}>
                                          Credit Card Details
                                            </Typography>
                                        
                                        {/* Payment Amount */}
                                        <Box sx={{ mb: 2.5 }}>
                                          <TextField 
                                            fullWidth
                                            size="medium" 
                                            sx={{ 
                                              '& .MuiInputBase-root': { height: 48 }, 
                                              '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                              '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                            }} 
                                            label="Payment Amount" 
                                            placeholder="$0.00"
                                            InputLabelProps={{ shrink: true }}
                                            type="number" 
                                            value={(() => {
                                              const storedAmount = paymentData?.credit?.amount;
                                              const fallbackAmount = getRemainingAmount(itemKey).remaining;
                                              return (storedAmount === '' || storedAmount == null) ? fallbackAmount : storedAmount;
                                            })()} 
                                            inputProps={{ suppressHydrationWarning: true }} 
                                            onChange={(e) => updateMethodField(itemKey, 'credit', 'amount', e.target.value)} 
                                            />
                                          </Box>
                                        
                                        {/* Card Number */}
                                        <Box sx={{ mb: 2.5 }}>
                                          <Box sx={{ position: 'relative' }}>
                                          <TextField 
                                              fullWidth
                                              size="medium" 
                                            sx={{ 
                                                '& .MuiInputBase-root': { 
                                                  height: 48,
                                                  paddingRight: (paymentData?.credit?.cardNumber ?? '').length > 0 ? '80px' : '16px'
                                                }, 
                                                '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                                '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                            }} 
                                            label="Card Number" 
                                            placeholder="1234 5678 9012 3456"
                                            InputLabelProps={{ shrink: true }}
                                            value={(paymentData?.credit?.cardNumber ?? '')} 
                                            inputProps={{ 
                                              suppressHydrationWarning: true,
                                              maxLength: 19,
                                              inputMode: 'numeric'
                                            }} 
                                            onChange={(e) => {
                                              const formatted = formatCardNumber(e.target.value);
                                              updateMethodField(itemKey, 'credit', 'cardNumber', formatted);
                                            }} 
                                          />
                                            {(paymentData?.credit?.cardNumber ?? '').length > 0 && (
                                              <Box sx={{
                                                position: 'absolute',
                                                right: 12,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                pointerEvents: 'none'
                                              }}>
                                                <Box sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5
                                                }}>
                                                  {getCardIcon(detectCardType(paymentData?.credit?.cardNumber ?? ''))}
                                                  <Typography variant="caption" sx={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    color: detectCardType(paymentData?.credit?.cardNumber ?? '') === 'Unknown' ? 'text.secondary' : 'primary.main'
                                                  }}>
                                                    {detectCardType(paymentData?.credit?.cardNumber ?? '')}
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            )}
                                          </Box>
                                        </Box>

                                        {/* Cardholder Name */}
                                        <Box sx={{ mb: 2.5 }}>
                                        <TextField 
                                            fullWidth
                                            size="medium" 
                                          sx={{ 
                                              '& .MuiInputBase-root': { height: 48 }, 
                                              '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                              '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                          }} 
                                          label="Cardholder Name" 
                                          placeholder="Full name as on card"
                                          InputLabelProps={{ shrink: true }}
                                          value={(paymentData?.credit?.holderName ?? '')} 
                                          inputProps={{ suppressHydrationWarning: true }} 
                                          onChange={(e) => updateMethodField(itemKey, 'credit', 'holderName', e.target.value)} 
                                        />
                                        </Box>

                                        {/* Expiry and CVV */}
                                        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                                        <TextField 
                                            size="medium" 
                                          sx={{ 
                                              flex: 1,
                                              '& .MuiInputBase-root': { height: 48 }, 
                                              '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                              '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                            }} 
                                            label="Expiry Date" 
                                          placeholder="MM/YY"
                                          InputLabelProps={{ shrink: true }}
                                          value={(paymentData?.credit?.expiryDate ?? '')} 
                                          inputProps={{ 
                                            suppressHydrationWarning: true,
                                            maxLength: 5,
                                            inputMode: 'numeric'
                                          }} 
                                          onChange={(e) => {
                                            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                            if (value.length >= 2) {
                                              value = value.substring(0, 2) + '/' + value.substring(2, 4);
                                            }
                                            updateMethodField(itemKey, 'credit', 'expiryDate', value);
                                          }} 
                                        />
                                          <TextField 
                                            size="medium" 
                                            sx={{ 
                                              flex: 1,
                                              '& .MuiInputBase-root': { height: 48 }, 
                                              '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                              '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                            }} 
                                            label="CVV" 
                                            placeholder="123"
                                            InputLabelProps={{ shrink: true }}
                                            value={(paymentData?.credit?.cvv ?? '')} 
                                            inputProps={{ 
                                              suppressHydrationWarning: true,
                                              maxLength: 4,
                                              inputMode: 'numeric'
                                            }} 
                                            onChange={(e) => {
                                              const value = e.target.value.replace(/\D/g, ''); // Only digits
                                              updateMethodField(itemKey, 'credit', 'cvv', value);
                                            }} 
                                          />
                                        </Box>

                                        {/* ID Number and Installments */}
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                          <TextField 
                                            size="medium" 
                                            sx={{ 
                                              flex: 1,
                                              '& .MuiInputBase-root': { height: 48 }, 
                                              '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                              '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                            }} 
                                            label="ID Number" 
                                            placeholder="123456789"
                                            InputLabelProps={{ shrink: true }}
                                            value={(paymentData?.credit?.idNumber ?? '')} 
                                            inputProps={{ 
                                              suppressHydrationWarning: true,
                                              maxLength: 9,
                                              inputMode: 'numeric'
                                            }} 
                                            onChange={(e) => {
                                              const value = e.target.value.replace(/\D/g, ''); // Only digits
                                              updateMethodField(itemKey, 'credit', 'idNumber', value);
                                            }} 
                                          />
                                          <TextField 
                                            size="medium" 
                                            select
                                            sx={{ 
                                              flex: 1,
                                              '& .MuiInputBase-root': { height: 48 }, 
                                              '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                              '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                            }} 
                                            label="Installments" 
                                            value={(paymentData?.credit?.installments ?? 1)} 
                                            onChange={(e) => updateMethodField(itemKey, 'credit', 'installments', e.target.value.toString())}
                                            inputProps={{ suppressHydrationWarning: true }}
                                          >
                                            <MenuItem value={1}>1 Payment</MenuItem>
                                            <MenuItem value={2}>2 Payments</MenuItem>
                                            <MenuItem value={3}>3 Payments</MenuItem>
                                            <MenuItem value={4}>4 Payments</MenuItem>
                                            <MenuItem value={5}>5 Payments</MenuItem>
                                          </TextField>
                                        </Box>
                                      </Box>
                                    )}
                                    {expanded && method === 'voucher' && (() => {
                                      const voucherIdx = formMethods.slice(0, idx).filter(m => m === 'voucher').length;
                                      return (
                                        <Box sx={{ 
                                          mt: 2, 
                                          p: 3, 
                                          bgcolor: 'grey.50', 
                                          borderRadius: 2,
                                          border: '1px solid',
                                          borderColor: 'grey.200'
                                        }}>
                                          <Typography variant="subtitle2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}>
                                            UATP Voucher Details
                                          </Typography>
                                          
                                          <Box sx={{ mb: 2.5 }}>
                                          <TextField 
                                            fullWidth 
                                              size="medium" 
                                              sx={{ 
                                                '& .MuiInputBase-root': { height: 48 }, 
                                                '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                                '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                              }} 
                                              label="UATP Number" 
                                              placeholder="1114-XXXXXXXXX"
                                            InputLabelProps={{ shrink: true }}
                                              value={(paymentData?.vouchers?.[voucherIdx]?.uatpNumber ?? '')} 
                                            inputProps={{ 
                                              suppressHydrationWarning: true,
                                              maxLength: 15
                                            }} 
                                              onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                                
                                                // Clear error when user starts typing
                                                const errorKey = `${itemKey}-voucher-${voucherIdx}-uatp`;
                                                clearFieldError(errorKey);
                                                
                                                // If field is empty, allow it to be empty
                                                if (value.length === 0) {
                                                  updateMethodField(itemKey, 'voucher', 'uatpNumber', '', voucherIdx);
                                                  return;
                                                }
                                                
                                                // Only add 1114 if user is typing something that doesn't start with 1114
                                                // and the current value is not already a partial 1114 (like 111, 11, 1)
                                                if (!value.startsWith('1114') && !value.startsWith('111') && !value.startsWith('11') && !value.startsWith('1')) {
                                                  value = '1114' + value;
                                                }
                                                
                                                // Limit to 14 digits (1114 + 10 more digits)
                                                if (value.length > 14) {
                                                  value = value.substring(0, 14);
                                                }
                                                
                                                // Format as 1114-XXXXXXXXX
                                                let formatted = value;
                                                if (value.length > 4) {
                                                  formatted = value.substring(0, 4) + '-' + value.substring(4);
                                                }
                                                
                                                updateMethodField(itemKey, 'voucher', 'uatpNumber', formatted, voucherIdx);
                                              }} 
                                            />
                                            {fieldErrors[`${itemKey}-voucher-${voucherIdx}-uatp`] && (
                                              <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                  color: 'error.main', 
                                                  mt: 0.5, 
                                                  display: 'block',
                                                  fontSize: '0.75rem'
                                                }}
                                              >
                                                {fieldErrors[`${itemKey}-voucher-${voucherIdx}-uatp`]}
                                              </Typography>
                                            )}
                                          </Box>

                                          <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                                            <Box sx={{ flex: 1, position: 'relative' }}>
                                          <TextField 
                                                size="medium" 
                                            fullWidth 
                                                sx={{ 
                                                  '& .MuiInputBase-root': { height: 48, paddingRight: '120px' }, 
                                                  '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                                  '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                                }} 
                                                label="Balance" 
                                                placeholder="$0.00"
                                            InputLabelProps={{ shrink: true }}
                                                type="number" 
                                                value={(paymentData?.vouchers?.[voucherIdx]?.balance ?? '')} 
                                                inputProps={{ suppressHydrationWarning: true }} 
                                                onChange={(e) => updateMethodField(itemKey, 'voucher', 'balance', e.target.value, voucherIdx)} 
                                              />
                                              <Button
                                                variant="outlined"
                                                size="small"
                                                sx={{ 
                                                  position: 'absolute',
                                                  right: 8,
                                                  top: '50%',
                                                  transform: 'translateY(-50%)',
                                                  height: 32,
                                                  minWidth: 'auto',
                                                  px: 1.5,
                                                  fontSize: '0.75rem',
                                                  fontWeight: 500,
                                                  textTransform: 'none',
                                                  borderColor: 'primary.main',
                                                  color: 'primary.main',
                                                  '&:hover': {
                                                    borderColor: 'primary.dark',
                                                    backgroundColor: 'primary.50'
                                                  }
                                                }}
                                                onClick={() => {
                                                  const uatpNumber = paymentData?.vouchers?.[voucherIdx]?.uatpNumber;
                                                  const errorKey = `${itemKey}-voucher-${voucherIdx}-uatp`;
                                                  
                                                  // Clear any existing error
                                                  clearFieldError(errorKey);
                                                  
                                                  if (!uatpNumber || uatpNumber.trim() === '') {
                                                    setFieldError(errorKey, 'Please enter UATP number first');
                                                    return;
                                                  }
                                                  
                                                  // Validate UATP number format (1114-XXXXXXXXX, 15 characters total)
                                                  if (uatpNumber.length !== 15 || !uatpNumber.startsWith('1114-') || !/^1114-\d{10}$/.test(uatpNumber)) {
                                                    setFieldError(errorKey, 'UATP number must be in format 1114-XXXXXXXXX (15 characters total)');
                                                    return;
                                                  }
                                                  
                                                  // TODO: Implement voucher balance check API call
                                                  console.log('Checking voucher balance for:', uatpNumber);
                                                  
                                                  // For now, simulate a balance check with loading
                                                  const mockBalance = Math.floor(Math.random() * 1000) + 100;
                                                  updateMethodField(itemKey, 'voucher', 'balance', mockBalance.toString(), voucherIdx);
                                                  
                                                  // Check if current amount is greater than balance, and adjust if needed
                                                  const currentAmount = Number(paymentData?.vouchers?.[voucherIdx]?.amount) || 0;
                                                  if (currentAmount > mockBalance) {
                                                    updateMethodField(itemKey, 'voucher', 'amount', mockBalance.toString(), voucherIdx);
                                                    console.log(`Amount adjusted from $${currentAmount} to $${mockBalance} (voucher balance)`);
                                                  }
                                                  
                                                  // Show success message
                                                  console.log(`Voucher balance checked: $${mockBalance}`);
                                                }}
                                              >
                                                Check
                                              </Button>
                                            </Box>
                                          <TextField 
                                              size="medium" 
                                              sx={{ 
                                                flex: 1,
                                                '& .MuiInputBase-root': { height: 48 }, 
                                                '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                                '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                              }} 
                                            label="Amount" 
                                            placeholder="$0.00"
                                            InputLabelProps={{ shrink: true }}
                                            type="number" 
                                            value={(paymentData?.vouchers?.[voucherIdx]?.amount ?? '')} 
                                            inputProps={{ suppressHydrationWarning: true }} 
                                            onChange={(e) => updateMethodField(itemKey, 'voucher', 'amount', e.target.value, voucherIdx)} 
                                          />
                                          </Box>

                                          <Box>
                                            <TextField 
                                              fullWidth
                                              size="medium" 
                                              sx={{ 
                                                '& .MuiInputBase-root': { height: 48 }, 
                                                '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                                '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                              }} 
                                              label="Expiration Date" 
                                              placeholder="MM/YY"
                                              InputLabelProps={{ shrink: true }}
                                              value={(paymentData?.vouchers?.[voucherIdx]?.expirationDate ?? '')} 
                                              inputProps={{ 
                                                suppressHydrationWarning: true,
                                                maxLength: 5
                                              }} 
                                              onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                                
                                                // Limit to 4 digits (MMYY)
                                                if (value.length > 4) {
                                                  value = value.substring(0, 4);
                                                }
                                                
                                                // Format as MM/YY
                                                if (value.length >= 2) {
                                                  value = value.substring(0, 2) + '/' + value.substring(2);
                                                }
                                                
                                                updateMethodField(itemKey, 'voucher', 'expirationDate', value, voucherIdx);
                                              }} 
                                            />
                                          </Box>
                                        </Box>
                                      );
                                    })()}
                                    {expanded && method === 'points' && (
                                      <Box sx={{ 
                                        mt: 2, 
                                        p: 3, 
                                        bgcolor: 'grey.50', 
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'grey.200'
                                      }}>
                                        <Typography variant="subtitle2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}>
                                          Points Details
                                        </Typography>
                                        
                                        <Box sx={{ mb: 2.5 }}>
                                          <Box sx={{ position: 'relative' }}>
                                        <TextField 
                                          fullWidth 
                                              size="medium" 
                                              sx={{ 
                                                '& .MuiInputBase-root': { height: 48, paddingRight: '120px' }, 
                                                '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                                '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                              }} 
                                              label="Member Number" 
                                              placeholder="Enter member number"
                                          InputLabelProps={{ shrink: true }}
                                              value={(paymentData?.points?.memberNumber ?? '')} 
                                              inputProps={{ 
                                                suppressHydrationWarning: true,
                                                maxLength: 9
                                              }} 
                                              onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, ''); // Only digits
                                                
                                                // Limit to 7-9 digits
                                                if (value.length > 9) {
                                                  value = value.substring(0, 9);
                                                }
                                                
                                                // Clear error when user starts typing
                                                const errorKey = `${itemKey}-points-member`;
                                                clearFieldError(errorKey);
                                                
                                                updateMethodField(itemKey, 'points', 'memberNumber', value);
                                              }} 
                                            />
                                            <Button
                                              variant="outlined"
                                          size="small" 
                                              sx={{ 
                                                position: 'absolute',
                                                right: 8,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                height: 32,
                                                minWidth: 'auto',
                                                px: 1.5,
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                textTransform: 'none',
                                                borderColor: 'primary.main',
                                                color: 'primary.main',
                                                '&:hover': {
                                                  borderColor: 'primary.dark',
                                                  backgroundColor: 'primary.50'
                                                }
                                              }}
                                              onClick={() => {
                                                const memberNumber = paymentData?.points?.memberNumber;
                                                const errorKey = `${itemKey}-points-member`;
                                                
                                                // Clear any existing error
                                                clearFieldError(errorKey);
                                                
                                                if (!memberNumber || memberNumber.trim() === '') {
                                                  setFieldError(errorKey, 'Please enter member number first');
                                                  return;
                                                }
                                                
                                                // Validate member number length (7-9 digits)
                                                if (memberNumber.length < 7 || memberNumber.length > 9) {
                                                  setFieldError(errorKey, 'Member number must be 7-9 digits');
                                                  return;
                                                }
                                                
                                                // Check if member exists in frequent flyers
                                                const member = frequentFlyers.find(f => f.memberNumber === memberNumber);
                                                
                                                if (member) {
                                                  // Member found - update points to use with member's available points
                                                  const currentPaymentAmount = Number(paymentData?.points?.amount) || 0;
                                                  const requiredPoints = Math.round(currentPaymentAmount * 50); // 50 points = $1
                                                  
                                                  if (requiredPoints > member.points) {
                                                    // Not enough points - use all available points
                                                    const maxPaymentAmount = (member.points / 50).toFixed(2);
                                                    updateMethodField(itemKey, 'points', 'amount', maxPaymentAmount);
                                                    updateMethodField(itemKey, 'points', 'pointsToUse', member.points.toString());
                                                    console.log(`Member found: ${member.name} with ${member.points} points. Using all ${member.points} points for $${maxPaymentAmount}`);
                                                  } else {
                                                    // Enough points - use required points
                                                    updateMethodField(itemKey, 'points', 'pointsToUse', requiredPoints.toString());
                                                    console.log(`Member found: ${member.name} with ${member.points} points. Using ${requiredPoints} points for $${currentPaymentAmount}`);
                                                  }
                                                } else {
                                                  // Member not found - simulate random points
                                                  const mockPoints = Math.floor(Math.random() * 50000) + 1000;
                                                  const currentPaymentAmount = Number(paymentData?.points?.amount) || 0;
                                                  const requiredPoints = Math.round(currentPaymentAmount * 50);
                                                  
                                                  if (requiredPoints > mockPoints) {
                                                    // Not enough points - use all available points
                                                    const maxPaymentAmount = (mockPoints / 50).toFixed(2);
                                                    updateMethodField(itemKey, 'points', 'amount', maxPaymentAmount);
                                                    updateMethodField(itemKey, 'points', 'pointsToUse', mockPoints.toString());
                                                    console.log(`Member not found, simulated ${mockPoints} points. Using all ${mockPoints} points for $${maxPaymentAmount}`);
                                                  } else {
                                                    // Enough points - use required points
                                                    updateMethodField(itemKey, 'points', 'pointsToUse', requiredPoints.toString());
                                                    console.log(`Member not found, simulated ${mockPoints} points. Using ${requiredPoints} points for $${currentPaymentAmount}`);
                                                  }
                                                }
                                              }}
                                            >
                                              Check
                                            </Button>
                                          </Box>
                                          {fieldErrors[`${itemKey}-points-member`] && (
                                            <Typography 
                                              variant="caption" 
                                              sx={{ 
                                                color: 'error.main', 
                                                mt: 0.5, 
                                                display: 'block',
                                                fontSize: '0.75rem'
                                              }}
                                            >
                                              {fieldErrors[`${itemKey}-points-member`]}
                                            </Typography>
                                          )}
                                        </Box>

                                        <Box sx={{ mb: 2.5 }}>
                                          <TextField 
                                          fullWidth 
                                            size="medium" 
                                            sx={{ 
                                              '& .MuiInputBase-root': { height: 48 }, 
                                              '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                              '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                            }} 
                                            label="Award Master" 
                                            placeholder="A123456"
                                          InputLabelProps={{ shrink: true }}
                                          value={(paymentData?.points?.awardReference ?? '')} 
                                            inputProps={{ 
                                              suppressHydrationWarning: true,
                                              maxLength: 7
                                            }} 
                                            onChange={(e) => {
                                              let value = e.target.value.toUpperCase().replace(/[^A0-9]/g, ''); // Only A and digits
                                              
                                              // Ensure it starts with A
                                              if (value.length > 0 && !value.startsWith('A')) {
                                                value = 'A' + value.replace(/A/g, '');
                                              }
                                              
                                              // Limit to 7 characters (A + 6 digits)
                                              if (value.length > 7) {
                                                value = value.substring(0, 7);
                                              }
                                              
                                              updateMethodField(itemKey, 'points', 'awardReference', value);
                                            }} 
                                          />
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField 
                                            size="medium" 
                                            sx={{ 
                                              flex: 1,
                                              '& .MuiInputBase-root': { height: 48 }, 
                                              '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                              '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                            }} 
                                            label="Payment Amount ($)" 
                                          placeholder="$0.00"
                                          InputLabelProps={{ shrink: true }}
                                          type="number" 
                                          value={(paymentData?.points?.amount ?? '')} 
                                          inputProps={{ suppressHydrationWarning: true }} 
                                            onChange={(e) => {
                                              console.log('🔄 Payment Amount onChange triggered');
                                              console.log('📝 Input value:', e.target.value);
                                              
                                              const dollarAmount = parseFloat(e.target.value) || 0;
                                              const pointsToUse = Math.round(dollarAmount * 50); // 50 points = $1
                                              
                                              console.log('💰 Dollar amount:', dollarAmount);
                                              console.log('🎯 Points to use calculated:', pointsToUse);
                                              
                                              // Get available points from member check
                                              const memberNumber = paymentData?.points?.memberNumber;
                                              console.log('👤 Member number:', memberNumber);
                                              
                                              const member = frequentFlyers.find(f => f.memberNumber === memberNumber);
                                              console.log('🔍 Member found:', member);
                                              
                                              if (member && pointsToUse > member.points) {
                                                // Not enough points - limit to available points
                                                const maxDollarAmount = (member.points / 50).toFixed(2);
                                                console.log('⚠️ Limiting - not enough points');
                                                console.log('📊 Max dollar amount:', maxDollarAmount);
                                                console.log('📊 Member points:', member.points);
                                                
                                                updateMethodField(itemKey, 'points', 'amount', maxDollarAmount);
                                                updateMethodField(itemKey, 'points', 'pointsToUse', member.points.toString());
                                                console.log(`✅ Limited to ${member.points} points for $${maxDollarAmount}`);
                                              } else {
                                                // Update both fields
                                                console.log('✅ Updating both fields normally');
                                                console.log('📝 Setting amount to:', e.target.value);
                                                console.log('📝 Setting pointsToUse to:', pointsToUse);
                                                
                                                updateMethodField(itemKey, 'points', 'amount', e.target.value);
                                                updateMethodField(itemKey, 'points', 'pointsToUse', pointsToUse.toString());
                                                console.log(`✅ Payment Amount: $${e.target.value} → Points to Use: ${pointsToUse}`);
                                              }
                                            }} 
                                          />
                                          <TextField 
                                            size="medium" 
                                            sx={{ 
                                              flex: 1,
                                              '& .MuiInputBase-root': { height: 48 }, 
                                              '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
                                              '& .MuiInputLabel-root': { fontSize: '0.9rem' }
                                            }} 
                                            label="Points to Use" 
                                            placeholder="0"
                                            InputLabelProps={{ shrink: true }}
                                            type="number" 
                                            value={(paymentData?.points?.pointsToUse ?? '')} 
                                            inputProps={{ suppressHydrationWarning: true }} 
                                            onChange={(e) => {
                                              console.log('🔄 Points to Use onChange triggered');
                                              console.log('📝 Input value:', e.target.value);
                                              
                                              const pointsToUse = parseInt(e.target.value) || 0;
                                              const dollarAmount = (pointsToUse / 50).toFixed(2); // 50 points = $1
                                              
                                              console.log('🎯 Points to use:', pointsToUse);
                                              console.log('💰 Dollar amount calculated:', dollarAmount);
                                              
                                              // Get available points from member check
                                              const memberNumber = paymentData?.points?.memberNumber;
                                              console.log('👤 Member number:', memberNumber);
                                              
                                              const member = frequentFlyers.find(f => f.memberNumber === memberNumber);
                                              console.log('🔍 Member found:', member);
                                              
                                              if (member && pointsToUse > member.points) {
                                                // Not enough points - limit to available points
                                                const maxDollarAmount = (member.points / 50).toFixed(2);
                                                console.log('⚠️ Limiting - not enough points');
                                                console.log('📊 Max dollar amount:', maxDollarAmount);
                                                console.log('📊 Member points:', member.points);
                                                
                                                updateMethodField(itemKey, 'points', 'pointsToUse', member.points.toString());
                                                updateMethodField(itemKey, 'points', 'amount', maxDollarAmount);
                                                console.log(`✅ Limited to ${member.points} points for $${maxDollarAmount}`);
                                              } else {
                                                // Update both fields
                                                console.log('✅ Updating both fields normally');
                                                console.log('📝 Setting pointsToUse to:', e.target.value);
                                                console.log('📝 Setting amount to:', dollarAmount);
                                                
                                                updateMethodField(itemKey, 'points', 'pointsToUse', e.target.value);
                                                updateMethodField(itemKey, 'points', 'amount', dollarAmount);
                                                console.log(`✅ Points to Use: ${e.target.value} → Payment Amount: $${dollarAmount}`);
                                              }
                                            }} 
                                          />
                                        </Box>
                                      </Box>
                                    )}
                                  </Paper>
                                );})}

                                {/* Allow adding more methods if constraints allow */}
                                {formMethods.length >= 1 && formMethods.length < 3 && !isItemFullyPaid(itemKey) && (
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 0.5 }}>
                                    {!formMethods.includes('credit') && (
                                      <IconButton
                                        size="small"
                                        onClick={() => confirmAddMethod(itemKey, 'credit')}
                                        sx={{ 
                                          color: 'success.main',
                                          '&:hover': { bgcolor: 'success.light', color: 'white' },
                                          border: 1,
                                          borderColor: 'success.main',
                                          width: 32,
                                          height: 32
                                        }}
                                        title="Add Credit Card"
                                      >
                                        <CreditCardIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    )}
                                    {formMethods.filter(m => m === 'voucher').length < 2 && (
                                      <IconButton
                                        size="small"
                                        onClick={() => confirmAddMethod(itemKey, 'voucher')}
                                        sx={{ 
                                          color: 'warning.main',
                                          '&:hover': { bgcolor: 'warning.light', color: 'white' },
                                          border: 1,
                                          borderColor: 'warning.main',
                                          width: 32,
                                          height: 32
                                        }}
                                        title="Add Voucher"
                                      >
                                        <VoucherIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    )}
                                    {!formMethods.includes('points') && (
                                      <IconButton
                                        size="small"
                                        onClick={() => confirmAddMethod(itemKey, 'points')}
                                        sx={{ 
                                          color: 'info.main',
                                          '&:hover': { bgcolor: 'info.light', color: 'white' },
                                          border: 1,
                                          borderColor: 'info.main',
                                          width: 32,
                                          height: 32
                                        }}
                                        title="Add Points"
                                      >
                                        <PointsIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    )}
                                  </Box>
                                )}
                              </Paper>
                            );
                          })}
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button variant="contained" onClick={goToNextPassenger} disabled={!activePaymentPassenger || activePaymentPassenger === '' || paymentTabPids.indexOf(activePaymentPassenger) === paymentTabPids.length - 1}>
                            Next Passenger
                          </Button>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                )}

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
                  
                {/* Content */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                  {/* Reservation Overview */}
                  <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Reservation Overview
                    </Typography>
                  </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <FlightIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Flight Price" 
                            secondary={`${passengersWithSelectedItems.length} passengers selected`}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ${flightPrice.toLocaleString()}
                          </Typography>
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <TrendingUpIcon color="secondary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Ancillary" 
                            secondary="Seats, baggage, meals"
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ${additionalServices.toLocaleString()}
                          </Typography>
                        </ListItem>
                      </List>
                    </AccordionDetails>
                  </Accordion>
                  
                  {/* Selected Items Breakdown */}
                  {(() => {
                    let selectedTickets = 0;
                    let selectedSeats = 0;
                    let selectedBags = 0;
                    let totalSelected = 0;
                    let totalPaid = 0;
                    let totalRemaining = 0;

                    Object.entries(selectedItems).forEach(([passengerId, items]) => {
                      const passengerIndex = parseInt(passengerId) - 1;
                      const passengerData = reservation.passengers[passengerIndex];
                      
                      items.forEach(item => {
                        switch(item) {
                          case 'ticket':
                            if (passengerData.ticket.status !== 'Paid') {
                              selectedTickets += passengerData.ticket.price;
                              totalSelected += passengerData.ticket.price;
                            } else {
                              totalPaid += passengerData.ticket.price;
                            }
                            break;
                          case 'seat':
                            if (passengerData.ancillaries.seat.status !== 'Paid') {
                              selectedSeats += passengerData.ancillaries.seat.price;
                              totalSelected += passengerData.ancillaries.seat.price;
                            } else {
                              totalPaid += passengerData.ancillaries.seat.price;
                            }
                            break;
                          case 'bag':
                            if (passengerData.ancillaries.bag.status !== 'Paid') {
                              selectedBags += passengerData.ancillaries.bag.price;
                              totalSelected += passengerData.ancillaries.bag.price;
                            } else {
                              totalPaid += passengerData.ancillaries.bag.price;
                            }
                            break;
                        }
                      });
                    });

                    totalRemaining = totalSelected;

                    return (
                      <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Badge badgeContent={Object.values(selectedItems).flat().length} color="primary">
                              <ShoppingCartIcon sx={{ mr: 1, color: 'primary.main' }} />
                            </Badge>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                              Selected Items
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              ${totalSelected.toLocaleString()}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {selectedTickets > 0 && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <FlightIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Flight Tickets" 
                                  secondary={`${Object.entries(selectedItems).filter(([_, items]) => items.includes('ticket')).length} selected`}
                                />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  ${selectedTickets.toLocaleString()}
                                </Typography>
                              </ListItem>
                        )}
                        
                        {selectedSeats > 0 && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <SeatIcon color="secondary" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Seat Selection" 
                                  secondary={`${Object.entries(selectedItems).filter(([_, items]) => items.includes('seat')).length} selected`}
                                />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${selectedSeats.toLocaleString()}
                            </Typography>
                              </ListItem>
                        )}
                        
                        {selectedBags > 0 && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <BagIcon color="success" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Baggage" 
                                  secondary={`${Object.entries(selectedItems).filter(([_, items]) => items.includes('bag')).length} selected`}
                                />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${selectedBags.toLocaleString()}
                            </Typography>
                              </ListItem>
                            )}
                            
                            {totalSelected === 0 && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <InfoIcon color="disabled" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="No items selected" 
                                  secondary="Select passengers and items to see details"
                                />
                              </ListItem>
                            )}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })()}

                  {/* Payment Methods Summary */}
                  {(() => {
                    let totalCreditAmount = 0;
                    let totalVoucherAmount = 0;
                    let totalPointsAmount = 0;
                    let totalPaymentMethods = 0;

                    Object.entries(itemPaymentMethods).forEach(([itemKey, methods]) => {
                      if (methods.credit) {
                        totalCreditAmount += methods.credit.amount;
                        totalPaymentMethods++;
                      }
                      if (methods.vouchers) {
                        methods.vouchers.forEach(voucher => {
                          totalVoucherAmount += voucher.amount;
                          totalPaymentMethods++;
                        });
                      }
                      if (methods.points) {
                        totalPointsAmount += methods.points.amount;
                        totalPaymentMethods++;
                      }
                    });

                    const totalPaymentAmount = totalCreditAmount + totalVoucherAmount + totalPointsAmount;

                    return totalPaymentMethods > 0 ? (
                      <Accordion sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            {totalPaymentMethods > 0 ? (
                              <Badge badgeContent={totalPaymentMethods} color="success">
                                <PaymentIcon sx={{ mr: 1, color: 'success.main' }} />
                              </Badge>
                            ) : (
                              <PaymentIcon sx={{ mr: 1, color: 'success.main' }} />
                            )}
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                              Payment Methods
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              ${totalPaymentAmount.toLocaleString()}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {totalCreditAmount > 0 && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <CreditCardIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Credit Card" 
                                  secondary="Visa, Mastercard, Amex"
                                />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  ${totalCreditAmount.toLocaleString()}
                                </Typography>
                              </ListItem>
                            )}
                            
                            {totalVoucherAmount > 0 && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <VoucherIcon color="secondary" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Vouchers" 
                                  secondary="UATP vouchers"
                                />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  ${totalVoucherAmount.toLocaleString()}
                                </Typography>
                              </ListItem>
                            )}
                            
                            {totalPointsAmount > 0 && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <PointsIcon color="warning" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Points" 
                                  secondary="Frequent flyer points"
                                />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  ${totalPointsAmount.toLocaleString()}
                                </Typography>
                              </ListItem>
                            )}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ) : null;
                  })()}

                  {/* Total Summary */}
                  <Paper sx={{ p: 3, bgcolor: 'grey.50', border: '2px solid', borderColor: 'primary.main' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Total Summary
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                              Reservation Total
                            </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              ${total.toLocaleString()}
                            </Typography>
                          </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Selected Items
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        ${(() => {
                          let totalSelected = 0;
                          Object.entries(selectedItems).forEach(([passengerId, items]) => {
                            const passengerIndex = parseInt(passengerId) - 1;
                            const passengerData = reservation.passengers[passengerIndex];
                            
                            items.forEach(item => {
                              switch(item) {
                                case 'ticket':
                                  if (passengerData.ticket.status !== 'Paid') {
                                    totalSelected += passengerData.ticket.price;
                                  }
                                  break;
                                case 'seat':
                                  if (passengerData.ancillaries.seat.status !== 'Paid') {
                                    totalSelected += passengerData.ancillaries.seat.price;
                                  }
                                  break;
                                case 'bag':
                                  if (passengerData.ancillaries.bag.status !== 'Paid') {
                                    totalSelected += passengerData.ancillaries.bag.price;
                                  }
                                  break;
                              }
                            });
                          });
                          return totalSelected;
                        })().toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Amount to Pay
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        ${(() => {
                          let totalSelected = 0;
                          Object.entries(selectedItems).forEach(([passengerId, items]) => {
                            const passengerIndex = parseInt(passengerId) - 1;
                            const passengerData = reservation.passengers[passengerIndex];
                            
                            items.forEach(item => {
                              switch(item) {
                                case 'ticket':
                                  if (passengerData.ticket.status !== 'Paid') {
                                    totalSelected += passengerData.ticket.price;
                                  }
                                  break;
                                case 'seat':
                                  if (passengerData.ancillaries.seat.status !== 'Paid') {
                                    totalSelected += passengerData.ancillaries.seat.price;
                                  }
                                  break;
                                case 'bag':
                                  if (passengerData.ancillaries.bag.status !== 'Paid') {
                                    totalSelected += passengerData.ancillaries.bag.price;
                                  }
                                  break;
                              }
                            });
                          });
                          return totalSelected;
                        })().toLocaleString()}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                    startIcon={<CheckCircleIcon />}
                      sx={{ 
                      mb: 2,
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' },
                      fontWeight: 600,
                      py: 1.5
                    }}
                    disabled={Object.values(selectedItems).flat().length === 0}
                    >
                      Confirm Payment
                    </Button>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                    size="large"
                    startIcon={<CloseIcon />}
                    sx={{ 
                      borderColor: 'grey.300', 
                      color: 'text.secondary',
                      fontWeight: 500,
                      py: 1.5
                    }}
                    >
                      Cancel
                    </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}
