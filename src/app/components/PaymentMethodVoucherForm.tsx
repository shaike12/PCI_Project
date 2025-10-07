"use client";

import { Box, TextField, Typography, Button, IconButton } from "@mui/material";
import { useState, useEffect } from "react";
import { Search as SearchIcon } from "@mui/icons-material";

interface PaymentMethodVoucherFormProps {
  itemKey: string;
  index: number;
  paymentData?: any;
  updateMethodField: (itemKey: string, method: 'credit' | 'voucher' | 'points', field: string, value: string, voucherIndex?: number) => void;
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number };
  getOriginalItemPrice: (itemKey: string) => number;
  getTotalPaidAmountWrapper: (itemKey: string) => number;
  setItemExpandedMethod?: (updater: (prev: { [key: string]: number | null }) => { [key: string]: number | null }) => void;
  checkVoucherBalance?: (voucherNumber: string) => Promise<number>;
  getVoucherBalance?: (voucherNumber: string) => number;
  updateVoucherBalance?: (voucherNumber: string, usedAmount: number) => void;
  getVoucherInitialBalance?: (voucherNumber: string) => number;
  getCurrentVoucherUsage?: (voucherNumber: string) => number;
}

export function PaymentMethodVoucherForm({ itemKey, index, paymentData, updateMethodField, getRemainingAmount, getOriginalItemPrice, getTotalPaidAmountWrapper, setItemExpandedMethod, checkVoucherBalance, getVoucherBalance, updateVoucherBalance, getVoucherInitialBalance, getCurrentVoucherUsage }: PaymentMethodVoucherFormProps) {
  const amounts = getRemainingAmount(itemKey);
  const voucherIndex = index;
  const storedAmount = paymentData?.vouchers?.[voucherIndex]?.amount;
  const fallbackAmount = amounts.remaining;
  const originalPrice = getOriginalItemPrice(itemKey);
  const currentVoucherNumber = paymentData?.vouchers?.[voucherIndex]?.voucherNumber ?? '';
  
  const [isSaved, setIsSaved] = useState(false);
  const [localAmount, setLocalAmount] = useState((storedAmount || fallbackAmount).toFixed(2));
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [voucherBalance, setVoucherBalance] = useState<number | null>(null);

  // Compute effective known balance (prefer locally checked balance, else global state)
  const effectiveBalance: number | null = (() => {
    if (voucherBalance !== null) return voucherBalance;
    if (currentVoucherNumber.length >= 8) {
      // Prefer computed: initial balance - sum of all usages so far
      if (getVoucherInitialBalance && getCurrentVoucherUsage) {
        const initial = getVoucherInitialBalance(currentVoucherNumber);
        const used = getCurrentVoucherUsage(currentVoucherNumber);
        return Math.max(0, initial - used);
      }
      if (getVoucherBalance) {
        const bal = getVoucherBalance(currentVoucherNumber);
        return Number.isFinite(bal) ? bal : null;
      }
    }
    return null;
  })();

  // Compute remaining balance after using the current local amount
  const remainingAfterUse: number | null = (() => {
    if (effectiveBalance === null) return null;
    const amountNum = parseFloat(String(localAmount)) || 0;
    const rem = Math.max(0, effectiveBalance - amountNum);
    return rem;
  })();

  // Update local amount when stored amount changes (after save)
  useEffect(() => {
    if (storedAmount !== undefined && storedAmount !== null && storedAmount !== '') {
      setLocalAmount(storedAmount.toFixed(2));
    }
  }, [storedAmount]);

  // Function to check voucher balance using global functions
  const handleCheckVoucherBalance = async () => {
    const voucherNumber = currentVoucherNumber.replace(/\D/g, ''); // Remove non-digits
    
    console.log('handleCheckVoucherBalance called:', {
      voucherNumber,
      checkVoucherBalance: !!checkVoucherBalance,
      getVoucherBalance: !!getVoucherBalance,
      updateVoucherBalance: !!updateVoucherBalance
    });
    
    if (voucherNumber.length < 8) {
      alert('Please enter a valid voucher number');
      return;
    }

    if (!checkVoucherBalance) {
      alert('Voucher balance check not available');
      return;
    }

    setIsCheckingBalance(true);
    
    try {
      // Use the provided check function to initialize, but display computed available now
      const balance = await checkVoucherBalance(voucherNumber);
      // Compute available as initial - sum(all current usages), if helpers are provided
      let availableNow = balance;
      if (getVoucherInitialBalance && getCurrentVoucherUsage) {
        const initial = getVoucherInitialBalance(voucherNumber);
        const used = getCurrentVoucherUsage(voucherNumber);
        availableNow = Math.max(0, initial - used);
      }
      setVoucherBalance(availableNow);
      
      // Calculate remaining amount for this item
      const currentPaidAmount = getTotalPaidAmountWrapper(itemKey);
      const currentVoucherAmount = parseFloat(storedAmount || '0') || 0;
      const otherMethodsPaid = currentPaidAmount - currentVoucherAmount;
      const currentRemaining = Math.max(0, originalPrice - otherMethodsPaid);
      
      // Update amount based on voucher available balance (computed)
      if (availableNow >= currentRemaining) {
        // Voucher has enough balance, use the full remaining amount
        const newAmount = currentRemaining > 0 ? currentRemaining : originalPrice;
        setLocalAmount(newAmount.toFixed(2));
        updateMethodField(itemKey, 'voucher', 'amount', newAmount.toString(), voucherIndex);
      } else {
        // Voucher doesn't have enough balance, use the voucher balance
        setLocalAmount(availableNow.toFixed(2));
        updateMethodField(itemKey, 'voucher', 'amount', availableNow.toString(), voucherIndex);
      }
      
      // Update the voucher balance in the global state to reflect current usage
      if (getVoucherBalance) {
        const currentGlobalBalance = getVoucherBalance(voucherNumber);
        console.log('After checking balance - Current global balance for voucher:', currentGlobalBalance);
        console.log('Balance returned from checkVoucherBalance:', balance);
        console.log('Are they the same?', currentGlobalBalance === balance);
      }
    } catch (error) {
      console.error('Error checking voucher balance:', error);
      alert('Error checking voucher balance');
    } finally {
      setIsCheckingBalance(false);
    }
  };

  return (
    <Box sx={{ mt: 2, p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: '#E4DFDA' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: '#1B358F', fontWeight: 600 }}>
          UATP Voucher Details #{index + 1}
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={async () => {
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
            
            // Ensure global voucher balance is initialized and then deduct used amount
            if (currentVoucherNumber && updateVoucherBalance) {
              try {
                // Always initialize/refresh the global balance before deduction
                if (checkVoucherBalance) {
                  await checkVoucherBalance(currentVoucherNumber);
                }
                console.log('Calling updateVoucherBalance on save:', { currentVoucherNumber, used: cappedValue });
                updateVoucherBalance(currentVoucherNumber, cappedValue);
              } catch (e) {
                console.warn('Failed to initialize/deduct voucher balance on save', e);
              }
            }
            
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
            let numeric = parseFloat(inputValue);
            if (isNaN(numeric)) {
              setLocalAmount(inputValue);
              return;
            }
            // Calculate product remaining without current voucher amount
            const currentPaidAmount = getTotalPaidAmountWrapper(itemKey);
            const currentVoucherAmount = parseFloat(storedAmount || '0') || 0;
            const otherMethodsPaid = currentPaidAmount - currentVoucherAmount;
            const currentRemaining = Math.max(0, originalPrice - otherMethodsPaid);
            // Voucher headroom (available) now
            const headroom = effectiveBalance !== null ? Math.max(0, effectiveBalance) : Number.POSITIVE_INFINITY;
            const maxAllowed = Math.min(currentRemaining > 0 ? currentRemaining : originalPrice, headroom);
            if (numeric > maxAllowed) numeric = maxAllowed;
            if (numeric < 0) numeric = 0;
            const nextValue = numeric.toFixed(2);
            setLocalAmount(nextValue);
            // Also reflect in global state so other items see the usage immediately
            updateMethodField(itemKey, 'voucher', 'amount', numeric.toString(), voucherIndex);
          }}
            onBlur={(e) => {
            }}
        />
      </Box>
      
      {/* Voucher Number */}
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
          <IconButton
            onClick={handleCheckVoucherBalance}
            disabled={isCheckingBalance || currentVoucherNumber.length < 8}
            sx={{
              bgcolor: '#D4B483',
              color: 'white',
              height: 48,
              width: 48,
              '&:hover': {
                bgcolor: '#c19f5f'
              },
              '&:disabled': {
                bgcolor: '#E0E0E0',
                color: '#9E9E9E'
              }
            }}
            title="Check voucher balance"
          >
            <SearchIcon />
          </IconButton>
        </Box>
        
        {/* Voucher Balance Display */}
        {currentVoucherNumber.length >= 8 && (
          <Box sx={{ mt: 1, p: 1.5, bgcolor: '#F5F5F5', borderRadius: 1, border: '1px solid #E0E0E0' }}>
            {effectiveBalance !== null ? (
              <>
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                  Voucher Balance:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1B358F' }}>
                  ${effectiveBalance.toFixed(2)}
                </Typography>
                {remainingAfterUse !== null && (
                  <Box sx={{ mt: 0.75 }}>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                      Remaining after use (based on Amount field):
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#48A9A6' }}>
                      ${remainingAfterUse.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                  Amount automatically adjusted based on available balance
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                  Voucher Status:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                  Not checked yet
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                  Click the search button to check voucher balance
                </Typography>
              </>
            )}
          </Box>
        )}
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


