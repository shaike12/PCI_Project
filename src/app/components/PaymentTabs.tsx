"use client";

import { Box, Paper, Tabs, Tab, Typography, IconButton, Slider } from "@mui/material";
import type { ReactNode } from "react";
import FlightIcon from "@mui/icons-material/Flight";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import LuggageIcon from "@mui/icons-material/Luggage";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import StarIcon from "@mui/icons-material/Star";
import type { Reservation } from "@/types/reservation";
import { ItemDetails } from "./ItemDetails";

interface PaymentTabsProps {
  selectedItems: { [passengerId: string]: string[] };
  activePaymentPassenger: string | null;
  setActivePaymentPassenger: (pid: string) => void;
  reservation: Reservation;

  itemMethodForms: { [itemKey: string]: ("credit" | "voucher" | "points")[] };
  itemPaymentMethods: any;
  itemExpandedMethod: { [key: string]: number | null };

  getPassengerTabLabel: (pid: string) => ReactNode;
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number };
  isItemFullyPaid: (itemKey: string) => boolean;
  confirmAddMethod: (itemKey: string, method: "credit" | "voucher" | "points") => void;
  isPaymentMethodComplete: (itemKey: string, method: "credit" | "voucher" | "points", voucherIndex: number) => boolean;
  updateMethodField: (itemKey: string, method: "credit" | "voucher" | "points", field: string, value: string, voucherIndex?: number) => void;
  setItemExpandedMethod: (updater: (prev: { [key: string]: number | null }) => { [key: string]: number | null }) => void;
  removeMethod: (itemKey: string, formIndex: number) => void;
}

export function PaymentTabs(props: PaymentTabsProps) {
  const {
    selectedItems,
    activePaymentPassenger,
    setActivePaymentPassenger,
    reservation,
    itemMethodForms,
    itemPaymentMethods,
    itemExpandedMethod,
    getPassengerTabLabel,
    getRemainingAmount,
    isItemFullyPaid,
    confirmAddMethod,
    isPaymentMethodComplete,
    updateMethodField,
    setItemExpandedMethod,
    removeMethod,
  } = props;

  // Safely resolve a passenger index
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

  const tabIds = Object.entries(selectedItems)
    .filter(([pid, items]) => {
      if (!items || items.length === 0) return false;
      const idx = resolvePassengerIndex(pid);
      const p = idx >= 0 ? reservation.passengers[idx] : undefined;
      if (!p) return false;
      const hasUnpaid = p.ticket.status !== 'Paid' || p.ancillaries.seat.status !== 'Paid' || p.ancillaries.bag.status !== 'Paid';
      return hasUnpaid;
    })
    .map(([pid]) => pid);

  const tabsValue = tabIds.includes(activePaymentPassenger || '') ? (activePaymentPassenger as string) : (tabIds[0] ?? false);

  if (Object.values(selectedItems).flat().length === 0) return null;

  return (
    <Box sx={{ mb: 2, minHeight: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Tabs
        value={tabsValue}
        onChange={(_, v) => setActivePaymentPassenger(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {tabIds.map((pid) => {
          const passengerIndex = resolvePassengerIndex(pid);
          const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
          
          if (!passenger) return null;
          
          const unpaidItems = [];
          if (passenger.ticket.status !== 'Paid') unpaidItems.push('ticket');
          if (passenger.ancillaries.seat.status !== 'Paid') unpaidItems.push('seat');
          if (passenger.ancillaries.bag.status !== 'Paid') unpaidItems.push('bag');
          
          const getIcon = (itemType: string) => {
            switch (itemType) {
              case 'ticket': return <FlightIcon sx={{ fontSize: 16, mr: 0.5 }} />;
              case 'seat': return <EventSeatIcon sx={{ fontSize: 16, mr: 0.5 }} />;
              case 'bag': return <LuggageIcon sx={{ fontSize: 16, mr: 0.5 }} />;
              default: return null;
            }
          };
          
          // Calculate total remaining amount for this passenger
          const passengerRemaining = (selectedItems[pid] || []).reduce((total, itemType) => {
            const itemKey = `${pid}-${itemType}`;
            const amounts = getRemainingAmount(itemKey);
            return total + amounts.remaining;
          }, 0);
          
          return (
            <Tab 
              key={pid}
              value={pid}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {unpaidItems.map(itemType => getIcon(itemType))}
                    <span>{passenger.name}</span>
                  </Box>
                  {passengerRemaining > 0 ? (
                    <Typography variant="caption" sx={{ 
                      color: 'error.main', 
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                    }}>
                      ${passengerRemaining.toLocaleString()} remaining
                    </Typography>
                  ) : (
                    <Typography variant="caption" sx={{ 
                      color: 'success.main', 
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                    }}>
                      Fully paid
                    </Typography>
                  )}
                </Box>
              }
              sx={{
                transition: 'all 0.3s ease-in-out',
                '&.Mui-selected': {
                  backgroundColor: 'primary.50',
                color: 'primary.main',
                fontWeight: 600,
                borderRadius: 1,
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)'
              },
              '&:hover': {
                backgroundColor: 'grey.50',
                transform: 'translateY(-1px)'
              }
            }}
          />
          );
        })}
      </Tabs>

      {typeof tabsValue === 'string' && tabsValue !== '' && (
        <Paper sx={{ 
          p: 2, 
          mt: 2, 
          border: 1, 
          borderColor: 'grey.300', 
          bgcolor: 'white', 
          minHeight: 0, 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease-out',
          transition: 'all 0.3s ease-in-out'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, overflowY: 'auto', pr: 1 }}>
            {(selectedItems[tabsValue] || []).map((itemType) => {
              const pIndex = resolvePassengerIndex(tabsValue);
              const p = pIndex >= 0 ? reservation.passengers[pIndex] : undefined;
              if (!p) return null;
              let title = '';
              let price = 0;
              let color: any = 'primary.main';
              let icon: any = <FlightIcon sx={{ fontSize: 18, mr: 1 }} />;
              if (itemType === 'ticket') {
                title = 'Flight Ticket';
                price = p.ticket.price;
                color = 'success.main';
                icon = <FlightIcon sx={{ fontSize: 18, mr: 1 }} />;
              } else if (itemType === 'seat') {
                title = 'Seat Selection';
                price = p.ancillaries.seat.price;
                color = 'info.main';
                icon = <EventSeatIcon sx={{ fontSize: 18, mr: 1 }} />;
              } else if (itemType === 'bag') {
                title = 'Baggage';
                price = p.ancillaries.bag.price;
                color = 'warning.main';
                icon = <LuggageIcon sx={{ fontSize: 18, mr: 1 }} />;
              }

              const itemKey = `${tabsValue}-${itemType}`;
              const formMethods = itemMethodForms[itemKey] || [];
              const paymentData = itemPaymentMethods[itemKey] || {};

              return (
                <ItemDetails
                  key={itemKey}
                  itemKey={itemKey}
                  itemType={itemType}
                  title={title}
                  price={price}
                  color={color}
                  icon={icon}
                  formMethods={formMethods}
                  paymentData={paymentData}
                  itemExpandedMethod={itemExpandedMethod}
                  getRemainingAmount={getRemainingAmount}
                  isItemFullyPaid={isItemFullyPaid}
                  isPaymentMethodComplete={isPaymentMethodComplete}
                  updateMethodField={updateMethodField}
                  setItemExpandedMethod={setItemExpandedMethod}
                  removeMethod={removeMethod}
                  confirmAddMethod={confirmAddMethod}
                />
              );

            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
