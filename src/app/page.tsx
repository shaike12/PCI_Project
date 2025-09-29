'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Add as AddIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Flight as FlightIcon,
  EventSeat as SeatIcon,
  Luggage as BagIcon
} from '@mui/icons-material';
import { MOCK_RESERVATION, Reservation } from '@/types/reservation';

interface Passenger {
  id: string;
  fullName: string;
  hasUnpaidItems: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit';
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  holderName: string;
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
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', type: 'credit', cardNumber: '', expiryDate: '', cvv: '', holderName: '' }
  ]);

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
      
      return {
        ...prev,
        [passengerId]: isSelected 
          ? passengerItems.filter(item => item !== itemType)
          : [...passengerItems, itemType]
      };
    });
  };

  const isItemSelected = (passengerId: string, itemType: string) => {
    return selectedItems[passengerId]?.includes(itemType) || false;
  };

  const addPaymentMethod = () => {
    const newPaymentMethod: PaymentMethod = {
      id: (paymentMethods.length + 1).toString(),
      type: 'credit',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      holderName: ''
    };
    setPaymentMethods([...paymentMethods, newPaymentMethod]);
  };


  const updatePaymentMethod = (id: string, field: keyof PaymentMethod, value: string) => {
    setPaymentMethods(paymentMethods.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
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
      <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h3" component="h1" align="center" sx={{ mb: 4, fontWeight: 'bold', color: 'grey.800' }}>
          PCI
        </Typography>
        

        <Grid container spacing={3} sx={{ flex: 1, height: '100%' }}>
          {/* סקשן נוסעים - שמאל - 25% */}
          <Grid size={{ xs: 12, lg: 3 }}>
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
                          mb: 2,
                          border: 1,
                          borderColor: 'grey.300',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Passenger Header */}
                        <Box
                          sx={{
                            p: 2,
                            cursor: passenger.hasUnpaidItems ? 'pointer' : 'not-allowed',
                            bgcolor: (() => {
                              if (!passenger.hasUnpaidItems) return 'grey.100';
                              const passengerItems = selectedItems[passenger.id] || [];
                              const allItemsSelected = passengerItems.length === 3; // ticket, seat, bag
                              return allItemsSelected ? 'primary.main' : 'white';
                            })(),
                            color: (() => {
                              if (!passenger.hasUnpaidItems) return 'grey.500';
                              const passengerItems = selectedItems[passenger.id] || [];
                              const allItemsSelected = passengerItems.length === 3;
                              return allItemsSelected ? 'white' : 'inherit';
                            })(),
                            opacity: passenger.hasUnpaidItems ? 1 : 0.6,
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: (() => {
                                if (!passenger.hasUnpaidItems) return 'grey.100';
                                const passengerItems = selectedItems[passenger.id] || [];
                                const allItemsSelected = passengerItems.length === 3;
                                return allItemsSelected ? 'primary.dark' : 'grey.50';
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
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
                                        return isItemSelected(passenger.id, 'ticket') ? 'white' : 'success.main';
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
                                        bgcolor: 'success.main',
                                        border: '2px solid',
                                        borderColor: 'success.main',
                                        zIndex: 1
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
                                        return isItemSelected(passenger.id, 'seat') ? 'white' : 'info.main';
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
                                        bgcolor: 'info.main',
                                        border: '2px solid',
                                        borderColor: 'info.main',
                                        zIndex: 1
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
                                        return isItemSelected(passenger.id, 'bag') ? 'white' : 'warning.main';
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
                                        bgcolor: 'warning.main',
                                        border: '2px solid',
                                        borderColor: 'warning.main',
                                        zIndex: 1
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
                          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                            {/* Flight Ticket */}
                            <Paper
                              sx={{
                                p: 2,
                                mb: 2,
                                cursor: passengerData.ticket.status === 'Paid' ? 'not-allowed' : 'pointer',
                                border: 2,
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
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <FlightIcon sx={{ mr: 1, color: passengerData.ticket.status === 'Paid' ? 'grey.500' : 'primary.main' }} />
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                      Flight Ticket
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {passengerData.ticket.ticketNumber} - ${passengerData.ticket.price}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Status: {passengerData.ticket.status}
                                    </Typography>
                                  </Box>
                                </Box>
                                {isItemSelected(passenger.id, 'ticket') && (
                                  <CheckIcon sx={{ color: 'success.main' }} />
                                )}
                              </Box>
                            </Paper>

                            {/* Ancillaries */}
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                              Ancillaries:
                            </Typography>
                            
                            {/* Seat */}
                            <Paper
                              sx={{
                                p: 2,
                                mb: 1,
                                cursor: passengerData.ancillaries.seat.status === 'Paid' ? 'not-allowed' : 'pointer',
                                border: 2,
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
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <SeatIcon sx={{ mr: 1, color: passengerData.ancillaries.seat.status === 'Paid' ? 'grey.500' : 'info.main' }} />
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                      Seat Selection
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {passengerData.ancillaries.seat.emdNumber} - ${passengerData.ancillaries.seat.price}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Status: {passengerData.ancillaries.seat.status}
                                    </Typography>
                                  </Box>
                                </Box>
                                {isItemSelected(passenger.id, 'seat') && (
                                  <CheckIcon sx={{ color: 'info.main' }} />
                                )}
                              </Box>
                            </Paper>

                            {/* Baggage */}
                            <Paper
                              sx={{
                                p: 2,
                                cursor: passengerData.ancillaries.bag.status === 'Paid' ? 'not-allowed' : 'pointer',
                                border: 2,
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
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <BagIcon sx={{ mr: 1, color: passengerData.ancillaries.bag.status === 'Paid' ? 'grey.500' : 'warning.main' }} />
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                      Baggage
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {passengerData.ancillaries.bag.emdNumber} - ${passengerData.ancillaries.bag.price}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Status: {passengerData.ancillaries.bag.status}
                                    </Typography>
                                  </Box>
                                </Box>
                                {isItemSelected(passenger.id, 'bag') && (
                                  <CheckIcon sx={{ color: 'warning.main' }} />
                                )}
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
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CreditCardIcon sx={{ color: 'success.main', mr: 1, fontSize: 28 }} />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'semibold' }}>
                    Payment Methods
                  </Typography>
                </Box>
                
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                  {paymentMethods.map((payment, index) => (
                  <Paper key={payment.id} sx={{ p: 3, mb: 2, border: 1, borderColor: 'grey.200' }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
                      Card {index + 1}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>Card Type</InputLabel>
                        <Select
                          value={payment.type}
                          onChange={(e) => updatePaymentMethod(payment.id, 'type', e.target.value as 'credit' | 'debit')}
                          label="Card Type"
                        >
                          <MenuItem value="credit">Credit</MenuItem>
                          <MenuItem value="debit">Debit</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <TextField
                        fullWidth
                        label="Card Number"
                        value={payment.cardNumber}
                        onChange={(e) => updatePaymentMethod(payment.id, 'cardNumber', e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        inputProps={{ suppressHydrationWarning: true }}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="Expiry Date"
                          value={payment.expiryDate}
                          onChange={(e) => updatePaymentMethod(payment.id, 'expiryDate', e.target.value)}
                          placeholder="MM/YY"
                          sx={{ flex: 1 }}
                          inputProps={{ suppressHydrationWarning: true }}
                        />
                        <TextField
                          label="CVV"
                          value={payment.cvv}
                          onChange={(e) => updatePaymentMethod(payment.id, 'cvv', e.target.value)}
                          placeholder="123"
                          sx={{ flex: 1 }}
                          inputProps={{ suppressHydrationWarning: true }}
                        />
                      </Box>
                      
                      <TextField
                        fullWidth
                        label="Cardholder Name"
                        value={payment.holderName}
                        onChange={(e) => updatePaymentMethod(payment.id, 'holderName', e.target.value)}
                        placeholder="Full name as it appears on the card"
                        inputProps={{ suppressHydrationWarning: true }}
                      />
                    </Box>
                  </Paper>
                ))}
                
                </Box>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addPaymentMethod}
                  sx={{ mt: 2, borderColor: 'success.main', color: 'success.main' }}
                >
                  Add Card
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* סקשן סה״כ תשלום - ימין - 25% */}
          <Grid size={{ xs: 12, lg: 3 }}>
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
                      <Typography variant="caption" color="text.secondary">
                        Cards: {paymentMethods.length}
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
[
  {
    "מספר הזמנה": "ORD-0001",
    טלפון: "+972-50-1234567",
    אימייל: "user@example.com",
    'סה"כ סכום': 3500.0,
    נוסעים: [
      {
        נוסע: "נוסע 1",
        "כרטיס טיסה": {
          מחיר: 1800.0,
          סטטוס: "ממתין לתשלום",
          "אמצעי תשלום": {
            אשראי: {
              "מספר אשראי": "411111******1111",
              תוקף: "12/27",
              "3 ספרות": "123",
              סכום: 900.0,
            },
            נקודות: {
              "כמות נקודות": 3000,
              "מספר אסמכתא (award)": "AWD-1001",
              סכום: 300.0,
            },
            שובר: {
              "מספר שובר": "VCH-5001",
              תוקף: "2026-12-31",
              סכום: 600.0,
            },
          },
          "מספר כרטיס טיסה": "114-1234567890123",
        },
        אנסילירי: {
          מושב: {
            מחיר: 100.0,
            "אמצעי תשלום": {
              אשראי: {
                "מספר אשראי": "411111******1111",
                תוקף: "12/27",
                "3 ספרות": "123",
                סכום: 100.0,
              },
              נקודות: {
                "כמות נקודות": 0,
                "מספר אסמכתא (award)": "",
                סכום: 0.0,
              },
              שובר: {
                "מספר שובר": "",
                תוקף: "",
                סכום: 0.0,
              },
            },
            "מספר emd": "114-EMD-001",
            סטטוס: "שולם",
          },
          מזוודה: {
            מחיר: 200.0,
            "אמצעי תשלום": {
              אשראי: {
                "מספר אשראי": "",
                תוקף: "",
                "3 ספרות": "",
                סכום: 0.0,
              },
              נקודות: {
                "כמות נקודות": 1500,
                "מספר אסמכתא (award)": "AWD-2002",
                סכום: 150.0,
              },
              שובר: {
                "מספר שובר": "",
                תוקף: "",
                סכום: 0.0,
              },
            },
            "מספר emd": "114-EMD-002",
            סטטוס: "תשלום חלקי",
          },
        },
      },
      {
        נוסע: "נוסע 2",
        "כרטיס טיסה": {
          מחיר: 1800.0,
          סטטוס: "שולם",
          "אמצעי תשלום": {
            אשראי: {
              "מספר אשראי": "522222******2222",
              תוקף: "05/28",
              "3 ספרות": "456",
              סכום: 1800.0,
            },
            נקודות: {
              "כמות נקודות": 0,
              "מספר אסמכתא (award)": "",
              סכום: 0.0,
            },
            שובר: {
              "מספר שובר": "",
              תוקף: "",
              סכום: 0.0,
            },
          },
          "מספר כרטיס טיסה": "114-9876543210987",
        },
        אנסילירי: {
          מושב: {
            מחיר: 100.0,
            "אמצעי תשלום": {
              אשראי: {
                "מספר אשראי": "522222******2222",
                תוקף: "05/28",
                "3 ספרות": "456",
                סכום: 100.0,
              },
              נקודות: {
                "כמות נקודות": 0,
                "מספר אסמכתא (award)": "",
                סכום: 0.0,
              },
              שובר: {
                "מספר שובר": "",
                תוקף: "",
                סכום: 0.0,
              },
            },
            "מספר emd": "114-EMD-003",
            סטטוס: "שולם",
          },
          מזוודה: {
            מחיר: 200.0,
            "אמצעי תשלום": {
              אשראי: {
                "מספר אשראי": "",
                תוקף: "",
                "3 ספרות": "",
                סכום: 0.0,
              },
              נקודות: {
                "כמות נקודות": 0,
                "מספר אסמכתא (award)": "",
                סכום: 0.0,
              },
              שובר: {
                "מספר שובר": "",
                תוקף: "",
                סכום: 0.0,
              },
            },
            "מספר emd": "114-EMD-004",
            סטטוס: "ממתין לתשלום",
          },
        },
  };
}
