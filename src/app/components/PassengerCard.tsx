"use client";

import * as React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip
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
  hasSelectedItems: (passengerId: string) => boolean;
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
  hasSelectedItems,
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
        borderColor: '#E4DFDA',
        overflow: 'hidden'
      }}
    >
      {/* Passenger Header */}
      <Box
        sx={{
          p: 1.5,
          cursor: 'pointer',
          bgcolor: (() => {
            // Check if all items are paid (no items to pay for)
            const allPaid = passengerData.ticket?.status === 'Paid' && 
                           (!passengerData.ancillaries?.seat || passengerData.ancillaries.seat.status === 'Paid') && 
                           (!passengerData.ancillaries?.bag || passengerData.ancillaries.bag.status === 'Paid') &&
                           (!passengerData.ancillaries?.secondBag || passengerData.ancillaries.secondBag.status === 'Paid') &&
                           (!passengerData.ancillaries?.thirdBag || passengerData.ancillaries.thirdBag.status === 'Paid') &&
                           (!passengerData.ancillaries?.uatp || passengerData.ancillaries.uatp.status === 'Paid');
            
            const hasSelected = hasSelectedItems(passenger.id);
            
            console.log(`[PASSENGER_BG] ${passenger.name} (${passenger.id}):`, {
              allPaid,
              hasSelected,
              ticketStatus: passengerData.ticket?.status,
              seatStatus: passengerData.ancillaries?.seat?.status,
              bagStatus: passengerData.ancillaries?.bag?.status,
              secondBagStatus: passengerData.ancillaries?.secondBag?.status,
              thirdBagStatus: passengerData.ancillaries?.thirdBag?.status,
              uatpStatus: passengerData.ancillaries?.uatp?.status
            });
            
            if (allPaid) {
              console.log(`[PASSENGER_BG] ${passenger.name}: Using gray background (allPaid=true)`);
              return '#E0E0E0'; // Light gray background for fully paid passengers
            }
            // Check if passenger has selected items for payment
            if (hasSelected) {
              console.log(`[PASSENGER_BG] ${passenger.name}: Using beige background (hasSelected=true)`);
              return '#EFE3D1'; // Light beige background for selected passengers
            }
            console.log(`[PASSENGER_BG] ${passenger.name}: Using white background (default)`);
            return 'white'; // White background for passengers with no selected items
          })(),
          color: 'inherit',
          opacity: 1,
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: (() => {
              const allPaid = passengerData.ticket?.status === 'Paid' && 
                             (!passengerData.ancillaries?.seat || passengerData.ancillaries.seat.status === 'Paid') && 
                             (!passengerData.ancillaries?.bag || passengerData.ancillaries.bag.status === 'Paid') &&
                             (!passengerData.ancillaries?.secondBag || passengerData.ancillaries.secondBag.status === 'Paid') &&
                             (!passengerData.ancillaries?.thirdBag || passengerData.ancillaries.thirdBag.status === 'Paid') &&
                             (!passengerData.ancillaries?.uatp || passengerData.ancillaries.uatp.status === 'Paid');
              if (allPaid) {
                return '#C0C0C0'; // Darker gray on hover for fully paid passengers
              }
              if (hasSelectedItems(passenger.id)) {
                return '#d4c4a8'; // Darker beige on hover for selected passengers
              }
              return '#E4DFDA'; // Light background on hover for unselected passengers
            })()
          }
        }}
        onClick={() => {
          toggleAllItemsForPassenger(passenger.id);
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
            <Tooltip title={passengerData.ticket?.status === 'Paid' ? 'Ticket Already Completed' : (isItemSelected(passenger.id, 'ticket') ? 'Remove flight ticket' : 'Add flight ticket')} arrow>
              <Box
                sx={{
                  position: 'relative',
                  width: '20px',
                  height: '20px',
                  cursor: passengerData.ticket?.status === 'Paid' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: passengerData.ticket?.status === 'Paid' ? 'none' : 'scale(1.1)'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (passengerData.ticket?.status !== 'Paid') {
                    toggleItem(passenger.id, 'ticket');
                  }
                }}
              >
                <FlightIcon
                  sx={{
                    fontSize: 20,
                    color: (() => {
                      if (passengerData.ticket?.status === 'Paid') return '#C1666B';
                      return isItemSelected(passenger.id, 'ticket') ? '#48A9A6' : '#48A9A6';
                    })(),
                    opacity: passengerData.ticket?.status === 'Paid' ? 0.3 : 1,
                    zIndex: 2,
                    position: 'relative'
                  }}
                />
              </Box>
            </Tooltip>
            
            {/* Seat Icon */}
            {passengerData.ancillaries.seat && (
            <Tooltip title={passengerData.ancillaries?.seat?.status === 'Paid' ? 'Seat Already Completed' : (isItemSelected(passenger.id, 'seat') ? 'Remove seat' : 'Add seat')} arrow>
              <Box
                sx={{
                  position: 'relative',
                  width: '20px',
                  height: '20px',
                  cursor: passengerData.ancillaries?.seat?.status === 'Paid' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: passengerData.ancillaries?.seat?.status === 'Paid' ? 'none' : 'scale(1.1)'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (passengerData.ancillaries?.seat?.status !== 'Paid') {
                    toggleItem(passenger.id, 'seat');
                  }
                }}
              >
                <EventSeatIcon
                  sx={{
                    fontSize: 20,
                    color: (() => {
                      if (passengerData.ancillaries?.seat?.status === 'Paid') return '#C1666B';
                      return isItemSelected(passenger.id, 'seat') ? '#48A9A6' : '#48A9A6';
                    })(),
                    opacity: passengerData.ancillaries?.seat?.status === 'Paid' ? 0.3 : 1,
                    zIndex: 2,
                    position: 'relative'
                  }}
                />
              </Box>
            </Tooltip>
            )}
            
            {/* Baggage Icon */}
            {passengerData.ancillaries.bag && (
            <Tooltip title={passengerData.ancillaries?.bag?.status === 'Paid' ? 'Baggage Already Completed' : (isItemSelected(passenger.id, 'bag') ? 'Remove baggage' : 'Add baggage')} arrow>
              <Box
                sx={{
                  position: 'relative',
                  width: '20px',
                  height: '20px',
                  cursor: passengerData.ancillaries?.bag?.status === 'Paid' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: passengerData.ancillaries?.bag?.status === 'Paid' ? 'none' : 'scale(1.1)'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (passengerData.ancillaries?.bag?.status !== 'Paid') {
                    toggleItem(passenger.id, 'bag');
                  }
                }}
              >
                <LuggageIcon
                  sx={{
                    fontSize: 20,
                    color: (() => {
                      if (passengerData.ancillaries?.bag?.status === 'Paid') return '#C1666B';
                      return isItemSelected(passenger.id, 'bag') ? '#48A9A6' : '#48A9A6';
                    })(),
                    opacity: passengerData.ancillaries?.bag?.status === 'Paid' ? 0.3 : 1,
                    zIndex: 2,
                    position: 'relative'
                  }}
                />
              </Box>
            </Tooltip>
            )}
            
            {/* Second Bag Icon */}
            {passengerData.ancillaries.secondBag && (
              <Tooltip title={(passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status === 'Paid') ? 'Second Bag Already Completed' : (isItemSelected(passenger.id, 'secondBag') ? 'Remove second baggage' : 'Add second baggage')} arrow>
                <Box
                  sx={{
                    position: 'relative',
                    width: '20px',
                    height: '20px',
                    cursor: (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status === 'Paid') ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status === 'Paid') ? 'none' : 'scale(1.1)'
                    }
                  }}
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
                        if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status === 'Paid') return '#C1666B';
                        return isItemSelected(passenger.id, 'secondBag') ? '#48A9A6' : '#48A9A6';
                      })(),
                      opacity: (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status === 'Paid') ? 0.3 : 1,
                      zIndex: 2,
                      position: 'relative'
                    }}
                  />
                </Box>
              </Tooltip>
            )}
            
            {/* Third Bag Icon */}
            {passengerData.ancillaries.thirdBag && (
              <Tooltip title={(passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status === 'Paid') ? 'Third Bag Already Completed' : (isItemSelected(passenger.id, 'thirdBag') ? 'Remove third baggage' : 'Add third baggage')} arrow>
                <Box
                  sx={{
                    position: 'relative',
                    width: '20px',
                    height: '20px',
                    cursor: (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status === 'Paid') ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status === 'Paid') ? 'none' : 'scale(1.1)'
                    }
                  }}
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
                        if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status === 'Paid') return '#C1666B';
                        return isItemSelected(passenger.id, 'thirdBag') ? '#48A9A6' : '#48A9A6';
                      })(),
                      opacity: (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status === 'Paid') ? 0.3 : 1,
                      zIndex: 2,
                      position: 'relative'
                    }}
                  />
                </Box>
              </Tooltip>
            )}
            
            {/* UATP Icon */}
            {passengerData.ancillaries.uatp && (
              <Tooltip title={(passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status === 'Paid') ? 'UATP Already Completed' : (isItemSelected(passenger.id, 'uatp') ? 'Remove UATP voucher' : 'Add UATP voucher')} arrow>
                <Box
                  sx={{
                    position: 'relative',
                    width: '20px',
                    height: '20px',
                    cursor: (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status === 'Paid') ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status === 'Paid') ? 'none' : 'scale(1.1)'
                    }
                  }}
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
                        if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status === 'Paid') return '#C1666B';
                        return isItemSelected(passenger.id, 'uatp') ? '#48A9A6' : '#48A9A6';
                      })(),
                      opacity: (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status === 'Paid') ? 0.3 : 1,
                      zIndex: 2,
                      position: 'relative'
                    }}
                  />
                </Box>
              </Tooltip>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={isExpanded ? 'Hide Products' : 'Show Products'} arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(passenger.id);
                }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Expanded Content */}
      {isExpanded && (
        <Box sx={{ p: 1.5, bgcolor: 'white' }}>
          {/* Flight Ticket */}
          <Paper
            sx={{
              p: 1,
              mb: 0.5,
              cursor: passengerData.ticket?.status === 'Paid' ? 'not-allowed' : 'pointer',
              border: 1,
              borderColor: (() => {
                if (passengerData.ticket?.status === 'Paid') return '#C1666B';
                return isItemSelected(passenger.id, 'ticket') ? '#48A9A6' : '#E4DFDA';
              })(),
              bgcolor: (() => {
                if (passengerData.ticket?.status === 'Paid') return '#E4DFDA';
                return isItemSelected(passenger.id, 'ticket') ? '#E4DFDA' : 'white';
              })(),
              opacity: passengerData.ticket?.status === 'Paid' ? 0.6 : 1,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: passengerData.ticket?.status === 'Paid' ? '#C1666B' : '#48A9A6',
                bgcolor: passengerData.ticket?.status === 'Paid' ? '#E4DFDA' : (isItemSelected(passenger.id, 'ticket') ? '#48A9A6' : '#E4DFDA')
              }
            }}
            onClick={() => {
              if (passengerData.ticket?.status !== 'Paid') {
                toggleItem(passenger.id, 'ticket');
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <FlightIcon sx={{ mr: 1, color: passengerData.ticket?.status === 'Paid' ? '#9E9E9E' : '#48A9A6', fontSize: 18 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                    Flight Ticket
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#1B358F', fontSize: '0.75rem' }}>
                    {passengerData.ticket.seatNumber || 'N/A'}
                  </Typography>
                  {passengerData.ticket.ticketNumber && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem', 
                        color: '#48A9A6', 
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
                  color: passengerData.ticket?.status === 'Paid' ? '#9E9E9E' : '#D4B483',
                  fontWeight: 'medium',
                  fontSize: '0.75rem'
                }}>
                  {passengerData.ticket?.status}
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  color: '#1B358F'
                }}>
                  ${passengerData.ticket.price}
                </Typography>
                {isItemSelected(passenger.id, 'ticket') && (
                  <CheckIcon sx={{ color: '#48A9A6', fontSize: 16 }} />
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
              cursor: passengerData.ancillaries?.seat?.status === 'Paid' ? 'not-allowed' : 'pointer',
              border: 1,
              borderColor: (() => {
                if (passengerData.ancillaries?.seat?.status === 'Paid') return '#C1666B';
                return isItemSelected(passenger.id, 'seat') ? '#D4B483' : '#E4DFDA';
              })(),
              bgcolor: (() => {
                if (passengerData.ancillaries?.seat?.status === 'Paid') return '#E4DFDA';
                return isItemSelected(passenger.id, 'seat') ? '#E4DFDA' : 'white';
              })(),
              opacity: passengerData.ancillaries?.seat?.status === 'Paid' ? 0.6 : 1,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: passengerData.ancillaries?.seat?.status === 'Paid' ? '#C1666B' : '#D4B483',
                bgcolor: passengerData.ancillaries?.seat?.status === 'Paid' ? '#E4DFDA' : (isItemSelected(passenger.id, 'seat') ? '#D4B483' : '#E4DFDA')
              }
            }}
            onClick={() => {
              if (passengerData.ancillaries?.seat?.status !== 'Paid') {
                toggleItem(passenger.id, 'seat');
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <EventSeatIcon sx={{ mr: 1, color: passengerData.ancillaries?.seat?.status === 'Paid' ? '#C1666B' : '#D4B483', fontSize: 18 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                    Seat ({passengerData.ancillaries.seat.seatNumber || 'N/A'})
                  </Typography>
                  {passengerData.ancillaries.seat.ancillaryNumber && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem', 
                        color: '#D4B483', 
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
                  color: passengerData.ancillaries?.seat?.status === 'Paid' ? '#9E9E9E' : '#D4B483',
                  fontWeight: 'medium',
                  fontSize: '0.75rem'
                }}>
                  {passengerData.ancillaries?.seat?.status}
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  color: '#1B358F'
                }}>
                  ${passengerData.ancillaries.seat.price}
                </Typography>
                {isItemSelected(passenger.id, 'seat') && (
                  <CheckIcon sx={{ color: '#D4B483', fontSize: 16 }} />
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
              cursor: passengerData.ancillaries?.bag?.status === 'Paid' ? 'not-allowed' : 'pointer',
              border: 1,
              borderColor: (() => {
                if (passengerData.ancillaries?.bag?.status === 'Paid') return '#C1666B';
                return isItemSelected(passenger.id, 'bag') ? '#D4B483' : '#E4DFDA';
              })(),
              bgcolor: (() => {
                if (passengerData.ancillaries?.bag?.status === 'Paid') return '#E4DFDA';
                return isItemSelected(passenger.id, 'bag') ? '#E4DFDA' : 'white';
              })(),
              opacity: passengerData.ancillaries?.bag?.status === 'Paid' ? 0.6 : 1,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: passengerData.ancillaries?.bag?.status === 'Paid' ? '#C1666B' : '#D4B483',
                bgcolor: passengerData.ancillaries?.bag?.status === 'Paid' ? '#E4DFDA' : (isItemSelected(passenger.id, 'bag') ? '#D4B483' : '#E4DFDA')
              }
            }}
            onClick={() => {
              if (passengerData.ancillaries?.bag?.status !== 'Paid') {
                toggleItem(passenger.id, 'bag');
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <LuggageIcon sx={{ mr: 1, color: passengerData.ancillaries?.bag?.status === 'Paid' ? '#C1666B' : '#D4B483', fontSize: 18 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                    Baggage (XBAF)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#1B358F', fontSize: '0.75rem' }}>
                    {passengerData.ancillaries.bag.weight ? `${passengerData.ancillaries.bag.weight}kg` : 'N/A'}
                  </Typography>
                  {passengerData.ancillaries.bag.ancillaryNumber && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem', 
                        color: '#D4B483', 
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
                  color: passengerData.ancillaries?.bag?.status === 'Paid' ? '#9E9E9E' : '#D4B483',
                  fontWeight: 'medium',
                  fontSize: '0.75rem'
                }}>
                  {passengerData.ancillaries?.bag?.status}
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  color: '#1B358F'
                }}>
                  ${passengerData.ancillaries.bag.price}
                </Typography>
                {isItemSelected(passenger.id, 'bag') && (
                  <CheckIcon sx={{ color: '#D4B483', fontSize: 16 }} />
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
                  ? '#C1666B' 
                  : (isItemSelected(passenger.id, 'secondBag') ? '#D4B483' : '#E4DFDA'),
                bgcolor: passengerData.ancillaries.secondBag?.status === 'Paid' 
                  ? '#E4DFDA' 
                  : (isItemSelected(passenger.id, 'secondBag') ? '#E4DFDA' : 'white'),
                opacity: passengerData.ancillaries.secondBag?.status === 'Paid' ? 0.6 : 1,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: passengerData.ancillaries.secondBag?.status === 'Paid' ? '#C1666B' : '#D4B483',
                  bgcolor: passengerData.ancillaries.secondBag?.status === 'Paid' ? '#E4DFDA' : (isItemSelected(passenger.id, 'secondBag') ? '#D4B483' : '#E4DFDA')
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
                  <LuggageIcon sx={{ mr: 1, color: passengerData.ancillaries.secondBag?.status === 'Paid' ? '#C1666B' : '#D4B483', fontSize: 18 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                      Second Bag (XBAS)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#1B358F', fontSize: '0.75rem' }}>
                      {passengerData.ancillaries.secondBag?.weight ? `${passengerData.ancillaries.secondBag?.weight}kg` : 'N/A'}
                    </Typography>
                    {passengerData.ancillaries.secondBag?.ancillaryNumber && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          color: '#D4B483', 
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
                    color: passengerData.ancillaries.secondBag?.status === 'Paid' ? '#9E9E9E' : '#D4B483',
                    fontWeight: 'medium',
                    fontSize: '0.75rem'
                  }}>
                    {passengerData.ancillaries.secondBag?.status}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: '#1B358F'
                  }}>
                    ${passengerData.ancillaries.secondBag?.price || 0}
                  </Typography>
                  {isItemSelected(passenger.id, 'secondBag') && (
                    <CheckIcon sx={{ color: '#D4B483', fontSize: 16 }} />
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
                  ? '#C1666B' 
                  : (isItemSelected(passenger.id, 'thirdBag') ? '#D4B483' : '#E4DFDA'),
                bgcolor: passengerData.ancillaries.thirdBag?.status === 'Paid' 
                  ? '#E4DFDA' 
                  : (isItemSelected(passenger.id, 'thirdBag') ? '#E4DFDA' : 'white'),
                opacity: passengerData.ancillaries.thirdBag?.status === 'Paid' ? 0.6 : 1,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: passengerData.ancillaries.thirdBag?.status === 'Paid' ? '#C1666B' : '#D4B483',
                  bgcolor: passengerData.ancillaries.thirdBag?.status === 'Paid' ? '#E4DFDA' : (isItemSelected(passenger.id, 'thirdBag') ? '#D4B483' : '#E4DFDA')
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
                  <LuggageIcon sx={{ mr: 1, color: passengerData.ancillaries.thirdBag?.status === 'Paid' ? '#C1666B' : '#D4B483', fontSize: 18 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                      Third Bag (XBAT)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#1B358F', fontSize: '0.75rem' }}>
                      {passengerData.ancillaries.thirdBag?.weight ? `${passengerData.ancillaries.thirdBag?.weight}kg` : 'N/A'}
                    </Typography>
                    {passengerData.ancillaries.thirdBag?.ancillaryNumber && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          color: '#D4B483', 
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
                    color: passengerData.ancillaries.thirdBag?.status === 'Paid' ? '#9E9E9E' : '#D4B483',
                    fontWeight: 'medium',
                    fontSize: '0.75rem'
                  }}>
                    {passengerData.ancillaries.thirdBag?.status}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: '#1B358F'
                  }}>
                    ${passengerData.ancillaries.thirdBag?.price || 0}
                  </Typography>
                  {isItemSelected(passenger.id, 'thirdBag') && (
                    <CheckIcon sx={{ color: '#D4B483', fontSize: 16 }} />
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
                  ? '#C1666B' 
                  : (isItemSelected(passenger.id, 'uatp') ? '#D4B483' : '#E4DFDA'),
                bgcolor: passengerData.ancillaries.uatp?.status === 'Paid' 
                  ? '#E4DFDA' 
                  : (isItemSelected(passenger.id, 'uatp') ? '#E4DFDA' : 'white'),
                opacity: passengerData.ancillaries.uatp?.status === 'Paid' ? 0.6 : 1,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: passengerData.ancillaries.uatp?.status === 'Paid' ? '#C1666B' : '#D4B483',
                  bgcolor: passengerData.ancillaries.uatp?.status === 'Paid' ? '#E4DFDA' : (isItemSelected(passenger.id, 'uatp') ? '#D4B483' : '#E4DFDA')
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
                  <CreditCardIcon sx={{ mr: 1, color: passengerData.ancillaries.uatp?.status === 'Paid' ? '#C1666B' : '#D4B483', fontSize: 18 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                      UATP
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#1B358F', fontSize: '0.75rem' }}>
                      {passengerData.ancillaries.uatp?.uatpNumber || 'N/A'}
                    </Typography>
                    {passengerData.ancillaries.uatp?.status === 'Paid' && passengerData.ancillaries.uatp?.ancillaryNumber && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          color: '#D4B483', 
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
                    color: passengerData.ancillaries.uatp?.status === 'Paid' ? '#9E9E9E' : '#D4B483',
                    fontWeight: 'medium',
                    fontSize: '0.75rem'
                  }}>
                    {passengerData.ancillaries.uatp?.status}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: '#1B358F'
                  }}>
                    ${passengerData.ancillaries.uatp?.price || 0}
                  </Typography>
                  {isItemSelected(passenger.id, 'uatp') && (
                    <CheckIcon sx={{ color: '#D4B483', fontSize: 16 }} />
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
