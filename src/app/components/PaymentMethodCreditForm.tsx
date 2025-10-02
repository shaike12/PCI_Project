"use client";

import { Box, TextField, Typography } from "@mui/material";

interface PaymentMethodCreditFormProps {
  itemKey: string;
  paymentData?: any;
  updateMethodField: (itemKey: string, method: 'credit' | 'voucher' | 'points', field: string, value: string, voucherIndex?: number) => void;
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number };
}

export function PaymentMethodCreditForm({ itemKey, paymentData, updateMethodField, getRemainingAmount }: PaymentMethodCreditFormProps) {
  const amounts = getRemainingAmount(itemKey);
  const storedAmount = paymentData?.credit?.amount;
  const fallbackAmount = amounts.remaining;

  return (
    <Box sx={{ mt: 2, p: 3, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
      <Typography variant="subtitle2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}>
        Credit Card Details
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
          label="Payment Amount" 
          placeholder="$0.00"
          InputLabelProps={{ shrink: true }}
          type="number" 
          value={(storedAmount === '' || storedAmount == null) ? fallbackAmount : (typeof storedAmount === 'string' ? parseFloat(storedAmount) || 0 : storedAmount)} 
          inputProps={{ suppressHydrationWarning: true }} 
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            if (value <= amounts.remaining) {
              updateMethodField(itemKey, 'credit', 'amount', e.target.value);
            }
          }} 
        />
      </Box>
      
      {/* Card Number */}
      <Box sx={{ mb: 2.5 }}>
        <TextField 
          fullWidth
          size="medium" 
          sx={{ 
            '& .MuiInputBase-root': { height: 48 }, 
            '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
            '& .MuiInputLabel-root': { fontSize: '0.9rem' }
          }} 
          label="Card Number" 
          placeholder="1234 5678 9012 3456"
          InputLabelProps={{ shrink: true }}
          value={(paymentData?.credit?.cardNumber ?? '')} 
          inputProps={{ 
            suppressHydrationWarning: true,
            maxLength: 19,
            inputMode: 'numeric'
          }} 
          onChange={(e) => {
            const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
            updateMethodField(itemKey, 'credit', 'cardNumber', formatted);
          }} 
        />
      </Box>

      {/* Cardholder Name */}
      <Box sx={{ mb: 2.5 }}>
        <TextField 
          fullWidth
          size="medium" 
          sx={{ 
            '& .MuiInputBase-root': { height: 48 }, 
            '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
            '& .MuiInputLabel-root': { fontSize: '0.9rem' }
          }} 
          label="Cardholder Name" 
          placeholder="Full name as on card"
          InputLabelProps={{ shrink: true }}
          value={(paymentData?.credit?.holderName ?? '')} 
          inputProps={{ suppressHydrationWarning: true }} 
          onChange={(e) => updateMethodField(itemKey, 'credit', 'holderName', e.target.value)} 
        />
      </Box>

      {/* Expiry and CVV */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField 
          size="medium" 
          sx={{ 
            flex: 1,
            '& .MuiInputBase-root': { height: 48 }, 
            '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
            '& .MuiInputLabel-root': { fontSize: '0.9rem' }
          }} 
          label="Expiry Date" 
          placeholder="MM/YY"
          InputLabelProps={{ shrink: true }}
          value={(paymentData?.credit?.expiryDate ?? '')} 
          inputProps={{ 
            suppressHydrationWarning: true,
            maxLength: 5,
            inputMode: 'numeric'
          }} 
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
              value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            updateMethodField(itemKey, 'credit', 'expiryDate', value);
          }} 
        />
        <TextField 
          size="medium" 
          sx={{ 
            flex: 1,
            '& .MuiInputBase-root': { height: 48 }, 
            '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
            '& .MuiInputLabel-root': { fontSize: '0.9rem' }
          }} 
          label="CVV" 
          placeholder="123"
          InputLabelProps={{ shrink: true }}
          value={(paymentData?.credit?.cvv ?? '')} 
          inputProps={{ 
            suppressHydrationWarning: true,
            maxLength: 4,
            inputMode: 'numeric'
          }} 
          onChange={(e) => updateMethodField(itemKey, 'credit', 'cvv', e.target.value.replace(/\D/g, ''))} 
        />
      </Box>
    </Box>
  );
}


