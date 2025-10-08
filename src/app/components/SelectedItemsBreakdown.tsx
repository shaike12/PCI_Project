"use client";

import { Accordion, AccordionDetails, AccordionSummary, Badge, Box, List, ListItem, ListItemIcon, ListItemText, Typography, Tooltip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FlightIcon from "@mui/icons-material/Flight";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import LuggageIcon from "@mui/icons-material/Luggage";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import InfoIcon from "@mui/icons-material/Info";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import StarIcon from "@mui/icons-material/Star";
import type { Reservation } from "@/types/reservation";

interface SelectedItemsBreakdownProps {
  selectedItems: { [passengerId: string]: string[] };
  reservation: Reservation;
  itemPaymentMethods?: { [itemKey: string]: any };
}

export function SelectedItemsBreakdown({ selectedItems, reservation, itemPaymentMethods = {} }: SelectedItemsBreakdownProps) {
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
  let selectedSecondBags = 0;
  let selectedThirdBags = 0;
  let selectedUatp = 0;
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
          if (passengerData.ancillaries.seat && passengerData.ancillaries.seat.status !== 'Paid') {
            selectedSeats += passengerData.ancillaries.seat.price || 0;
            totalSelected += passengerData.ancillaries.seat.price || 0;
          } else if (passengerData.ancillaries.seat) {
            totalPaid += passengerData.ancillaries.seat.price || 0;
          }
          break;
        case 'bag':
          if (passengerData.ancillaries.bag && passengerData.ancillaries.bag.status !== 'Paid') {
            selectedBags += passengerData.ancillaries.bag.price || 0;
            totalSelected += passengerData.ancillaries.bag.price || 0;
          } else if (passengerData.ancillaries.bag) {
            totalPaid += passengerData.ancillaries.bag.price || 0;
          }
          break;
        case 'secondBag':
          if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status !== 'Paid') {
            selectedSecondBags += passengerData.ancillaries.secondBag.price || 0;
            totalSelected += passengerData.ancillaries.secondBag.price || 0;
          } else if (passengerData.ancillaries.secondBag) {
            totalPaid += passengerData.ancillaries.secondBag.price || 0;
          }
          break;
        case 'thirdBag':
          if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status !== 'Paid') {
            selectedThirdBags += passengerData.ancillaries.thirdBag.price || 0;
            totalSelected += passengerData.ancillaries.thirdBag.price || 0;
          } else if (passengerData.ancillaries.thirdBag) {
            totalPaid += passengerData.ancillaries.thirdBag.price || 0;
          }
          break;
        case 'uatp':
          if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status !== 'Paid') {
            selectedUatp += passengerData.ancillaries.uatp.price || 0;
            totalSelected += passengerData.ancillaries.uatp.price || 0;
          } else if (passengerData.ancillaries.uatp) {
            totalPaid += passengerData.ancillaries.uatp.price || 0;
          }
          break;
      }
    });
  });

  totalRemaining = totalSelected;

  // Helper function to get payment method icons for an item
  const getPaymentMethodIcons = (passengerId: string, itemType: string) => {
    const itemKey = `${passengerId}-${itemType}`;
    const methods = itemPaymentMethods[itemKey];
    if (!methods) return null;

    const icons = [];
    if (methods.credit) {
      icons.push(
        <Tooltip key="credit" title={`Credit Card: $${methods.credit.amount?.toLocaleString() || 0}`} arrow>
          <CreditCardIcon sx={{ fontSize: 14, color: '#1B358F', mr: 0.5, cursor: 'help' }} />
        </Tooltip>
      );
    }
    if (methods.vouchers && methods.vouchers.length > 0) {
      const totalVoucherAmount = methods.vouchers.reduce((sum: number, voucher: any) => sum + (voucher.amount || 0), 0);
      icons.push(
        <Tooltip key="voucher" title={`Voucher: $${totalVoucherAmount.toLocaleString()}`} arrow>
          <CardGiftcardIcon sx={{ fontSize: 14, color: '#48A9A6', mr: 0.5, cursor: 'help' }} />
        </Tooltip>
      );
    }
    if (methods.points) {
      icons.push(
        <Tooltip key="points" title={`Points: $${methods.points.amount?.toLocaleString() || 0}`} arrow>
          <StarIcon sx={{ fontSize: 14, color: '#D4B483', mr: 0.5, cursor: 'help' }} />
        </Tooltip>
      );
    }
    return icons.length > 0 ? <Box sx={{ display: 'flex', alignItems: 'center' }}>{icons}</Box> : null;
  };

  return (
    <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <ShoppingCartIcon sx={{ color: '#1B358F' }} />
            {Object.values(selectedItems).flat().length > 0 && (
              <Typography variant="caption" sx={{ 
                ml: 0.5, 
                color: '#1B358F', 
                fontWeight: 'bold',
                backgroundColor: '#E4DFDA',
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
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1B358F' }}>
            ${totalSelected.toLocaleString()}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <List dense>
          {selectedTickets > 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <FlightIcon sx={{ color: '#1B358F' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Flight Tickets" 
                secondary={
                  <Box>
                    {Object.entries(selectedItems)
                      .filter(([_, items]) => items.includes('ticket'))
                      .map(([passengerId, _]) => {
                        const passengerIndex = resolvePassengerIndex(passengerId);
                        const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
                        const price = passengerData?.ticket?.price || 0;
                        return (
                          <Box key={passengerId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <Typography variant="caption" sx={{ color: '#666', mr: 1 }}>
                                {passengerData?.name || `Passenger ${passengerId}`}
                              </Typography>
                              {getPaymentMethodIcons(passengerId, 'ticket')}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#1B358F' }}>
                              ${price.toLocaleString()}
                            </Typography>
                          </Box>
                        );
                      })}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderTop: '1px solid #E0E0E0', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        Total
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        ${selectedTickets.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          )}
          
          {selectedSeats > 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <EventSeatIcon sx={{ color: '#48A9A6' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Seat" 
                secondary={
                  <Box>
                    {Object.entries(selectedItems)
                      .filter(([_, items]) => items.includes('seat'))
                      .map(([passengerId, _]) => {
                        const passengerIndex = resolvePassengerIndex(passengerId);
                        const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
                        const price = passengerData?.ancillaries?.seat?.price || 0;
                        return (
                          <Box key={passengerId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <Typography variant="caption" sx={{ color: '#666', mr: 1 }}>
                                {passengerData?.name || `Passenger ${passengerId}`}
                              </Typography>
                              {getPaymentMethodIcons(passengerId, 'seat')}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#1B358F' }}>
                              ${price.toLocaleString()}
                            </Typography>
                          </Box>
                        );
                      })}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderTop: '1px solid #E0E0E0', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        Total
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        ${selectedSeats.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          )}
          
          {selectedBags > 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LuggageIcon sx={{ color: '#48A9A6' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Baggage (XBAF)" 
                secondary={
                  <Box>
                    {Object.entries(selectedItems)
                      .filter(([_, items]) => items.includes('bag'))
                      .map(([passengerId, _]) => {
                        const passengerIndex = resolvePassengerIndex(passengerId);
                        const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
                        const price = passengerData?.ancillaries?.bag?.price || 0;
                        return (
                          <Box key={passengerId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <Typography variant="caption" sx={{ color: '#666', mr: 1 }}>
                                {passengerData?.name || `Passenger ${passengerId}`}
                              </Typography>
                              {getPaymentMethodIcons(passengerId, 'bag')}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#1B358F' }}>
                              ${price.toLocaleString()}
                            </Typography>
                          </Box>
                        );
                      })}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderTop: '1px solid #E0E0E0', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        Total
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        ${selectedBags.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          )}
          
          {selectedSecondBags > 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LuggageIcon sx={{ color: '#D4B483' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Second Bag (XBAS)" 
                secondary={
                  <Box>
                    {Object.entries(selectedItems)
                      .filter(([_, items]) => items.includes('secondBag'))
                      .map(([passengerId, _]) => {
                        const passengerIndex = resolvePassengerIndex(passengerId);
                        const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
                        const price = passengerData?.ancillaries?.secondBag?.price || 0;
                        return (
                          <Box key={passengerId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <Typography variant="caption" sx={{ color: '#666', mr: 1 }}>
                                {passengerData?.name || `Passenger ${passengerId}`}
                              </Typography>
                              {getPaymentMethodIcons(passengerId, 'secondBag')}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#1B358F' }}>
                              ${price.toLocaleString()}
                            </Typography>
                          </Box>
                        );
                      })}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderTop: '1px solid #E0E0E0', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        Total
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        ${selectedSecondBags.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          )}
          
          {selectedThirdBags > 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LuggageIcon sx={{ color: '#D4B483' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Third Bag (XBAT)" 
                secondary={
                  <Box>
                    {Object.entries(selectedItems)
                      .filter(([_, items]) => items.includes('thirdBag'))
                      .map(([passengerId, _]) => {
                        const passengerIndex = resolvePassengerIndex(passengerId);
                        const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
                        const price = passengerData?.ancillaries?.thirdBag?.price || 0;
                        return (
                          <Box key={passengerId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <Typography variant="caption" sx={{ color: '#666', mr: 1 }}>
                                {passengerData?.name || `Passenger ${passengerId}`}
                              </Typography>
                              {getPaymentMethodIcons(passengerId, 'thirdBag')}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#1B358F' }}>
                              ${price.toLocaleString()}
                            </Typography>
                          </Box>
                        );
                      })}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderTop: '1px solid #E0E0E0', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        Total
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        ${selectedThirdBags.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          )}
          
          {selectedUatp > 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CreditCardIcon sx={{ color: '#48A9A6' }} />
              </ListItemIcon>
              <ListItemText 
                primary="UATP" 
                secondary={
                  <Box>
                    {Object.entries(selectedItems)
                      .filter(([_, items]) => items.includes('uatp'))
                      .map(([passengerId, _]) => {
                        const passengerIndex = resolvePassengerIndex(passengerId);
                        const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
                        const price = passengerData?.ancillaries?.uatp?.price || 0;
                        return (
                          <Box key={passengerId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <Typography variant="caption" sx={{ color: '#666', mr: 1 }}>
                                {passengerData?.name || `Passenger ${passengerId}`}
                              </Typography>
                              {getPaymentMethodIcons(passengerId, 'uatp')}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#1B358F' }}>
                              ${price.toLocaleString()}
                            </Typography>
                          </Box>
                        );
                      })}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderTop: '1px solid #E0E0E0', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        Total
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1B358F' }}>
                        ${selectedUatp.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
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
