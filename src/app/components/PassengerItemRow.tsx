"use client";

import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import FlightIcon from "@mui/icons-material/Flight";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import LuggageIcon from "@mui/icons-material/Luggage";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CheckIcon from "@mui/icons-material/Check";

interface PassengerItemRowProps {
  itemType: 'ticket' | 'seat' | 'bag' | 'secondBag' | 'thirdBag' | 'uatp';
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
  let color = '#1B358F';
  let borderColor = '#E4DFDA';
  let bgColor = 'white';

  if (itemType === 'ticket') {
    title = 'Flight Ticket';
    price = passengerData.ticket.price;
    status = passengerData.ticket.status;
    number = passengerData.ticket.ticketNumber || '';
    icon = <FlightIcon sx={{ fontSize: 18 }} />;
    color = '#D4B483';
    borderColor = status === 'Paid' ? '#C1666B' : (isSelected ? '#D4B483' : '#E4DFDA');
    bgColor = status === 'Paid' ? '#E4DFDA' : (isSelected ? '#E4DFDA' : 'white');
  } else if (itemType === 'seat') {
    title = `Seat (${passengerData.ancillaries.seat.seatNumber || 'N/A'})`;
    price = passengerData.ancillaries.seat.price;
    status = passengerData.ancillaries.seat.status;
    number = passengerData.ancillaries.seat.ancillaryNumber || '';
    icon = <EventSeatIcon sx={{ fontSize: 18 }} />;
    color = '#D4B483';
    borderColor = status === 'Paid' ? '#C1666B' : (isSelected ? '#D4B483' : '#E4DFDA');
    bgColor = status === 'Paid' ? '#E4DFDA' : (isSelected ? '#E4DFDA' : 'white');
  } else if (itemType === 'bag') {
    title = 'Baggage (XBAF)';
    price = passengerData.ancillaries.bag.price;
    status = passengerData.ancillaries.bag.status;
    number = passengerData.ancillaries.bag.ancillaryNumber || '';
    icon = <LuggageIcon sx={{ fontSize: 18 }} />;
    color = '#D4B483';
    borderColor = status === 'Paid' ? '#C1666B' : (isSelected ? '#D4B483' : '#E4DFDA');
    bgColor = status === 'Paid' ? '#E4DFDA' : (isSelected ? '#E4DFDA' : 'white');
  } else if (itemType === 'secondBag') {
    title = 'Second Bag (XBAS)';
    price = passengerData.ancillaries.secondBag?.price || 0;
    status = passengerData.ancillaries.secondBag?.status || 'Unpaid';
    number = passengerData.ancillaries.secondBag?.ancillaryNumber || '';
    icon = <LuggageIcon sx={{ fontSize: 18 }} />;
    color = '#D4B483';
    borderColor = status === 'Paid' ? '#C1666B' : (isSelected ? '#D4B483' : '#E4DFDA');
    bgColor = status === 'Paid' ? '#E4DFDA' : (isSelected ? '#E4DFDA' : 'white');
  } else if (itemType === 'thirdBag') {
    title = 'Third Bag (XBAT)';
    price = passengerData.ancillaries.thirdBag?.price || 0;
    status = passengerData.ancillaries.thirdBag?.status || 'Unpaid';
    number = passengerData.ancillaries.thirdBag?.ancillaryNumber || '';
    icon = <LuggageIcon sx={{ fontSize: 18 }} />;
    color = '#D4B483';
    borderColor = status === 'Paid' ? '#C1666B' : (isSelected ? '#D4B483' : '#E4DFDA');
    bgColor = status === 'Paid' ? '#E4DFDA' : (isSelected ? '#E4DFDA' : 'white');
  } else if (itemType === 'uatp') {
    title = 'UATP';
    price = passengerData.ancillaries.uatp?.price || 0;
    status = passengerData.ancillaries.uatp?.status || 'Unpaid';
    number = passengerData.ancillaries.uatp?.ancillaryNumber || '';
    icon = <CreditCardIcon sx={{ fontSize: 18 }} />;
    color = '#D4B483';
    borderColor = status === 'Paid' ? '#C1666B' : (isSelected ? '#D4B483' : '#E4DFDA');
    bgColor = status === 'Paid' ? '#E4DFDA' : (isSelected ? '#E4DFDA' : 'white');
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
          borderColor: isPaid ? '#C1666B' : (isSelected ? color : color),
          bgcolor: isPaid ? '#E4DFDA' : (isSelected ? color : `${color}.light`)
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
              color: isPaid ? '#C1666B' : color, 
              fontSize: 18 
            } 
          })}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
              {title}
            </Typography>
            {status === 'Paid' && number && (
              <Typography variant="caption" sx={{ color: '#1B358F', fontSize: '0.75rem' }}>
                {number}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          <Typography variant="caption" sx={{ 
            color: isPaid ? '#9E9E9E' : '#D4B483',
            fontWeight: 'medium',
            fontSize: '0.75rem'
          }}>
            {status}
          </Typography>
          <Typography variant="body2" sx={{ 
            fontWeight: 'bold',
            fontSize: '0.875rem',
            color: '#1B358F'
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
