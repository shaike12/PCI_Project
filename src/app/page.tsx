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
  FormControlLabel
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
  Delete as DeleteIcon
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
    vouchers?: { amount: number; voucherId: string }[];
    points?: { amount: number; accountId: string };
  }}>({});
  // UI state: show credit card edit form in unified payment card
  const [showEditCard, setShowEditCard] = useState(false);
  

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate costs only for unpaid items
  const flightPrice = reservation.passengers.reduce((sum, p) => {
    return p.ticket.status !== 'Paid' ? sum + p.ticket.price : sum;
  }, 0);
  
  const additionalServices = reservation.passengers.reduce((sum, p) => {
    const seatPrice = p.ancillaries.seat.status !== 'Paid' ? p.ancillaries.seat.price : 0;
    const bagPrice = p.ancillaries.bag.status !== 'Paid' ? p.ancillaries.bag.price : 0;
    return sum + seatPrice + bagPrice;
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
        
        // If no items left for this passenger, remove passenger from selectedPassengers
        if (newItems.length === 0) {
          setSelectedPassengers(prev => prev.filter(id => id !== passengerId));
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
            cvv: '' 
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
            voucherId: '', 
            expiry: '', 
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
          pointsAmount: 0, 
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
      // Set expanded to the last added method index
      setItemExpandedMethod(prevExp => ({ ...prevExp, [itemKey]: current.length - 1 }));
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
    
    setItemPaymentMethods(prev => {
      const next = { ...prev } as any;
      if (!next[itemKey]) next[itemKey] = {};
      
      // Coerce amount within remaining balance (excluding this method's previous value)
      let coercedAmount: number | string | null = null;
      if (field === 'amount') {
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
          currentAmountOfThisMethod = Number(methodsForItem?.vouchers?.[idx]?.amount) || 0;
        } else if (method === 'points') {
          currentAmountOfThisMethod = Number(methodsForItem?.points?.amount) || 0;
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
        
        }
      }
      if (method === 'credit') {
        next[itemKey].credit = { 
          ...(next[itemKey].credit || { 
            amount: 0, 
            cardNumber: '', 
            holderName: '', 
            expiryDate: '', 
            cvv: '' 
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
              voucherId: '', 
              expiry: '' 
            }), 
            [field]: field === 'amount' ? (coercedAmount ?? 0) : value 
          };
          console.log('🎫 Updated voucher:', list[idx]);
        }
        next[itemKey].vouchers = list;
        console.log('🎫 Final vouchers array:', next[itemKey].vouchers);
      } else if (method === 'points') {
        next[itemKey].points = { 
          ...(next[itemKey].points || { 
            amount: 0, 
            pointsAmount: 0, 
            awardReference: '' 
          }), 
          [field]: field === 'amount' ? (coercedAmount ?? 0) : value 
        };
      }
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
                  {selectedPassengers.length} passengers selected
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
                          <Tab key={pid} value={pid} label={getPassengerNameById(pid)} />
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
                                          onClick={() => setItemExpandedMethod(prev => ({ ...prev, [itemKey]: expanded ? null : idx }))}
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
                                    {!expanded && (
                                      <Typography variant="caption" color="text.secondary">
                                        Click Edit to expand
                                      </Typography>
                                    )}
                                    {expanded && method === 'credit' && (
                                      <Stack spacing={1}>
                                        {/* Card Type Indicator */}
                                        {(paymentData?.credit?.cardNumber ?? '').length > 0 && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                              Card Type:
                                            </Typography>
                                            <Chip 
                                              label={detectCardType(paymentData?.credit?.cardNumber ?? '')} 
                                              size="small" 
                                              color={detectCardType(paymentData?.credit?.cardNumber ?? '') === 'Unknown' ? 'default' : 'primary'}
                                              sx={{ fontSize: '0.7rem', height: 20 }}
                                            />
                                          </Box>
                                        )}
                                        
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                          <TextField 
                                            size="small" 
                                            sx={{ 
                                              flex: 2,
                                              '& .MuiInputBase-root': { height: 36 }, 
                                              '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } 
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
                                        <TextField 
                                          size="small" 
                                          sx={{ 
                                            flex: 1.5,
                                            '& .MuiInputBase-root': { height: 36 }, 
                                            '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } 
                                          }} 
                                          label="Cardholder Name" 
                                          placeholder="Full name as on card"
                                          InputLabelProps={{ shrink: true }}
                                          value={(paymentData?.credit?.holderName ?? '')} 
                                          inputProps={{ suppressHydrationWarning: true }} 
                                          onChange={(e) => updateMethodField(itemKey, 'credit', 'holderName', e.target.value)} 
                                        />
                                        <TextField 
                                          size="small" 
                                          sx={{ 
                                            flex: 0.8,
                                            '& .MuiInputBase-root': { height: 36 }, 
                                            '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } 
                                          }} 
                                          label="Expiry" 
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
                                            size="small" 
                                            sx={{ 
                                              flex: 0.7,
                                              '& .MuiInputBase-root': { height: 36 }, 
                                              '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } 
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
                                          <TextField 
                                            size="small" 
                                            sx={{ 
                                              flex: 1,
                                              '& .MuiInputBase-root': { height: 36 }, 
                                              '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } 
                                            }} 
                                            label="Amount" 
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
                                        </Stack>
                                      </Stack>
                                    )}
                                    {expanded && method === 'voucher' && (() => {
                                      const voucherIdx = formMethods.slice(0, idx).filter(m => m === 'voucher').length;
                                      return (
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                          <TextField 
                                            size="small" 
                                            fullWidth 
                                            label="Voucher Number" 
                                            placeholder="VCH-0000"
                                            InputLabelProps={{ shrink: true }}
                                            value={(paymentData?.vouchers?.[voucherIdx]?.voucherId ?? '')} 
                                            inputProps={{ 
                                              suppressHydrationWarning: true,
                                              maxLength: 15
                                            }} 
                                            sx={{ '& .MuiInputBase-root': { height: 36 }, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } }} 
                                            onChange={(e) => updateMethodField(itemKey, 'voucher', 'voucherId', e.target.value, voucherIdx)} 
                                          />
                                          <TextField 
                                            size="small" 
                                            fullWidth 
                                            label="Expiry" 
                                            placeholder="MM/YY"
                                            InputLabelProps={{ shrink: true }}
                                            value={(paymentData?.vouchers?.[voucherIdx]?.expiry ?? '')} 
                                            inputProps={{ 
                                              suppressHydrationWarning: true,
                                              maxLength: 5,
                                              inputMode: 'numeric'
                                            }} 
                                            sx={{ '& .MuiInputBase-root': { height: 36 }, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } }} 
                                            onChange={(e) => {
                                              let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                              if (value.length >= 2) {
                                                value = value.substring(0, 2) + '/' + value.substring(2, 4);
                                              }
                                              updateMethodField(itemKey, 'voucher', 'expiry', value, voucherIdx);
                                            }} 
                                          />
                                          <TextField 
                                            size="small" 
                                            fullWidth 
                                            label="Amount" 
                                            placeholder="$0.00"
                                            InputLabelProps={{ shrink: true }}
                                            type="number" 
                                            value={(paymentData?.vouchers?.[voucherIdx]?.amount ?? '')} 
                                            inputProps={{ suppressHydrationWarning: true }} 
                                            sx={{ '& .MuiInputBase-root': { height: 36 }, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } }} 
                                            onChange={(e) => updateMethodField(itemKey, 'voucher', 'amount', e.target.value, voucherIdx)} 
                                          />
                                        </Stack>
                                      );
                                    })()}
                                    {expanded && method === 'points' && (
                                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                        <TextField 
                                          size="small" 
                                          fullWidth 
                                          label="Points" 
                                          placeholder="0"
                                          InputLabelProps={{ shrink: true }}
                                          type="number" 
                                          value={(paymentData?.points?.pointsAmount ?? 0)} 
                                          inputProps={{ suppressHydrationWarning: true }} 
                                          sx={{ '& .MuiInputBase-root': { height: 36 }, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } }} 
                                          onChange={(e) => updateMethodField(itemKey, 'points', 'pointsAmount', e.target.value)} 
                                        />
                                        <TextField 
                                          size="small" 
                                          fullWidth 
                                          label="Award Ref" 
                                          placeholder="AWD-XXXX"
                                          InputLabelProps={{ shrink: true }}
                                          value={(paymentData?.points?.awardReference ?? '')} 
                                          inputProps={{ suppressHydrationWarning: true }} 
                                          sx={{ '& .MuiInputBase-root': { height: 36 }, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } }} 
                                          onChange={(e) => updateMethodField(itemKey, 'points', 'awardReference', e.target.value)} 
                                        />
                                        <TextField 
                                          size="small" 
                                          fullWidth 
                                          label="Amount" 
                                          placeholder="$0.00"
                                          InputLabelProps={{ shrink: true }}
                                          type="number" 
                                          value={(paymentData?.points?.amount ?? '')} 
                                          inputProps={{ suppressHydrationWarning: true }} 
                                          sx={{ '& .MuiInputBase-root': { height: 36 }, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } }} 
                                          onChange={(e) => updateMethodField(itemKey, 'points', 'amount', e.target.value)} 
                                        />
                                      </Stack>
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

          {/* סקשן סה״כ תשלום - ימין - 25% */}
          <Grid size={{ xs: 12, lg: 3 }} style={{ height: '100vh' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <MoneyIcon sx={{ color: 'secondary.main', mr: 1, fontSize: 28 }} />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'semibold' }}>
                    Payment Summary
                  </Typography>
                </Box>
                
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Flight Price</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      ${flightPrice.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Additional Services</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      ${additionalServices.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  {/* Selected Items Breakdown */}
                  {(() => {
                    let selectedTickets = 0;
                    let selectedSeats = 0;
                    let selectedBags = 0;
                    let totalSelected = 0;

                    Object.entries(selectedItems).forEach(([passengerId, items]) => {
                      const passengerIndex = parseInt(passengerId) - 1;
                      const passengerData = reservation.passengers[passengerIndex];
                      
                      items.forEach(item => {
                        switch(item) {
                          case 'ticket':
                            // Only count if not paid
                            if (passengerData.ticket.status !== 'Paid') {
                              selectedTickets += passengerData.ticket.price;
                              totalSelected += passengerData.ticket.price;
                            }
                            break;
                          case 'seat':
                            // Only count if not paid
                            if (passengerData.ancillaries.seat.status !== 'Paid') {
                              selectedSeats += passengerData.ancillaries.seat.price;
                              totalSelected += passengerData.ancillaries.seat.price;
                            }
                            break;
                          case 'bag':
                            // Only count if not paid
                            if (passengerData.ancillaries.bag.status !== 'Paid') {
                              selectedBags += passengerData.ancillaries.bag.price;
                              totalSelected += passengerData.ancillaries.bag.price;
                            }
                            break;
                        }
                      });
                    });

                    return (
                      <>
                        {selectedTickets > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <FlightIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                              Flight Tickets
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              ${selectedTickets.toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                        
                        {selectedSeats > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <SeatIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                              Seat Selection
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              ${selectedSeats.toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                        
                        {selectedBags > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <BagIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                              Baggage
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              ${selectedBags.toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                        
                        {(selectedTickets > 0 || selectedSeats > 0 || selectedBags > 0) && <Divider />}
                        
                        <Paper sx={{ p: 2, bgcolor: totalSelected > 0 ? 'primary.light' : 'grey.100' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'semibold' }}>
                              Selected Total
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              ${totalSelected.toLocaleString()}
                            </Typography>
                          </Box>
                        </Paper>
                        
                        <Divider />
                        
                        <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'semibold' }}>
                              Reservation Total
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                              ${total.toLocaleString()}
                            </Typography>
                          </Box>
                        </Paper>
                      </>
                    );
                  })()}
                  
                  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Passengers: {selectedPassengers.length}
                      </Typography>
                    </Box>
                    
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      sx={{ 
                        bgcolor: 'secondary.main',
                        '&:hover': { bgcolor: 'secondary.dark' },
                        fontWeight: 'medium'
                      }}
                    >
                      Confirm Payment
                    </Button>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{ borderColor: 'grey.300', color: 'text.secondary' }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}
