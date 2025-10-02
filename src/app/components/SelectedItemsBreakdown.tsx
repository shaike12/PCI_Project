"use client";

import { Accordion, AccordionDetails, AccordionSummary, Badge, Box, List, ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FlightIcon from "@mui/icons-material/Flight";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import LuggageIcon from "@mui/icons-material/Luggage";
import InfoIcon from "@mui/icons-material/Info";
import type { Reservation } from "@/types/reservation";

interface SelectedItemsBreakdownProps {
  selectedItems: { [passengerId: string]: string[] };
  reservation: Reservation;
}

export function SelectedItemsBreakdown({ selectedItems, reservation }: SelectedItemsBreakdownProps) {
  // Safely resolve a passenger index from an id like "1", "p1", "passenger-2" etc.
  const resolvePassengerIndex = (passengerId: string): number => {
    if (!passengerId) return -1;
    if (/^\d+$/.test(passengerId)) {
      const idx = Number(passengerId) - 1;
      return reservation.passengers[idx] ? idx : -1;
    }
    const match = passengerId.match(/\d+/);
    if (match) {
      const idx = Number(match[0]) - 1;
      return reservation.passengers[idx] ? idx : -1;
    }
    return -1;
  };

  let selectedTickets = 0;
  let selectedSeats = 0;
  let selectedBags = 0;
  let totalSelected = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  Object.entries(selectedItems).forEach(([passengerId, items]) => {
    const passengerIndex = resolvePassengerIndex(passengerId);
    const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    if (!passengerData) return;
    
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
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <ShoppingCartIcon sx={{ color: 'primary.main' }} />
            {Object.values(selectedItems).flat().length > 0 && (
              <Typography variant="caption" sx={{ 
                ml: 0.5, 
                color: 'primary.main', 
                fontWeight: 'bold',
                backgroundColor: 'primary.light',
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem'
              }}>
                {Object.values(selectedItems).flat().length}
              </Typography>
            )}
          </Box>
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
                <EventSeatIcon color="secondary" />
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
                <LuggageIcon color="success" />
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
}
