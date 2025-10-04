"use client";

import { AccountBalance as AccountBalanceIcon } from "@mui/icons-material";
import { Box, Divider, Paper, Typography } from "@mui/material";

interface TotalSummaryProps {
  reservationTotal: number;
  selectedAmount: number;
}

export function TotalSummary({ reservationTotal, selectedAmount }: TotalSummaryProps) {
  return (
    <Paper sx={{ p: 3, bgcolor: '#E4DFDA', border: '2px solid', borderColor: '#1B358F' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AccountBalanceIcon sx={{ mr: 1, color: '#1B358F' }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1B358F' }}>
          Total Summary
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" sx={{ color: '#1B358F' }}>
          Reservation Total
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          ${reservationTotal.toLocaleString()}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ color: '#1B358F' }}>
          Selected Items
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1B358F' }}>
          ${selectedAmount.toLocaleString()}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Amount to Pay
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1B358F' }}>
          ${selectedAmount.toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  );
}


