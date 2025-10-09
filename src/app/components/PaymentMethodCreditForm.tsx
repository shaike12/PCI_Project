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
  const [localAmount, setLocalAmount] = useState((storedAmount || fallbackAmount).toFixed(2));

  const maskCardNumber = (cardNumber?: string): string => {
    if (!cardNumber) return '';
    const digits = String(cardNumber).replace(/\D/g, '');
    const last4 = digits.slice(-4);
    return last4 ? `**** **** **** ${last4}` : '';
  };

  const isPersistentlySaved = String(paymentData?.credit?.isSaved || '').toLowerCase() === 'true';
  const shouldMask = isSaved || isPersistentlySaved;

  // Update local amount when stored amount changes (after save)
  useEffect(() => {
    if (storedAmount !== undefined && storedAmount !== null && storedAmount !== '') {
      setLocalAmount(storedAmount.toFixed(2));
    }
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
            bgcolor: '#1B358F',
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
                bgcolor: '#C1666B'
              }} />
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: 16,
                transform: 'translateY(-50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: '#D4B483'
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
            bgcolor: '#48A9A6',
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
    <Box sx={{ mt: 2, p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: '#E4DFDA' }}>
      
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
              // Only update local state during typing, don't update the main state
              setLocalAmount(inputValue);
            }}
            onBlur={(e) => {
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
          value={shouldMask ? maskCardNumber(paymentData?.credit?.cardNumber) : (paymentData?.credit?.cardNumber ?? '')} 
          inputProps={{ 
            suppressHydrationWarning: true,
            maxLength: 19,
            inputMode: 'numeric'
          }} 
          InputProps={{
            readOnly: shouldMask,
            endAdornment: (
              <InputAdornment position="end">
                {renderBrandAdornment(detectCardType(String(paymentData?.credit?.cardNumber ?? '')))}
              </InputAdornment>
            )
          }}
          onChange={(e) => {
            if (shouldMask) return; // prevent editing when masked/saved
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
      
      {/* Save Button at bottom */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 3 }}>
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
              updateMethodField(itemKey, 'credit', 'amount', '1');
              return;
            }
            
            const value = parseFloat(inputValue);
            
            // Handle invalid input (NaN)
            if (isNaN(value)) {
              setLocalAmount('1.00');
              updateMethodField(itemKey, 'credit', 'amount', '1');
              return;
            }
            
            // Don't allow negative values, and always cap at remaining amount
            // If value is 0, set it to 1 dollar minimum
            const minValue = value <= 0 ? 1 : Math.max(0.01, value);
            
            // Calculate remaining amount WITHOUT the current payment method
            // We need to exclude the current credit card amount from the calculation
            const currentPaidAmount = getTotalPaidAmountWrapper(itemKey);
            
            // Subtract the current credit card amount to get the amount paid by OTHER methods
            const currentCreditAmount = parseFloat(storedAmount || '0') || 0;
            const otherMethodsPaid = currentPaidAmount - currentCreditAmount;
            
            const currentRemaining = Math.max(0, originalPrice - otherMethodsPaid);
            
            // Always cap at current remaining amount, but ensure minimum is 1 if remaining is 0
            const cappedValue = currentRemaining > 0 ? Math.min(minValue, currentRemaining) : (originalPrice > 0 ? Math.min(minValue, originalPrice) : 1);
            
            
             setLocalAmount(cappedValue.toFixed(2));
             updateMethodField(itemKey, 'credit', 'amount', cappedValue.toString());
             // Mark credit as saved so UI remains masked when reopening
             updateMethodField(itemKey, 'credit', 'isSaved', 'true');
             
             // Collapse the form after saving
             if (setItemExpandedMethod) {
               setItemExpandedMethod(prev => ({
                 ...prev,
                 [itemKey]: null
               }));
             }
             
          }}
          sx={{ 
            bgcolor: '#1B358F', 
            color: 'white',
            '&:hover': { bgcolor: '#0F2A7A' },
            fontSize: '0.75rem',
            px: 2,
            py: 0.5
          }}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
}


