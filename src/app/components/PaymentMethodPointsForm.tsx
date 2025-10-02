"use client";

import { Box, TextField, Typography } from "@mui/material";

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
          value={(storedAmount === '' || storedAmount == null) ? fallbackAmount : storedAmount} 
          inputProps={{ suppressHydrationWarning: true }} 
          onChange={(e) => {
            const dollarAmount = parseFloat(e.target.value) || 0;
            const pointsToUse = Math.round(dollarAmount * 50); // 50 points = $1
            updateMethodField(itemKey, 'points', 'amount', e.target.value);
            updateMethodField(itemKey, 'points', 'pointsToUse', pointsToUse.toString());
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
          onChange={(e) => updateMethodField(itemKey, 'points', 'memberNumber', e.target.value.replace(/\D/g, ''))} 
        />
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


