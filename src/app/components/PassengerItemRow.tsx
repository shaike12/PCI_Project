"use client";

import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import FlightIcon from "@mui/icons-material/Flight";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import LuggageIcon from "@mui/icons-material/Luggage";
import CheckIcon from "@mui/icons-material/Check";

interface PassengerItemRowProps {
  itemType: 'ticket' | 'seat' | 'bag';
  passengerData: any;
  isSelected: boolean;
  onToggle: () => void;
}

export function PassengerItemRow({ itemType, passengerData, isSelected, onToggle }: PassengerItemRowProps) {
  let title = '';
  let price = 0;
  let icon: any = <FlightIcon sx={{ fontSize: 18 }} />;
  let status = '';
  let number = '';
  let color = 'primary.main';
  let borderColor = 'grey.300';
  let bgColor = 'white';

  if (itemType === 'ticket') {
    title = 'Flight Ticket';
    price = passengerData.ticket.price;
    status = passengerData.ticket.status;
    number = passengerData.ticket.ticketNumber;
    icon = <FlightIcon sx={{ fontSize: 18 }} />;
    color = 'primary.main';
    borderColor = status === 'Paid' ? 'grey.400' : (isSelected ? 'success.main' : 'grey.300');
    bgColor = status === 'Paid' ? 'grey.100' : (isSelected ? 'success.light' : 'white');
  } else if (itemType === 'seat') {
    title = 'Seat Selection';
    price = passengerData.ancillaries.seat.price;
    status = passengerData.ancillaries.seat.status;
    number = passengerData.ancillaries.seat.emdNumber;
    icon = <EventSeatIcon sx={{ fontSize: 18 }} />;
    color = 'info.main';
    borderColor = status === 'Paid' ? 'grey.400' : (isSelected ? 'info.main' : 'grey.300');
    bgColor = status === 'Paid' ? 'grey.100' : (isSelected ? 'info.light' : 'white');
  } else if (itemType === 'bag') {
    title = 'Baggage';
    price = passengerData.ancillaries.bag.price;
    status = passengerData.ancillaries.bag.status;
    number = passengerData.ancillaries.bag.emdNumber;
    icon = <LuggageIcon sx={{ fontSize: 18 }} />;
    color = 'warning.main';
    borderColor = status === 'Paid' ? 'grey.400' : (isSelected ? 'warning.main' : 'grey.300');
    bgColor = status === 'Paid' ? 'grey.100' : (isSelected ? 'warning.light' : 'white');
  }

  const isPaid = status === 'Paid';

  return (
    <Paper
      sx={{
        p: 1,
        mb: 0.5,
        cursor: isPaid ? 'not-allowed' : 'pointer',
        border: 1,
        borderColor,
        bgcolor: bgColor,
        opacity: isPaid ? 0.6 : 1,
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: isPaid ? 'grey.400' : (isSelected ? color : color),
          bgcolor: isPaid ? 'grey.100' : (isSelected ? color : `${color}.light`)
        }
      }}
      onClick={() => {
        if (!isPaid) {
          onToggle();
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {React.cloneElement(icon, { 
            sx: { 
              mr: 1, 
              color: isPaid ? 'grey.500' : color, 
              fontSize: 18 
            } 
          })}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {number}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          <Typography variant="caption" sx={{ 
            color: isPaid ? 'success.main' : 'warning.main',
            fontWeight: 'medium',
            fontSize: '0.75rem'
          }}>
            {status}
          </Typography>
          <Typography variant="body2" sx={{ 
            fontWeight: 'bold',
            fontSize: '0.875rem',
            color: 'primary.main'
          }}>
            ${price}
          </Typography>
          {isSelected && (
            <CheckIcon sx={{ color, fontSize: 16 }} />
          )}
        </Box>
      </Box>
    </Paper>
  );
}
