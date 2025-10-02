"use client";

import { Box, TextField, Typography, Button, CircularProgress } from "@mui/material";
import { useState } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface PaymentMethodPointsFormProps {
  itemKey: string;
  paymentData?: any;
  updateMethodField: (itemKey: string, method: 'credit' | 'voucher' | 'points', field: string, value: string, voucherIndex?: number) => void;
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number };
}

export function PaymentMethodPointsForm({ itemKey, paymentData, updateMethodField, getRemainingAmount }: PaymentMethodPointsFormProps) {
  const amounts = getRemainingAmount(itemKey);
  const storedAmount = paymentData?.points?.amount;
  const fallbackAmount = amounts.remaining;
  
  const [isChecking, setIsChecking] = useState(false);
  const [memberChecked, setMemberChecked] = useState(false);
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  
  const checkMemberNumber = async () => {
    const memberNumber = paymentData?.points?.memberNumber;
    if (!memberNumber || memberNumber.length < 7 || memberNumber.length > 9) {
      alert('Please enter a valid member number (7-9 digits)');
      return;
    }
    
    setIsChecking(true);
    
    // Simulate API call to check member
    setTimeout(() => {
      // Mock response - in real app, this would be an API call
      const mockPointsBalance = 50000; // Example: 50,000 points = $1,000
      setPointsBalance(mockPointsBalance);
      setMemberChecked(true);
      setIsChecking(false);
      
      // Auto-populate points based on remaining amount
      const maxPointsForRemaining = amounts.remaining * 50; // 50 points = $1
      const pointsToUse = Math.min(mockPointsBalance, maxPointsForRemaining);
      const dollarAmount = (pointsToUse / 50).toFixed(2);
      
      updateMethodField(itemKey, 'points', 'pointsToUse', pointsToUse.toString());
      updateMethodField(itemKey, 'points', 'amount', dollarAmount);
      updateMethodField(itemKey, 'points', 'balance', mockPointsBalance.toString());
    }, 1000);
  };

  return (
    <Box sx={{ mt: 2, p: 3, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
      <Typography variant="subtitle2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}>
        Points Details
      </Typography>
      
      {/* Payment Amount */}
      <Box sx={{ mb: 2.5 }}>
        <TextField 
          fullWidth
          size="medium" 
          sx={{ 
            '& .MuiInputBase-root': { height: 48 }, 
            '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
            '& .MuiInputLabel-root': { fontSize: '0.9rem' }
          }} 
          label="Payment Amount ($)" 
          placeholder="$0.00"
          InputLabelProps={{ shrink: true }}
          type="number" 
          value={(storedAmount === '' || storedAmount == null) ? fallbackAmount : (typeof storedAmount === 'string' ? parseFloat(storedAmount) || 0 : storedAmount)} 
          inputProps={{ suppressHydrationWarning: true }} 
          onChange={(e) => {
            const dollarAmount = parseFloat(e.target.value) || 0;
            if (dollarAmount <= amounts.remaining) {
              const pointsToUse = Math.round(dollarAmount * 50); // 50 points = $1
              updateMethodField(itemKey, 'points', 'amount', e.target.value);
              updateMethodField(itemKey, 'points', 'pointsToUse', pointsToUse.toString());
            }
          }} 
        />
      </Box>
      
      {/* Points to Use */}
      <Box sx={{ mb: 2.5 }}>
        <TextField 
          fullWidth
          size="medium" 
          sx={{ 
            '& .MuiInputBase-root': { height: 48 }, 
            '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
            '& .MuiInputLabel-root': { fontSize: '0.9rem' }
          }} 
          label="Points to Use" 
          placeholder="0"
          InputLabelProps={{ shrink: true }}
          type="number" 
          value={(paymentData?.points?.pointsToUse ?? '')} 
          inputProps={{ suppressHydrationWarning: true }} 
          onChange={(e) => {
            const pointsToUse = parseInt(e.target.value) || 0;
            const dollarAmount = (pointsToUse / 50).toFixed(2); // 50 points = $1
            updateMethodField(itemKey, 'points', 'pointsToUse', e.target.value);
            updateMethodField(itemKey, 'points', 'amount', dollarAmount);
          }} 
        />
      </Box>

      {/* Member Number */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField 
            fullWidth
            size="medium" 
            sx={{ 
              '& .MuiInputBase-root': { height: 48 }, 
              '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
              '& .MuiInputLabel-root': { fontSize: '0.9rem' }
            }} 
            label="Member Number" 
            placeholder="123456789"
            InputLabelProps={{ shrink: true }}
            value={(paymentData?.points?.memberNumber ?? '')} 
            inputProps={{ 
              suppressHydrationWarning: true,
              maxLength: 9,
              inputMode: 'numeric'
            }} 
            onChange={(e) => {
              updateMethodField(itemKey, 'points', 'memberNumber', e.target.value.replace(/\D/g, ''));
              setMemberChecked(false); // Reset check status when number changes
            }} 
          />
          <Button
            variant="contained"
            color={memberChecked ? "success" : "primary"}
            onClick={checkMemberNumber}
            disabled={isChecking || !paymentData?.points?.memberNumber || paymentData.points.memberNumber.length < 7 || paymentData.points.memberNumber.length > 9}
            sx={{ 
              height: 48,
              minWidth: 100,
              whiteSpace: 'nowrap'
            }}
            startIcon={isChecking ? <CircularProgress size={20} color="inherit" /> : memberChecked ? <CheckCircleIcon /> : null}
          >
            {isChecking ? 'Checking...' : memberChecked ? 'Checked' : 'Check'}
          </Button>
        </Box>
        {memberChecked && pointsBalance !== null && (
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'success.main', fontWeight: 'bold' }}>
            Available Points: {pointsBalance.toLocaleString()} (${(pointsBalance / 50).toLocaleString()})
          </Typography>
        )}
      </Box>

      {/* Award Reference */}
      <Box sx={{ mb: 2.5 }}>
        <TextField 
          fullWidth
          size="medium" 
          sx={{ 
            '& .MuiInputBase-root': { height: 48 }, 
            '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
            '& .MuiInputLabel-root': { fontSize: '0.9rem' }
          }} 
          label="Award Reference" 
          placeholder="A123456"
          InputLabelProps={{ shrink: true }}
          value={(paymentData?.points?.awardReference ?? '')} 
          inputProps={{ 
            suppressHydrationWarning: true,
            maxLength: 7
          }} 
          onChange={(e) => {
            let value = e.target.value.toUpperCase().replace(/[^A0-9]/g, '');
            if (value.length > 0 && !value.startsWith('A')) {
              value = 'A' + value.replace(/A/g, '');
            }
            if (value.length > 7) {
              value = value.substring(0, 7);
            }
            updateMethodField(itemKey, 'points', 'awardReference', value);
          }} 
        />
      </Box>
    </Box>
  );
}


