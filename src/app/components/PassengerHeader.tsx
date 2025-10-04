"use client";

import React from 'react';
import { Box, Button, TextField } from '@mui/material';

type PassengerHeaderProps = {
  reservationCode: string;
  onChangeReservationCode: (value: string) => void;
  onLoad: () => void;
  loadDisabled?: boolean;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
};

export const PassengerHeader: React.FC<PassengerHeaderProps> = ({
  reservationCode,
  onChangeReservationCode,
  onLoad,
  loadDisabled = false,
  onToggleSelectAll,
  isAllSelected
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <TextField
          size="small"
          label="Reservation Number"
          placeholder="Enter reservation code"
          value={reservationCode}
          onChange={(e) => {
            onChangeReservationCode(e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200 }}
          autoComplete="off"
        />
        <Button
          variant="contained"
          size="small"
          onClick={onLoad}
          disabled={loadDisabled}
        >
          Load
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={onToggleSelectAll}
          sx={{
            borderColor: '#1B358F',
            color: '#1B358F',
            minWidth: 'auto',
            px: 0.75,
            py: 0.25,
            fontSize: '0.7rem',
            lineHeight: 1.2,
            '&:hover': {
              borderColor: '#0f1f5f',
              bgcolor: 'primary.50'
            }
          }}
        >
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </Button>
      </Box>
  );
};



