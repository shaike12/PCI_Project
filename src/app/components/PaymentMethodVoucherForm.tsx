"use client";

import { Box, TextField, Typography } from "@mui/material";

interface PaymentMethodVoucherFormProps {
  itemKey: string;
  index: number;
  paymentData?: any;
  updateMethodField: (itemKey: string, method: 'credit' | 'voucher' | 'points', field: string, value: string, voucherIndex?: number) => void;
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number };
}

export function PaymentMethodVoucherForm({ itemKey, index, paymentData, updateMethodField, getRemainingAmount }: PaymentMethodVoucherFormProps) {
  const amounts = getRemainingAmount(itemKey);
  const voucherIndex = index;
  const storedAmount = paymentData?.vouchers?.[voucherIndex]?.amount;
  const fallbackAmount = amounts.remaining;

  return (
    <Box sx={{ mt: 2, p: 3, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
      <Typography variant="subtitle2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}>
        Voucher Details #{index + 1}
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
          onChange={(e) => updateMethodField(itemKey, 'voucher', 'amount', e.target.value, voucherIndex)} 
        />
      </Box>
      
      {/* Voucher Number */}
      <Box sx={{ mb: 2.5 }}>
        <TextField 
          fullWidth
          size="medium" 
          sx={{ 
            '& .MuiInputBase-root': { height: 48 }, 
            '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
            '& .MuiInputLabel-root': { fontSize: '0.9rem' }
          }} 
          label="Voucher Number" 
          placeholder="VCH-123456"
          InputLabelProps={{ shrink: true }}
          value={(paymentData?.vouchers?.[voucherIndex]?.voucherNumber ?? '')} 
          inputProps={{ 
            suppressHydrationWarning: true,
            maxLength: 20
          }} 
          onChange={(e) => updateMethodField(itemKey, 'voucher', 'voucherNumber', e.target.value, voucherIndex)} 
        />
      </Box>

      {/* Expiry Date */}
      <Box sx={{ mb: 2.5 }}>
        <TextField 
          fullWidth
          size="medium" 
          sx={{ 
            '& .MuiInputBase-root': { height: 48 }, 
            '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
            '& .MuiInputLabel-root': { fontSize: '0.9rem' }
          }} 
          label="Expiry Date" 
          placeholder="2026-12-31"
          InputLabelProps={{ shrink: true }}
          type="date"
          value={(paymentData?.vouchers?.[voucherIndex]?.expiryDate ?? '')} 
          inputProps={{ 
            suppressHydrationWarning: true
          }} 
          onChange={(e) => updateMethodField(itemKey, 'voucher', 'expiryDate', e.target.value, voucherIndex)} 
        />
      </Box>
    </Box>
  );
}


