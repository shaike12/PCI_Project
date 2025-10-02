"use client";

import { Box, IconButton, Paper, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import FlightIcon from "@mui/icons-material/Flight";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import LuggageIcon from "@mui/icons-material/Luggage";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { Reservation } from "@/types/reservation";

interface PassengerCardProps {
  passenger: { id: string; fullName: string; hasUnpaidItems: boolean };
  passengerData: any;
  isExpanded: boolean;
  isItemSelected: (passengerId: string, item: 'ticket' | 'seat' | 'bag') => boolean;
  togglePassenger: (passengerId: string) => void;
  toggleAllItemsForPassenger: (passengerId: string) => void;
  toggleItem: (passengerId: string, item: 'ticket' | 'seat' | 'bag') => void;
  toggleExpanded: (passengerId: string) => void;
  children?: React.ReactNode;
}

export function PassengerCard({
  passenger,
  passengerData,
  isExpanded,
  isItemSelected,
  togglePassenger,
  toggleAllItemsForPassenger,
  toggleItem,
  toggleExpanded,
  children
}: PassengerCardProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        mb: 1.5,
        border: 1,
        borderColor: 'grey.300',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          p: 1.5,
          cursor: passenger.hasUnpaidItems ? 'pointer' : 'not-allowed',
          bgcolor: (() => {
            if (!passenger.hasUnpaidItems) return 'grey.100';
            return 'white';
          })(),
          color: (() => {
            if (!passenger.hasUnpaidItems) return 'grey.500';
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
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
                <EventSeatIcon
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

      {children}
    </Paper>
  );
}
