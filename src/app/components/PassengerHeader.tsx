"use client";

import React from 'react';
import { Box, Button, TextField, AppBar, Toolbar, Typography } from '@mui/material';
import UserMenu from './UserMenu';

type PassengerHeaderProps = {
  reservationCode: string;
  onChangeReservationCode: (value: string) => void;
  onLoad: () => void;
  loadDisabled?: boolean;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  onSyncToCloud?: () => void;
  onSyncFromCloud?: () => void;
  onShowAuthModal?: () => void;
};

export const PassengerHeader: React.FC<PassengerHeaderProps> = ({
  reservationCode,
  onChangeReservationCode,
  onLoad,
  loadDisabled = false,
  onToggleSelectAll,
  isAllSelected,
  onSyncToCloud,
  onSyncFromCloud,
  onShowAuthModal
}) => {
  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Payment Portal
          </Typography>
          <UserMenu 
            onSyncToCloud={onSyncToCloud}
            onSyncFromCloud={onSyncFromCloud}
            onShowAuthModal={onShowAuthModal}
          />
        </Toolbar>
      </AppBar>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 2 }}>
        <TextField
          size="small"
          label="Reservation Number"
          placeholder="Enter reservation code"
          value={reservationCode}
          onChange={(e) => {
            console.log('Reservation code changed:', e.target.value);
            onChangeReservationCode(e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200 }}
          autoComplete="off"
        />
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            console.log('Load button clicked, reservation code:', reservationCode);
            onLoad();
          }}
          disabled={loadDisabled}
        >
          Load
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={onToggleSelectAll}
          sx={{
            borderColor: 'primary.main',
            color: 'primary.main',
            minWidth: 'auto',
            px: 0.75,
            py: 0.25,
            fontSize: '0.7rem',
            lineHeight: 1.2,
            '&:hover': {
              borderColor: 'primary.dark',
              bgcolor: 'primary.50'
            }
          }}
        >
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </Button>
      </Box>
    </>
  );
};



