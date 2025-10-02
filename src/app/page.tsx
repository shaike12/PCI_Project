'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Avatar
} from '@mui/material';
import {
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Flight as FlightIcon,
  EventSeat as SeatIcon,
  Luggage as BagIcon,
  ReceiptLong as ReceiptLongIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { PassengerHeader } from './components/PassengerHeader';
import { PaymentMethodsSummary } from './components/PaymentMethodsSummary';
import { TotalSummary } from './components/TotalSummary';
import { ActionButtons } from './components/ActionButtons';
import { MOCK_RESERVATION, Reservation } from '@/types/reservation';
import { PaymentTabs } from './components/PaymentTabs';
import { SelectedItemsBreakdown } from './components/SelectedItemsBreakdown';
import { computeSelectedAmount } from './utils/paymentCalculations';
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


  // Clear all payment methods for all passengers
  const clearAllPaymentMethods = () => {
    if (window.confirm('Are you sure you want to delete all payment methods for all passengers? This action cannot be undone.')) {
      setItemPaymentMethods({});
      setItemMethodForms({});
      setItemExpandedMethod({});
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
  
  // UI: which method forms to show under each item (supports multiple)
  const [itemMethodForms, setItemMethodForms] = useState<{ [key: string]: Array<'credit' | 'voucher' | 'points'> }>({});
  // Which method is expanded per item (single expand accordion)
  const [itemExpandedMethod, setItemExpandedMethod] = useState<{ [key: string]: number | null }>({});
  
  // Active passenger tab for payment methods section
  const [activePaymentPassenger, setActivePaymentPassenger] = useState<string>('');
  
  

  useEffect(() => {
    setIsClient(true);
  }, []);


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

  // Wrapper functions for payment logic (moved up to avoid initialization order issues)
  const getTotalPaidAmountWrapper = useCallback((itemKey: string) => {
    return getTotalPaidAmount(itemKey, itemPaymentMethods);
  }, [itemPaymentMethods]);

  const isItemFullyPaidWrapper = (itemKey: string) => {
    return isItemFullyPaid(itemKey, itemPaymentMethods, reservation, resolvePassengerIndex);
  };

  const confirmAddMethodWrapper = (itemKey: string, method: 'credit' | 'voucher' | 'points') => {
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

  const isPaymentMethodCompleteWrapper = (itemKey: string, method: string, methodIndex: number) => {
    return isPaymentMethodComplete(itemKey, method, methodIndex, itemPaymentMethods);
  };

  // Calculate payment progress
  const paymentProgress = useMemo(() => {
    if (total === 0) return 0;
    const paidAmount = passengersWithSelectedItems.reduce((sum, passengerId) => {
      const selectedPassengerItems = selectedItems[passengerId] || [];
      let passengerPaid = 0;
      selectedPassengerItems.forEach(itemType => {
        const itemKey = `${passengerId}-${itemType}`;
        passengerPaid += getTotalPaidAmountWrapper(itemKey);
      });
      return sum + passengerPaid;
    }, 0);
    return (paidAmount / total) * 100;
  }, [passengersWithSelectedItems, selectedItems, total, getTotalPaidAmountWrapper]);

  // togglePassenger is now imported from utils/passengerLogic
  const togglePassenger = (passengerId: string) => {
    togglePassengerUtil(passengerId, selectedPassengers, setSelectedPassengers);
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
    if (passengerData.ancillaries.seat.status !== 'Paid') unpaidItems.push('seat');
    if (passengerData.ancillaries.bag.status !== 'Paid') unpaidItems.push('bag');

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
        if (itemType === 'ticket') {
          itemPrice = passenger.ticket.price;
        } else if (itemType === 'seat') {
          itemPrice = passenger.ancillaries.seat.price;
        } else if (itemType === 'bag') {
          itemPrice = passenger.ancillaries.bag.price;
        }

    const totalPaid = getTotalPaidAmountWrapper(itemKey);
    
    return {
      total: itemPrice,
      paid: Number.isFinite(totalPaid) ? totalPaid : 0,
      remaining: Math.max(0, itemPrice - (Number.isFinite(totalPaid) ? totalPaid : 0))
    };
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
                  reservationCode=""
                  onChangeReservationCode={() => {}}
                  onLoad={() => {}}
                  loadDisabled={true}
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
                  isItemFullyPaid={isItemFullyPaidWrapper}
                  confirmAddMethod={confirmAddMethodWrapper}
                  isPaymentMethodComplete={isPaymentMethodCompleteWrapper}
                  updateMethodField={updateMethodFieldWrapper}
                  setItemExpandedMethod={setItemExpandedMethod}
                  removeMethod={removeMethodWrapper}
                  toggleItem={toggleItem}
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
