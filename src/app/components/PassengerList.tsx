"use client";

import { Box, Paper, Typography } from "@mui/material";
import type { Reservation } from "@/types/reservation";
import { PassengerCard } from "./PassengerCard";
import { PassengerItemRow } from "./PassengerItemRow";

type Passenger = { id: string; fullName: string; hasUnpaidItems: boolean };

interface PassengerListProps {
  availablePassengers: Passenger[];
  reservation: Reservation;
  expandedPassengers: string[];
  selectedItems: { [key: string]: string[] };
  togglePassenger: (passengerId: string) => void;
  toggleAllItemsForPassenger: (passengerId: string) => void;
  isItemSelected: (passengerId: string, item: 'ticket' | 'seat' | 'bag') => boolean;
  toggleItem: (passengerId: string, item: 'ticket' | 'seat' | 'bag') => void;
  toggleExpanded: (passengerId: string) => void;
}

export function PassengerList({
  availablePassengers,
  reservation,
  expandedPassengers,
  selectedItems,
  togglePassenger,
  toggleAllItemsForPassenger,
  isItemSelected,
  toggleItem,
  toggleExpanded,
}: PassengerListProps) {
  const countSelectedPassengers = Object.values(selectedItems).filter((items) => items && items.length > 0).length;

  return (
    <>
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
        {availablePassengers.map((passenger) => {
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

          const passengerIndex = resolvePassengerIndex(passenger.id);
          const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
          if (!passengerData) return null;
          const isExpanded = expandedPassengers.includes(passenger.id);

          return (
            <PassengerCard
              key={passenger.id}
              passenger={passenger}
              passengerData={passengerData}
              isExpanded={isExpanded}
              isItemSelected={isItemSelected}
              togglePassenger={togglePassenger}
              toggleAllItemsForPassenger={toggleAllItemsForPassenger}
              toggleItem={toggleItem}
              toggleExpanded={toggleExpanded}
            >
              {isExpanded && (
                <Box sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                  <PassengerItemRow
                    itemType="ticket"
                    passengerData={passengerData}
                    isSelected={isItemSelected(passenger.id, 'ticket')}
                    onToggle={() => toggleItem(passenger.id, 'ticket')}
                  />

                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Ancillaries:
                  </Typography>

                  <PassengerItemRow
                    itemType="seat"
                    passengerData={passengerData}
                    isSelected={isItemSelected(passenger.id, 'seat')}
                    onToggle={() => toggleItem(passenger.id, 'seat')}
                  />

                  <PassengerItemRow
                    itemType="bag"
                    passengerData={passengerData}
                    isSelected={isItemSelected(passenger.id, 'bag')}
                    onToggle={() => toggleItem(passenger.id, 'bag')}
                  />
                </Box>
              )}
            </PassengerCard>
          );
        })}
      </Box>

      <Paper sx={{ p: 2, bgcolor: 'grey.100', m: 2, mt: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {countSelectedPassengers} passengers selected
        </Typography>
      </Paper>
    </>
  );
}


