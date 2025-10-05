"use client";

import { Box, TextField, Typography, Button } from "@mui/material";
import { useState, useEffect } from "react";

interface PaymentMethodVoucherFormProps {
  itemKey: string;
  index: number;
  paymentData?: any;
  updateMethodField: (itemKey: string, method: 'credit' | 'voucher' | 'points', field: string, value: string, voucherIndex?: number) => void;
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number };
  getOriginalItemPrice: (itemKey: string) => number;
  getTotalPaidAmountWrapper: (itemKey: string) => number;
  setItemExpandedMethod?: (updater: (prev: { [key: string]: number | null }) => { [key: string]: number | null }) => void;
}

export function PaymentMethodVoucherForm({ itemKey, index, paymentData, updateMethodField, getRemainingAmount, getOriginalItemPrice, getTotalPaidAmountWrapper, setItemExpandedMethod }: PaymentMethodVoucherFormProps) {
  const amounts = getRemainingAmount(itemKey);
  const voucherIndex = index;
  const storedAmount = paymentData?.vouchers?.[voucherIndex]?.amount;
  const fallbackAmount = amounts.remaining;
  const originalPrice = getOriginalItemPrice(itemKey);
  const currentVoucherNumber = paymentData?.vouchers?.[voucherIndex]?.voucherNumber ?? '';
  
  const [isSaved, setIsSaved] = useState(false);
  const [localAmount, setLocalAmount] = useState((storedAmount || fallbackAmount).toFixed(2));

  // Update local amount when stored amount changes (after save)
  useEffect(() => {
    if (storedAmount !== undefined && storedAmount !== null && storedAmount !== '') {
      setLocalAmount(storedAmount.toFixed(2));
    }
  }, [storedAmount]);

  return (
    <Box sx={{ mt: 2, p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: '#E4DFDA' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: '#1B358F', fontWeight: 600 }}>
          UATP Voucher Details #{index + 1}
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            setIsSaved(true);
            // Apply validation and capping immediately when saving
            const inputValue = localAmount;
            // Handle empty input
            if (inputValue === '' || inputValue === null || inputValue === undefined) {
              setLocalAmount('1.00');
              updateMethodField(itemKey, 'voucher', 'amount', '1', voucherIndex);
              return;
            }
            
            const value = parseFloat(inputValue);
            // Handle invalid input (NaN)
            if (isNaN(value)) {
              setLocalAmount('1.00');
              updateMethodField(itemKey, 'voucher', 'amount', '1', voucherIndex);
              return;
            }
            
            // Don't allow negative values, and always cap at remaining amount
            // If value is 0, set it to 1 dollar minimum
            const minValue = value <= 0 ? 1 : Math.max(0.01, value);
            
            // Calculate remaining amount WITHOUT the current payment method
            // We need to exclude the current voucher amount from the calculation
            const currentPaidAmount = getTotalPaidAmountWrapper(itemKey);
            
            // Subtract the current voucher amount to get the amount paid by OTHER methods
            const currentVoucherAmount = parseFloat(storedAmount || '0') || 0;
            const otherMethodsPaid = currentPaidAmount - currentVoucherAmount;
            
            const currentRemaining = Math.max(0, originalPrice - otherMethodsPaid);
            
            // Always cap at current remaining amount, but ensure minimum is 1 if remaining is 0
            const cappedValue = currentRemaining > 0 ? Math.min(minValue, currentRemaining) : (originalPrice > 0 ? Math.min(minValue, originalPrice) : 1);
            
            setLocalAmount(cappedValue.toFixed(2));
            updateMethodField(itemKey, 'voucher', 'amount', cappedValue.toString(), voucherIndex);
            
            // Collapse the form after saving
            if (setItemExpandedMethod) {
              setItemExpandedMethod(prev => ({
                ...prev,
                [itemKey]: null
              }));
            }
          }}
          sx={{
            bgcolor: '#D4B483',
            '&:hover': { bgcolor: '#c19f5f' },
            fontSize: '0.75rem',
            px: 2,
            py: 0.5
          }}
        >
          Save
        </Button>
      </Box>
      
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
            value={localAmount}
          inputProps={{ suppressHydrationWarning: true }} 
          onChange={(e) => {
            const inputValue = e.target.value;
            // Only update local state during typing, don't update the main state
            setLocalAmount(inputValue);
          }}
            onBlur={(e) => {
            }}
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
          placeholder="1114-12345678901"
          InputLabelProps={{ shrink: true }}
          value={(paymentData?.vouchers?.[voucherIndex]?.voucherNumber ?? '')} 
          inputProps={{ 
            suppressHydrationWarning: true,
            maxLength: 16
          }} 
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            const previousValue = currentVoucherNumber.replace(/\D/g, '');
            
            // Only add 1114 prefix if:
            // 1. User is typing (value is longer than previous)
            // 2. Value doesn't start with 1114
            // 3. Value is short (1-3 digits)
            if (value.length > previousValue.length && value.length > 0 && !value.startsWith('1114') && value.length <= 3) {
              value = '1114' + value;
            }
            
            // Add dash after 1114 if there are more digits
            if (value.length > 4) {
              value = value.substring(0, 4) + '-' + value.substring(4, 15); // Max 11 digits after dash
            }
            
            updateMethodField(itemKey, 'voucher', 'voucherNumber', value, voucherIndex);
          }} 
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
          placeholder="MM/YY"
          InputLabelProps={{ shrink: true }}
          value={(paymentData?.vouchers?.[voucherIndex]?.expiryDate ?? '')} 
          inputProps={{ 
            suppressHydrationWarning: true,
            maxLength: 5
          }} 
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length >= 2) {
              value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            updateMethodField(itemKey, 'voucher', 'expiryDate', value, voucherIndex);
          }} 
        />
      </Box>
    </Box>
  );
}


