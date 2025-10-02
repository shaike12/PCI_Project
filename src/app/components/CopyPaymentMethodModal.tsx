'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Flight as FlightIcon,
  EventSeat as SeatIcon,
  Luggage as BagIcon
} from '@mui/icons-material';

interface Passenger {
  id: string;
  fullName: string;
  hasUnpaidItems: boolean;
}

interface CopyPaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedPassengerIds: string[], copyToAll: boolean) => void;
  passengers: Passenger[];
  selectedPassengers: string[];
  sourceItemKey: string;
  paymentMethodType: 'credit' | 'voucher' | 'points';
  getRemainingAmount?: (itemKey: string) => { total: number; paid: number; remaining: number };
  selectedItems?: { [passengerId: string]: string[] };
}

export function CopyPaymentMethodModal({
  open,
  onClose,
  onConfirm,
  passengers,
  selectedPassengers,
  sourceItemKey,
  paymentMethodType,
  getRemainingAmount,
  selectedItems
}: CopyPaymentMethodModalProps) {
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<string[]>([]);

  const handlePassengerToggle = (passengerId: string) => {
    setSelectedPassengerIds(prev => 
      prev.includes(passengerId) 
        ? prev.filter(id => id !== passengerId)
        : [...prev, passengerId]
    );
  };

  const handleSelectAll = () => {
    const availablePassengers = passengers
      .filter(passenger => {
        // Show passengers who either:
        // 1. Are in selectedPassengers, OR
        // 2. Have selected items in selectedItems
        const hasSelectedItems = selectedPassengers.includes(passenger.id) || 
               (selectedItems && selectedItems[passenger.id] && selectedItems[passenger.id].length > 0);
        
        if (!hasSelectedItems) return false;
        
        // Check if passenger has any remaining balance
        if (getRemainingAmount && selectedItems) {
          const passengerItems = selectedItems[passenger.id] || [];
          const hasRemainingBalance = passengerItems.some(itemType => {
            const itemKey = `${passenger.id}-${itemType}`;
            const remaining = getRemainingAmount(itemKey);
            return remaining.remaining > 0;
          });
          return hasRemainingBalance;
        }
        
        return true;
      })
      .filter(passenger => {
        const isSourcePassenger = passenger.id === sourcePassengerId;
        // Include source passenger if they have other items with remaining balance
        if (isSourcePassenger) {
          if (getRemainingAmount && selectedItems) {
            const passengerItems = selectedItems[passenger.id] || [];
            return passengerItems.some(itemType => {
              const itemKey = `${passenger.id}-${itemType}`;
              // Skip the exact source item, check others
              if (itemKey === sourceItemKey) return false;
              const remaining = getRemainingAmount(itemKey);
              return remaining.remaining > 0;
            });
          }
          return false;
        }
        return true; // Include all non-source passengers
      })
      .map(p => p.id);
    
    setSelectedPassengerIds(availablePassengers);
  };

  const handleCopyToAll = () => {
    // Get all available passengers (including source if they have other items with remaining balance)
    const availablePassengers = passengers
      .filter(passenger => {
        // Show passengers who either:
        // 1. Are in selectedPassengers, OR
        // 2. Have selected items in selectedItems
        const hasSelectedItems = selectedPassengers.includes(passenger.id) || 
               (selectedItems && selectedItems[passenger.id] && selectedItems[passenger.id].length > 0);
        
        if (!hasSelectedItems) return false;
        
        // Check if passenger has any remaining balance
        if (getRemainingAmount && selectedItems) {
          const passengerItems = selectedItems[passenger.id] || [];
          const hasRemainingBalance = passengerItems.some(itemType => {
            const itemKey = `${passenger.id}-${itemType}`;
            const remaining = getRemainingAmount(itemKey);
            return remaining.remaining > 0;
          });
          return hasRemainingBalance;
        }
        
        return true;
      })
      .filter(passenger => {
        const isSourcePassenger = passenger.id === sourcePassengerId;
        // Include source passenger if they have other items with remaining balance
        if (isSourcePassenger) {
          if (getRemainingAmount && selectedItems) {
            const passengerItems = selectedItems[passenger.id] || [];
            return passengerItems.some(itemType => {
              const itemKey = `${passenger.id}-${itemType}`;
              // Skip the exact source item, check others
              if (itemKey === sourceItemKey) return false;
              const remaining = getRemainingAmount(itemKey);
              return remaining.remaining > 0;
            });
          }
          return false;
        }
        return true; // Include all non-source passengers
      })
      .map(p => p.id);
    
    onConfirm(availablePassengers, true);
    onClose();
  };

  const handleCopyToSelected = () => {
    onConfirm(selectedPassengerIds, false);
    onClose();
  };

  const getMethodTypeLabel = (type: string) => {
    switch (type) {
      case 'credit': return 'Credit Card';
      case 'voucher': return 'UATP Voucher';
      case 'points': return 'Points';
      default: return type;
    }
  };

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'ticket': return <FlightIcon fontSize="small" />;
      case 'seat': return <SeatIcon fontSize="small" />;
      case 'bag': return <BagIcon fontSize="small" />;
      default: return null;
    }
  };

  const getItemLabel = (itemType: string) => {
    switch (itemType) {
      case 'ticket': return 'Flight Ticket';
      case 'seat': return 'Seat Selection';
      case 'bag': return 'Baggage';
      default: return itemType;
    }
  };

  // Parse source item key to get passenger and item type
  const [sourcePassengerId, sourceItemType] = sourceItemKey.split('-');
  const sourcePassenger = passengers.find(p => p.id === sourcePassengerId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Copy {getMethodTypeLabel(paymentMethodType)} Payment Method
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Copying from:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {sourcePassenger?.fullName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getItemIcon(sourceItemType)}
                <Typography variant="caption" color="text.secondary">
                  {getItemLabel(sourceItemType)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Select passengers to copy the payment method to:
          </Typography>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={handleSelectAll}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            Select All
          </Button>
        </Box>

        <List dense>
          {passengers
            .filter(passenger => {
              // Show passengers who either:
              // 1. Are in selectedPassengers, OR
              // 2. Have selected items in selectedItems
              const hasSelectedItems = selectedPassengers.includes(passenger.id) || 
                     (selectedItems && selectedItems[passenger.id] && selectedItems[passenger.id].length > 0);
              
              if (!hasSelectedItems) return false;
              
              // Check if passenger has any remaining balance
              if (getRemainingAmount && selectedItems) {
                const passengerItems = selectedItems[passenger.id] || [];
                const hasRemainingBalance = passengerItems.some(itemType => {
                  const itemKey = `${passenger.id}-${itemType}`;
                  const remaining = getRemainingAmount(itemKey);
                  return remaining.remaining > 0;
                });
                return hasRemainingBalance;
              }
              
              return true;
            })
            .map(passenger => {
              const isSourcePassenger = passenger.id === sourcePassengerId;
              
              // Calculate total remaining balance for this passenger
              let totalRemaining = 0;
              let hasRemainingBalance = false;
              
              if (getRemainingAmount && selectedItems) {
                const passengerItems = selectedItems[passenger.id] || [];
                passengerItems.forEach(itemType => {
                  const itemKey = `${passenger.id}-${itemType}`;
                  // For source passenger, skip the exact source item
                  if (isSourcePassenger && itemKey === sourceItemKey) {
                    return;
                  }
                  const remaining = getRemainingAmount(itemKey);
                  totalRemaining += remaining.remaining;
                  if (remaining.remaining > 0) {
                    hasRemainingBalance = true;
                  }
                });
              }
              
              return (
                <ListItem key={passenger.id} sx={{ px: 0, opacity: isSourcePassenger ? 0.6 : 1 }}>
                  <ListItemIcon>
                    <Checkbox
                      checked={selectedPassengerIds.includes(passenger.id)}
                      onChange={() => handlePassengerToggle(passenger.id)}
                      size="small"
                      disabled={!hasRemainingBalance}
                    />
                  </ListItemIcon>
                  <ListItemIcon>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: isSourcePassenger ? 'grey.400' : 'primary.main' }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={passenger.fullName}
                    secondary={
                      <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        <Typography 
                          component="span"
                          variant="caption"
                          sx={{ 
                            display: 'inline-block',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: isSourcePassenger ? 'grey.400' : 'primary.main',
                            color: isSourcePassenger ? 'grey.600' : 'primary.main',
                            bgcolor: isSourcePassenger ? 'grey.100' : 'primary.light',
                            fontSize: '0.7rem',
                            height: 20,
                            lineHeight: '20px'
                          }}
                        >
                          {isSourcePassenger ? "Source" : "Selected"}
                        </Typography>
                        <Typography 
                          component="span"
                          variant="caption"
                          sx={{ 
                            display: 'inline-block',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: hasRemainingBalance ? 'success.main' : 'grey.400',
                            color: hasRemainingBalance ? 'success.main' : 'grey.600',
                            bgcolor: hasRemainingBalance ? 'success.light' : 'grey.100',
                            fontSize: '0.7rem',
                            height: 20,
                            lineHeight: '20px'
                          }}
                        >
                          {hasRemainingBalance ? `$${totalRemaining.toFixed(2)} remaining` : "Fully paid"}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
        </List>

        {passengers.filter(passenger => {
          // Show passengers who either:
          // 1. Are in selectedPassengers, OR
          // 2. Have selected items in selectedItems
          const hasSelectedItems = selectedPassengers.includes(passenger.id) || 
                 (selectedItems && selectedItems[passenger.id] && selectedItems[passenger.id].length > 0);
          
          if (!hasSelectedItems) return false;
          
          // Check if passenger has any remaining balance
          if (getRemainingAmount && selectedItems) {
            const passengerItems = selectedItems[passenger.id] || [];
            const hasRemainingBalance = passengerItems.some(itemType => {
              const itemKey = `${passenger.id}-${itemType}`;
              const remaining = getRemainingAmount(itemKey);
              return remaining.remaining > 0;
            });
            return hasRemainingBalance;
          }
          
          return true;
        }).length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No passengers with remaining balance available for copying
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleCopyToAll}
          variant="contained"
          color="primary"
          disabled={passengers.filter(p => p.id !== sourcePassengerId && selectedPassengers.includes(p.id)).length === 0}
        >
          Copy to All Other Passengers
        </Button>
        <Button 
          onClick={handleCopyToSelected}
          variant="outlined"
          color="primary"
          disabled={selectedPassengerIds.length === 0}
        >
          Copy to Selected ({selectedPassengerIds.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
