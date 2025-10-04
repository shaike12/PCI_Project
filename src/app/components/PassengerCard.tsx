"use client";

import * as React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton
} from '@mui/material';
import {
  Check as CheckIcon,
  Person as PersonIcon,
  Flight as FlightIcon,
  EventSeat as EventSeatIcon,
  Luggage as LuggageIcon,
  CreditCard as CreditCardIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import type { Passenger } from '@/types/reservation';

interface PassengerCardProps {
  passenger: Passenger;
  passengerData: any;
  isExpanded: boolean;
  isItemSelected: (passengerId: string, itemType: string) => boolean;
  togglePassenger: (passengerId: string) => void;
  toggleAllItemsForPassenger: (passengerId: string) => void;
  toggleItem: (passengerId: string, itemType: string) => void;
  toggleExpanded: (passengerId: string) => void;
  copyToClipboard: (text: string, label: string) => void;
}

function PassengerCard({
  passenger,
  passengerData,
  isExpanded,
  isItemSelected,
  togglePassenger,
  toggleAllItemsForPassenger,
  toggleItem,
  toggleExpanded,
  copyToClipboard,
}: PassengerCardProps) {
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
          cursor: 'pointer',
          bgcolor: 'white',
          color: 'inherit',
          opacity: 1,
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: 'grey.50'
          }
        }}
        onClick={() => {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[DEBUG] Passenger name clicked:', passenger.id);
          }
          togglePassenger(passenger.id);
          toggleExpanded(passenger.id);
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <PersonIcon sx={{ mr: 1 }} />
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 'medium', 
                mr: 2, 
                cursor: 'pointer', 
                userSelect: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleAllItemsForPassenger(passenger.id);
              }}
              title="Select/Deselect all items for this passenger"
            >
              {passenger.name}
            </Typography>
          </Box>
          
          {/* Product Icons */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            maxWidth: '180px',
            justifyItems: 'center'
          }}>
            {/* Flight Ticket Icon */}
            <Box
              sx={{
                position: 'relative',
                width: '20px',
                height: '20px',
                cursor: passengerData.ticket.status === 'Paid' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: passengerData.ticket.status === 'Paid' ? 'none' : 'scale(1.1)'
                }
              }}
              title={passengerData.ticket.status === 'Paid' ? 'Ticket Already Paid' : (isItemSelected(passenger.id, 'ticket') ? 'Remove product' : 'Add product')}
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
            </Box>
            
            {/* Seat Icon */}
            {passengerData.ancillaries.seat && (
            <Box
              sx={{
                position: 'relative',
                width: '20px',
                height: '20px',
                cursor: passengerData.ancillaries.seat.status === 'Paid' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: passengerData.ancillaries.seat.status === 'Paid' ? 'none' : 'scale(1.1)'
                }
              }}
              title={passengerData.ancillaries.seat.status === 'Paid' ? 'Seat Already Paid' : (isItemSelected(passenger.id, 'seat') ? 'Remove product' : 'Add product')}
              onClick={(e) => {
                e.stopPropagation();
                if (passengerData.ancillaries.seat.status !== 'Paid') {
                  toggleItem(passenger.id, 'seat');
                }
              }}
            >
              <EventSeatIcon
                sx={{
                  fontSize: 20,
                  color: (() => {
                    if (passengerData.ancillaries.seat.status === 'Paid') return 'grey.500';
                    return isItemSelected(passenger.id, 'seat') ? 'warning.main' : 'warning.main';
                  })(),
                  opacity: passengerData.ancillaries.seat.status === 'Paid' ? 0.3 : 1,
                  zIndex: 2,
                  position: 'relative'
                }}
              />
            </Box>
            )}
            
            {/* Baggage Icon */}
            {passengerData.ancillaries.bag && (
            <Box
              sx={{
                position: 'relative',
                width: '20px',
                height: '20px',
                cursor: passengerData.ancillaries.bag.status === 'Paid' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: passengerData.ancillaries.bag.status === 'Paid' ? 'none' : 'scale(1.1)'
                }
              }}
              title={passengerData.ancillaries.bag.status === 'Paid' ? 'Baggage Already Paid' : (isItemSelected(passenger.id, 'bag') ? 'Remove product' : 'Add product')}
              onClick={(e) => {
                e.stopPropagation();
                if (passengerData.ancillaries.bag.status !== 'Paid') {
                  toggleItem(passenger.id, 'bag');
                }
              }}
            >
              <LuggageIcon
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
            </Box>
            )}
            
            {/* Second Bag Icon */}
            {passengerData.ancillaries.secondBag && (
              <Box
                sx={{
                  position: 'relative',
                  width: '20px',
                  height: '20px',
                  cursor: passengerData.ancillaries.secondBag.status === 'Paid' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: passengerData.ancillaries.secondBag.status === 'Paid' ? 'none' : 'scale(1.1)'
                  }
                }}
                title={passengerData.ancillaries.secondBag.status === 'Paid' ? 'Second Bag Already Paid' : (isItemSelected(passenger.id, 'secondBag') ? 'Remove product' : 'Add product')}
                onClick={(e) => {
                  e.stopPropagation();
                  if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status !== 'Paid') {
                    toggleItem(passenger.id, 'secondBag');
                  }
                }}
              >
                <LuggageIcon
                  sx={{
                    fontSize: 20,
                    color: (() => {
                      if (passengerData.ancillaries.secondBag.status === 'Paid') return 'grey.500';
                      return isItemSelected(passenger.id, 'secondBag') ? 'warning.main' : 'warning.main';
                    })(),
                    opacity: passengerData.ancillaries.secondBag.status === 'Paid' ? 0.3 : 1,
                    zIndex: 2,
                    position: 'relative'
                  }}
                />
              </Box>
            )}
            
            {/* Third Bag Icon */}
            {passengerData.ancillaries.thirdBag && (
              <Box
                sx={{
                  position: 'relative',
                  width: '20px',
                  height: '20px',
                  cursor: passengerData.ancillaries.thirdBag.status === 'Paid' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: passengerData.ancillaries.thirdBag.status === 'Paid' ? 'none' : 'scale(1.1)'
                  }
                }}
                title={passengerData.ancillaries.thirdBag.status === 'Paid' ? 'Third Bag Already Paid' : (isItemSelected(passenger.id, 'thirdBag') ? 'Remove product' : 'Add product')}
                onClick={(e) => {
                  e.stopPropagation();
                  if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status !== 'Paid') {
                    toggleItem(passenger.id, 'thirdBag');
                  }
                }}
              >
                <LuggageIcon
                  sx={{
                    fontSize: 20,
                    color: (() => {
                      if (passengerData.ancillaries.thirdBag.status === 'Paid') return 'grey.500';
                      return isItemSelected(passenger.id, 'thirdBag') ? 'warning.main' : 'warning.main';
                    })(),
                    opacity: passengerData.ancillaries.thirdBag.status === 'Paid' ? 0.3 : 1,
                    zIndex: 2,
                    position: 'relative'
                  }}
                />
              </Box>
            )}
            
            {/* UATP Icon */}
            {passengerData.ancillaries.uatp && (
              <Box
                sx={{
                  position: 'relative',
                  width: '20px',
                  height: '20px',
                  cursor: passengerData.ancillaries.uatp.status === 'Paid' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: passengerData.ancillaries.uatp.status === 'Paid' ? 'none' : 'scale(1.1)'
                  }
                }}
                title={passengerData.ancillaries.uatp.status === 'Paid' ? 'UATP Already Paid' : (isItemSelected(passenger.id, 'uatp') ? 'Remove product' : 'Add product')}
                onClick={(e) => {
                  e.stopPropagation();
                  if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status !== 'Paid') {
                    toggleItem(passenger.id, 'uatp');
                  }
                }}
              >
                <CreditCardIcon
                  sx={{
                    fontSize: 20,
                    color: (() => {
                      if (passengerData.ancillaries.uatp.status === 'Paid') return 'grey.500';
                      return isItemSelected(passenger.id, 'uatp') ? 'warning.main' : 'warning.main';
                    })(),
                    opacity: passengerData.ancillaries.uatp.status === 'Paid' ? 0.3 : 1,
                    zIndex: 2,
                    position: 'relative'
                  }}
                />
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (process.env.NODE_ENV !== 'production') {
                  console.log('[DEBUG] Expand button clicked for passenger:', passenger.id);
                }
                toggleExpanded(passenger.id);
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
                <FlightIcon sx={{ mr: 1, color: passengerData.ticket.status === 'Paid' ? 'grey.500' : 'success.main', fontSize: 18 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                    Flight Ticket
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {passengerData.ticket.seatNumber || 'N/A'}
                  </Typography>
                  {passengerData.ticket.ticketNumber && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem', 
                        color: 'success.main', 
                        fontWeight: 'bold',
                        display: 'block',
                        mt: 0.25,
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (passengerData.ticket.ticketNumber) {
                          copyToClipboard(passengerData.ticket.ticketNumber, 'Ticket number');
                        }
                      }}
                      title="Click to copy to clipboard"
                    >
                      {passengerData.ticket.ticketNumber}
                    </Typography>
                  )}
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

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
            Ancillaries:
          </Typography>

          {/* Seat */}
          {passengerData.ancillaries.seat && (
          <Paper
            sx={{
              p: 1,
              mb: 0.5,
              cursor: passengerData.ancillaries.seat.status === 'Paid' ? 'not-allowed' : 'pointer',
              border: 1,
              borderColor: (() => {
                if (passengerData.ancillaries.seat.status === 'Paid') return 'grey.400';
                return isItemSelected(passenger.id, 'seat') ? 'warning.main' : 'grey.300';
              })(),
              bgcolor: (() => {
                if (passengerData.ancillaries.seat.status === 'Paid') return 'grey.100';
                return isItemSelected(passenger.id, 'seat') ? 'warning.light' : 'white';
              })(),
              opacity: passengerData.ancillaries.seat.status === 'Paid' ? 0.6 : 1,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: passengerData.ancillaries.seat.status === 'Paid' ? 'grey.400' : 'warning.main',
                bgcolor: passengerData.ancillaries.seat.status === 'Paid' ? 'grey.100' : (isItemSelected(passenger.id, 'seat') ? 'warning.main' : 'warning.light')
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
                <EventSeatIcon sx={{ mr: 1, color: passengerData.ancillaries.seat.status === 'Paid' ? 'grey.500' : 'warning.main', fontSize: 18 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                    Seat Selection
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {passengerData.ancillaries.seat.seatNumber || 'N/A'}
                  </Typography>
                  {passengerData.ancillaries.seat.ancillaryNumber && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem', 
                        color: 'warning.main', 
                        fontWeight: 'bold',
                        display: 'block',
                        mt: 0.25,
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (passengerData.ancillaries.seat.ancillaryNumber) {
                          copyToClipboard(passengerData.ancillaries.seat.ancillaryNumber, 'Seat number');
                        }
                      }}
                      title="Click to copy to clipboard"
                    >
                      {passengerData.ancillaries.seat.ancillaryNumber}
                    </Typography>
                  )}
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
                  <CheckIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                )}
              </Box>
            </Box>
          </Paper>
          )}

          {/* Baggage */}
          {passengerData.ancillaries.bag && (
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
                <LuggageIcon sx={{ mr: 1, color: passengerData.ancillaries.bag.status === 'Paid' ? 'grey.500' : 'warning.main', fontSize: 18 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                    Baggage
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {passengerData.ancillaries.bag.weight ? `${passengerData.ancillaries.bag.weight}kg` : 'N/A'}
                  </Typography>
                  {passengerData.ancillaries.bag.ancillaryNumber && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem', 
                        color: 'warning.main', 
                        fontWeight: 'bold',
                        display: 'block',
                        mt: 0.25,
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (passengerData.ancillaries.bag.ancillaryNumber) {
                          copyToClipboard(passengerData.ancillaries.bag.ancillaryNumber, 'Baggage number');
                        }
                      }}
                      title="Click to copy to clipboard"
                    >
                      {passengerData.ancillaries.bag.ancillaryNumber}
                    </Typography>
                  )}
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
          )}
          
          {/* Second Bag */}
          {passengerData.ancillaries.secondBag && (
            <Paper
              sx={{
                p: 1,
                mb: 0.5,
                cursor: passengerData.ancillaries.secondBag?.status === 'Paid' ? 'not-allowed' : 'pointer',
                border: 1,
                borderColor: passengerData.ancillaries.secondBag?.status === 'Paid' 
                  ? 'grey.400' 
                  : (isItemSelected(passenger.id, 'secondBag') ? 'warning.main' : 'grey.300'),
                bgcolor: passengerData.ancillaries.secondBag?.status === 'Paid' 
                  ? 'grey.100' 
                  : (isItemSelected(passenger.id, 'secondBag') ? 'warning.light' : 'white'),
                opacity: passengerData.ancillaries.secondBag?.status === 'Paid' ? 0.6 : 1,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: passengerData.ancillaries.secondBag?.status === 'Paid' ? 'grey.400' : 'warning.main',
                  bgcolor: passengerData.ancillaries.secondBag?.status === 'Paid' ? 'grey.100' : (isItemSelected(passenger.id, 'secondBag') ? 'warning.main' : 'warning.light')
                }
              }}
              onClick={() => {
                if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status !== 'Paid') {
                  toggleItem(passenger.id, 'secondBag');
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <LuggageIcon sx={{ mr: 1, color: passengerData.ancillaries.secondBag?.status === 'Paid' ? 'grey.500' : 'warning.main', fontSize: 18 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                      Second Bag
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {passengerData.ancillaries.secondBag?.weight ? `${passengerData.ancillaries.secondBag?.weight}kg` : 'N/A'}
                    </Typography>
                    {passengerData.ancillaries.secondBag?.ancillaryNumber && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          color: 'warning.main', 
                          fontWeight: 'bold',
                          display: 'block',
                          mt: 0.25,
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (passengerData.ancillaries.secondBag?.ancillaryNumber) {
                            copyToClipboard(passengerData.ancillaries.secondBag.ancillaryNumber, 'Second Bag number');
                          }
                        }}
                        title="Click to copy to clipboard"
                      >
                        {passengerData.ancillaries.secondBag.ancillaryNumber}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ 
                    color: passengerData.ancillaries.secondBag?.status === 'Paid' ? 'success.main' : 'warning.main',
                    fontWeight: 'medium',
                    fontSize: '0.75rem'
                  }}>
                    {passengerData.ancillaries.secondBag?.status}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: 'primary.main'
                  }}>
                    ${passengerData.ancillaries.secondBag?.price || 0}
                  </Typography>
                  {isItemSelected(passenger.id, 'secondBag') && (
                    <CheckIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                  )}
                </Box>
              </Box>
            </Paper>
          )}
          
          {/* Third Bag */}
          {passengerData.ancillaries.thirdBag && (
            <Paper
              sx={{ 
                p: 1,
                mb: 0.5,
                cursor: passengerData.ancillaries.thirdBag?.status === 'Paid' ? 'not-allowed' : 'pointer',
                border: 1,
                borderColor: passengerData.ancillaries.thirdBag?.status === 'Paid' 
                  ? 'grey.400' 
                  : (isItemSelected(passenger.id, 'thirdBag') ? 'warning.main' : 'grey.300'),
                bgcolor: passengerData.ancillaries.thirdBag?.status === 'Paid' 
                  ? 'grey.100' 
                  : (isItemSelected(passenger.id, 'thirdBag') ? 'warning.light' : 'white'),
                opacity: passengerData.ancillaries.thirdBag?.status === 'Paid' ? 0.6 : 1,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: passengerData.ancillaries.thirdBag?.status === 'Paid' ? 'grey.400' : 'warning.main',
                  bgcolor: passengerData.ancillaries.thirdBag?.status === 'Paid' ? 'grey.100' : (isItemSelected(passenger.id, 'thirdBag') ? 'warning.main' : 'warning.light')
                }
              }}
              onClick={() => {
                if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status !== 'Paid') {
                  toggleItem(passenger.id, 'thirdBag');
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <LuggageIcon sx={{ mr: 1, color: passengerData.ancillaries.thirdBag?.status === 'Paid' ? 'grey.500' : 'warning.main', fontSize: 18 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                      Third Bag
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {passengerData.ancillaries.thirdBag?.weight ? `${passengerData.ancillaries.thirdBag?.weight}kg` : 'N/A'}
                    </Typography>
                    {passengerData.ancillaries.thirdBag?.ancillaryNumber && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          color: 'warning.main', 
                          fontWeight: 'bold',
                          display: 'block',
                          mt: 0.25,
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (passengerData.ancillaries.thirdBag?.ancillaryNumber) {
                            copyToClipboard(passengerData.ancillaries.thirdBag.ancillaryNumber, 'Third Bag number');
                          }
                        }}
                        title="Click to copy to clipboard"
                      >
                        {passengerData.ancillaries.thirdBag.ancillaryNumber}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ 
                    color: passengerData.ancillaries.thirdBag?.status === 'Paid' ? 'success.main' : 'warning.main',
                    fontWeight: 'medium',
                    fontSize: '0.75rem'
                  }}>
                    {passengerData.ancillaries.thirdBag?.status}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: 'primary.main'
                  }}>
                    ${passengerData.ancillaries.thirdBag?.price || 0}
                  </Typography>
                  {isItemSelected(passenger.id, 'thirdBag') && (
                    <CheckIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                  )}
                </Box>
              </Box>
            </Paper>
          )}
          
          {/* UATP */}
          {passengerData.ancillaries.uatp && (
            <Paper
              sx={{ 
                p: 1,
                cursor: passengerData.ancillaries.uatp?.status === 'Paid' ? 'not-allowed' : 'pointer',
                border: 1,
                borderColor: passengerData.ancillaries.uatp?.status === 'Paid' 
                  ? 'grey.400' 
                  : (isItemSelected(passenger.id, 'uatp') ? 'warning.main' : 'grey.300'),
                bgcolor: passengerData.ancillaries.uatp?.status === 'Paid' 
                  ? 'grey.100' 
                  : (isItemSelected(passenger.id, 'uatp') ? 'warning.light' : 'white'),
                opacity: passengerData.ancillaries.uatp?.status === 'Paid' ? 0.6 : 1,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: passengerData.ancillaries.uatp?.status === 'Paid' ? 'grey.400' : 'warning.main',
                  bgcolor: passengerData.ancillaries.uatp?.status === 'Paid' ? 'grey.100' : (isItemSelected(passenger.id, 'uatp') ? 'warning.main' : 'warning.light')
                }
              }}
              onClick={() => {
                if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status !== 'Paid') {
                  toggleItem(passenger.id, 'uatp');
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <CreditCardIcon sx={{ mr: 1, color: passengerData.ancillaries.uatp?.status === 'Paid' ? 'grey.500' : 'warning.main', fontSize: 18 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                      UATP
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {passengerData.ancillaries.uatp?.uatpNumber || 'N/A'}
                    </Typography>
                    {passengerData.ancillaries.uatp?.status === 'Paid' && passengerData.ancillaries.uatp?.ancillaryNumber && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          color: 'warning.main', 
                          fontWeight: 'bold',
                          display: 'block',
                          mt: 0.25,
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (passengerData.ancillaries.uatp?.ancillaryNumber) {
                            copyToClipboard(passengerData.ancillaries.uatp.ancillaryNumber, 'UATP number');
                          }
                        }}
                        title="Click to copy to clipboard"
                      >
                        {passengerData.ancillaries.uatp.ancillaryNumber}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ 
                    color: passengerData.ancillaries.uatp?.status === 'Paid' ? 'success.main' : 'warning.main',
                    fontWeight: 'medium',
                    fontSize: '0.75rem'
                  }}>
                    {passengerData.ancillaries.uatp?.status}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: 'primary.main'
                  }}>
                    ${passengerData.ancillaries.uatp?.price || 0}
                  </Typography>
                  {isItemSelected(passenger.id, 'uatp') && (
                    <CheckIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                  )}
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      )}
    </Paper>
  );
}

export default PassengerCard;
