"use client";

import { Box, TextField, Typography, InputAdornment, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import { detectCardType, formatCardNumber } from "../utils/cardValidation";
import { useState, useEffect } from "react";

interface PaymentMethodCreditFormProps {
  itemKey: string;
  paymentData?: any;
  updateMethodField: (itemKey: string, method: 'credit' | 'voucher' | 'points', field: string, value: string, voucherIndex?: number) => void;
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number };
  getOriginalItemPrice: (itemKey: string) => number;
  getTotalPaidAmountWrapper: (itemKey: string) => number;
  setItemExpandedMethod?: (updater: (prev: { [key: string]: number | null }) => { [key: string]: number | null }) => void;
}

export function PaymentMethodCreditForm({ itemKey, paymentData, updateMethodField, getRemainingAmount, getOriginalItemPrice, getTotalPaidAmountWrapper, setItemExpandedMethod }: PaymentMethodCreditFormProps) {
  const amounts = getRemainingAmount(itemKey);
  const storedAmount = paymentData?.credit?.amount;
  const fallbackAmount = amounts.remaining;
  const originalPrice = getOriginalItemPrice(itemKey);
  
  const [isSaved, setIsSaved] = useState(false);
  const [localAmount, setLocalAmount] = useState(storedAmount || fallbackAmount.toString());

  // Update local amount when stored amount changes (after save)
  useEffect(() => {
    console.log('=== CREDIT CARD useEffect TRIGGERED ===');
    console.log('- storedAmount changed to:', storedAmount);
    console.log('- current localAmount:', localAmount);
    
    if (storedAmount !== undefined && storedAmount !== null && storedAmount !== '') {
      console.log('- Setting localAmount to storedAmount:', storedAmount.toString());
      setLocalAmount(storedAmount.toString());
    } else {
      console.log('- storedAmount is empty/undefined, not updating localAmount');
    }
    
    console.log('=== useEffect COMPLETED ===');
  }, [storedAmount]);

  const renderBrandAdornment = (cardType: string) => {
    switch (cardType) {
      case 'Visa':
        return (
          <Box sx={{
            ml: 1,
            px: 1,
            height: 24,
            minWidth: 40,
            borderRadius: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#1A1F71',
            color: '#fff',
            fontWeight: 800,
            fontSize: '10px',
            letterSpacing: 1
          }}>
            VISA
          </Box>
        );
      case 'Mastercard':
        return (
          <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', height: 24 }}>
            <Box sx={{ position: 'relative', width: 36, height: 24 }}>
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: 8,
                transform: 'translateY(-50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: '#EB001B'
              }} />
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: 16,
                transform: 'translateY(-50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: '#FF5F00'
              }} />
            </Box>
          </Box>
        );
      case 'American Express':
        return (
          <Box sx={{
            ml: 1,
            px: 1,
            height: 24,
            minWidth: 46,
            borderRadius: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#006FCF',
            color: '#fff',
            fontWeight: 800,
            fontSize: '9px',
            letterSpacing: 0.5
          }}>
            AMEX
          </Box>
        );
      case 'Discover':
        return (
          <Box sx={{
            ml: 1,
            px: 1,
            height: 24,
            minWidth: 54,
            borderRadius: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#111',
            color: '#fff',
            fontWeight: 800,
            fontSize: '9px'
          }}>
            DISCOVER
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mt: 2, p: 3, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Credit Card Details
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            console.log('=== CREDIT CARD SAVE BUTTON CLICKED ===');
            console.log('BEFORE SAVE:');
            console.log('- localAmount:', localAmount);
            console.log('- storedAmount:', storedAmount);
            console.log('- fallbackAmount:', fallbackAmount);
            console.log('- originalPrice:', originalPrice);
            console.log('- isSaved:', isSaved);
            
            setIsSaved(true);
            // Apply validation and capping immediately when saving
            const inputValue = localAmount;
            console.log('- inputValue from localAmount:', inputValue);
            
            // Handle empty input
            if (inputValue === '' || inputValue === null || inputValue === undefined) {
              console.log('- Empty input detected, setting to 1');
              setLocalAmount('1');
              updateMethodField(itemKey, 'credit', 'amount', '1');
              return;
            }
            
            const value = parseFloat(inputValue);
            console.log('- parsed value:', value);
            
            // Handle invalid input (NaN)
            if (isNaN(value)) {
              console.log('- NaN input detected, setting to 1');
              setLocalAmount('1');
              updateMethodField(itemKey, 'credit', 'amount', '1');
              return;
            }
            
            // Don't allow negative values, and always cap at remaining amount
            // If value is 0, set it to 1 dollar minimum
            const minValue = value <= 0 ? 1 : Math.max(0.01, value);
            console.log('- minValue (after negative/zero check):', minValue);
            
            // Calculate remaining amount WITHOUT the current payment method
            // We need to exclude the current credit card amount from the calculation
            const currentPaidAmount = getTotalPaidAmountWrapper(itemKey);
            console.log('- currentPaidAmount from getTotalPaidAmountWrapper:', currentPaidAmount);
            
            // Subtract the current credit card amount to get the amount paid by OTHER methods
            const currentCreditAmount = parseFloat(storedAmount || '0') || 0;
            const otherMethodsPaid = currentPaidAmount - currentCreditAmount;
            console.log('- currentCreditAmount (stored):', currentCreditAmount);
            console.log('- otherMethodsPaid (excluding current credit):', otherMethodsPaid);
            
            const currentRemaining = Math.max(0, originalPrice - otherMethodsPaid);
            console.log('- currentRemaining calculation (without current credit):', originalPrice, '-', otherMethodsPaid, '=', currentRemaining);
            
            // Always cap at current remaining amount, but ensure minimum is 1 if remaining is 0
            const cappedValue = currentRemaining > 0 ? Math.min(minValue, currentRemaining) : (originalPrice > 0 ? Math.min(minValue, originalPrice) : 1);
            console.log('- cappedValue calculation:');
            console.log('  - currentRemaining > 0?', currentRemaining > 0);
            console.log('  - if true: Math.min(minValue, currentRemaining) = Math.min(' + minValue + ', ' + currentRemaining + ') = ' + Math.min(minValue, currentRemaining));
            console.log('  - if false: originalPrice > 0?', originalPrice > 0);
            console.log('  - if true: Math.min(minValue, originalPrice) = Math.min(' + minValue + ', ' + originalPrice + ') = ' + Math.min(minValue, originalPrice));
            console.log('  - final cappedValue:', cappedValue);
            
            console.log('AFTER SAVE CALCULATIONS:');
            console.log('- About to set localAmount to:', cappedValue.toString());
            console.log('- About to call updateMethodField with:', cappedValue.toString());
            
             setLocalAmount(cappedValue.toString());
             updateMethodField(itemKey, 'credit', 'amount', cappedValue.toString());
             
             // Collapse the form after saving
             if (setItemExpandedMethod) {
               setItemExpandedMethod(prev => ({
                 ...prev,
                 [itemKey]: null
               }));
             }
             
             console.log('=== SAVE COMPLETED ===');
          }}
          sx={{
            bgcolor: '#5E837C',
            '&:hover': { bgcolor: '#4a6b65' },
            fontSize: '0.75rem',
            px: 2,
            py: 0.5
          }}
        >
          Save
        </Button>
      </Box>
      
      {/* Payment Amount and Number of Payments */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
        <Box sx={{ flex: 2 }}>
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
              console.log('=== CREDIT CARD onChange ===');
              console.log('- inputValue:', inputValue);
              console.log('- current localAmount:', localAmount);
              console.log('- isSaved:', isSaved);
              // Only update local state during typing, don't update the main state
              setLocalAmount(inputValue);
              console.log('- setLocalAmount called with:', inputValue);
              console.log('=== onChange COMPLETED ===');
            }}
            onBlur={(e) => {
              console.log('=== CREDIT CARD onBlur (NEW VERSION) ===');
              console.log('- isSaved:', isSaved);
              console.log('- onBlur does nothing - validation only happens on Save');
              console.log('- This is the updated version without validation logic');
              console.log('=== onBlur COMPLETED ===');
            }} 
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormControl fullWidth size="medium" sx={{ '& .MuiInputBase-root': { height: 48 } }}>
            <InputLabel sx={{ fontSize: '0.9rem' }}>Payments</InputLabel>
            <Select
              value={paymentData?.credit?.numberOfPayments || '1'}
              label="Payments"
              onChange={(e) => updateMethodField(itemKey, 'credit', 'numberOfPayments', e.target.value)}
            >
              <MenuItem value="1">1 Payment</MenuItem>
              <MenuItem value="2">2 Payments</MenuItem>
              <MenuItem value="3">3 Payments</MenuItem>
              <MenuItem value="4">4 Payments</MenuItem>
              <MenuItem value="5">5 Payments</MenuItem>
            </Select>
          </FormControl>
        </Box>
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
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {renderBrandAdornment(detectCardType(String(paymentData?.credit?.cardNumber ?? '')))}
              </InputAdornment>
            )
          }}
          onChange={(e) => {
            const raw = e.target.value;
            const formatted = formatCardNumber(raw);
            updateMethodField(itemKey, 'credit', 'cardNumber', formatted);
          }} 
        />
      </Box>

      {/* Cardholder Name and ID */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
        <Box sx={{ flex: 2 }}>
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
        <Box sx={{ flex: 1 }}>
          <TextField 
            fullWidth
            size="medium" 
            sx={{ 
              '& .MuiInputBase-root': { height: 48 }, 
              '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
              '& .MuiInputLabel-root': { fontSize: '0.9rem' }
            }} 
            label="ID Number" 
            placeholder="123456789"
            InputLabelProps={{ shrink: true }}
            value={(paymentData?.credit?.idNumber ?? '')} 
            inputProps={{ 
              suppressHydrationWarning: true,
              maxLength: 9,
              inputMode: 'numeric'
            }} 
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only digits
              if (value.length <= 9) {
                updateMethodField(itemKey, 'credit', 'idNumber', value);
              }
            }} 
          />
        </Box>
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


