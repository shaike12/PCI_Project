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
  checkVoucherBalance?: (voucherNumber: string) => Promise<number>;
  getVoucherBalance?: (voucherNumber: string) => number;
  updateVoucherBalance?: (voucherNumber: string, usedAmount: number) => void;
  getVoucherInitialBalance?: (voucherNumber: string) => number;
  getCurrentVoucherUsage?: (voucherNumber: string) => number;
  getVoucherUsageExcluding?: (voucherNumber: string, excludeItemKey: string, excludeVoucherIndex: number) => number;
}

export function PaymentMethodVoucherForm({ itemKey, index, paymentData, updateMethodField, getRemainingAmount, getOriginalItemPrice, getTotalPaidAmountWrapper, setItemExpandedMethod, checkVoucherBalance, getVoucherBalance, updateVoucherBalance, getVoucherInitialBalance, getCurrentVoucherUsage, getVoucherUsageExcluding }: PaymentMethodVoucherFormProps) {
  const amounts = getRemainingAmount(itemKey);
  const voucherIndex = index;
  const storedAmount = paymentData?.vouchers?.[voucherIndex]?.amount;
  const fallbackAmount = amounts.remaining;
  const originalPrice = getOriginalItemPrice(itemKey);
  const currentVoucherNumber = paymentData?.vouchers?.[voucherIndex]?.voucherNumber ?? '';
  
  const [isSaved, setIsSaved] = useState(false);
  const [localAmount, setLocalAmount] = useState((storedAmount || fallbackAmount).toFixed(2));
  const [localVoucherNumber, setLocalVoucherNumber] = useState((paymentData?.vouchers?.[voucherIndex]?.voucherNumber ?? ''));
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [voucherBalance, setVoucherBalance] = useState<number | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [localEffectiveBalance, setLocalEffectiveBalance] = useState<number | null>(null);

  // Only show balance after Apply button is clicked (localEffectiveBalance is set)
  const effectiveBalance: number | null = localEffectiveBalance;

  // Update effective balance when local amount changes (after Apply)
  useEffect(() => {
    if (localEffectiveBalance !== null && currentVoucherNumber) {
      // Recalculate the effective balance based on current usage
      const voucherNumber = currentVoucherNumber.replace(/\D/g, '');
      if (getVoucherInitialBalance && getCurrentVoucherUsage) {
        const initial = getVoucherInitialBalance(voucherNumber);
        const used = getCurrentVoucherUsage(voucherNumber);
        const newEffectiveBalance = Math.max(0, initial - used);
        console.log('[VOUCHER_FORM] Updating effective balance due to amount change:', {
          initial,
          used,
          newEffectiveBalance,
          localAmount,
          currentVoucherNumber
        });
        setLocalEffectiveBalance(newEffectiveBalance);
      }
    }
  }, [localAmount, currentVoucherNumber, getVoucherInitialBalance, getCurrentVoucherUsage, localEffectiveBalance]);

  // Log component render and state changes
  useEffect(() => {
    console.log('[VOUCHER_FORM] Component rendered/updated:', {
      itemKey,
      voucherIndex,
      localAmount,
      localVoucherNumber,
      localEffectiveBalance,
      effectiveBalance,
      currentVoucherNumber,
      storedAmount,
      hasApplied
    });
  }, [itemKey, voucherIndex, localAmount, localVoucherNumber, localEffectiveBalance, effectiveBalance, currentVoucherNumber, storedAmount, hasApplied]);

  // Compute remaining balance after using the current local amount
  const remainingAfterUse: number | null = (() => {
    if (effectiveBalance === null) return null;
    const amountNum = parseFloat(String(localAmount)) || 0;
    const rem = Math.max(0, effectiveBalance - amountNum);
    return rem;
  })();

  // Update local state when stored data changes (after save)
  useEffect(() => {
    if (storedAmount !== undefined && storedAmount !== null && storedAmount !== '') {
      setLocalAmount(storedAmount.toFixed(2));
    }
    if (currentVoucherNumber !== undefined && currentVoucherNumber !== null) {
      setLocalVoucherNumber(currentVoucherNumber);
      // Reset local effective balance when voucher number changes from global state
      console.log('[VOUCHER_FORM] Global voucher number changed, resetting effective balance:', {
        currentVoucherNumber
      });
      setLocalEffectiveBalance(null);
    }
  }, [storedAmount, currentVoucherNumber]);

  // Restore effective balance if voucher was applied but balance was lost (e.g., after collapse/expand)
  useEffect(() => {
    if (currentVoucherNumber && currentVoucherNumber.length >= 15 && localEffectiveBalance === null) {
      console.log('[VOUCHER_FORM] Restoring effective balance after collapse/expand:', {
        currentVoucherNumber,
        localVoucherNumber,
        localEffectiveBalance
      });
      
      // Calculate the balance from global functions
      const voucherNumber = currentVoucherNumber.replace(/\D/g, '');
      if (getVoucherInitialBalance && getCurrentVoucherUsage) {
        const initial = getVoucherInitialBalance(voucherNumber);
        const used = getCurrentVoucherUsage(voucherNumber);
        const restoredBalance = Math.max(0, initial - used);
        console.log('[VOUCHER_FORM] Restored balance:', {
          initial,
          used,
          restoredBalance
        });
        setLocalEffectiveBalance(restoredBalance);
      }
    }
  }, [currentVoucherNumber, localEffectiveBalance, getVoucherInitialBalance, getCurrentVoucherUsage]);

  // Function to check voucher balance using global functions
  const handleCheckVoucherBalance = async () => {
    const voucherNumber = localVoucherNumber.replace(/\D/g, ''); // Remove non-digits
    
    console.log('[VOUCHER_FORM] ===== APPLY BUTTON CLICKED =====', {
      localVoucherNumber,
      voucherNumber,
      voucherNumberLength: voucherNumber.length,
      itemKey,
      voucherIndex,
      currentVoucherNumber,
      storedAmount,
      localAmount
    });
    
    if (voucherNumber.length < 15) {
      console.log('[VOUCHER_FORM] Voucher number too short, showing alert');
      alert('Please enter a complete voucher number (15 digits)');
      return;
    }

    if (!checkVoucherBalance) {
      alert('Voucher balance check not available');
      return;
    }

    setIsCheckingBalance(true);
    
    try {
      console.log('[VOUCHER_FORM] Calling checkVoucherBalance with:', voucherNumber);
      // Use the provided check function to initialize, but display relies on global live balance
      const balance = await checkVoucherBalance(voucherNumber);
      console.log('[VOUCHER_FORM] checkVoucherBalance returned:', balance);
      
      // Cache last fetched as hint, but UI shows global live value
      setVoucherBalance(balance);
      setHasApplied(true);
      
      // Calculate remaining amount for this item
      const currentPaidAmount = getTotalPaidAmountWrapper(itemKey);
      const currentVoucherAmount = parseFloat(storedAmount || '0') || 0;
      const otherMethodsPaid = currentPaidAmount - currentVoucherAmount;
      const currentRemaining = Math.max(0, originalPrice - otherMethodsPaid);
      
      console.log('[VOUCHER_FORM] Payment calculations:', {
        currentPaidAmount,
        currentVoucherAmount,
        otherMethodsPaid,
        currentRemaining,
        originalPrice
      });
      
      // Update amount based on voucher available balance (global live)
      const availableNowGlobal = (() => {
        if (getVoucherInitialBalance && getCurrentVoucherUsage) {
          const initial = getVoucherInitialBalance(voucherNumber);
          const used = getCurrentVoucherUsage(voucherNumber);
          const result = Math.max(0, initial - used);
          console.log('[VOUCHER_FORM] Global balance calculation:', {
            initial,
            used,
            result
          });
          return result;
        }
        const result = Number.isFinite(balance) ? balance : 0;
        console.log('[VOUCHER_FORM] Using balance directly:', result);
        return result;
      })();
      
      console.log('[VOUCHER_FORM] Setting localEffectiveBalance to:', availableNowGlobal);
      // Set local effective balance for display
      setLocalEffectiveBalance(availableNowGlobal);

      if (availableNowGlobal >= currentRemaining) {
        // Voucher has enough balance, use the full remaining amount
        const newAmount = currentRemaining > 0 ? currentRemaining : originalPrice;
        console.log('[VOUCHER_FORM] Voucher has enough balance, setting amount to:', newAmount);
        setLocalAmount(newAmount.toFixed(2));
        // Don't update global state here - only update local state for display
        // The global state will be updated when Save is clicked
      } else {
        // Voucher doesn't have enough balance, use the voucher balance
        console.log('[VOUCHER_FORM] Voucher has insufficient balance, setting amount to:', availableNowGlobal);
        setLocalAmount(availableNowGlobal.toFixed(2));
        // Don't update global state here - only update local state for display
        // The global state will be updated when Save is clicked
      }
      
      // Update the voucher balance in the global state to reflect current usage
      if (getVoucherBalance) {
        const currentGlobalBalance = getVoucherBalance(voucherNumber);
        
      }
    } catch (error) {
      console.log('[VOUCHER_FORM] Error in handleCheckVoucherBalance:', error);
      alert('Error checking voucher balance');
    } finally {
      console.log('[VOUCHER_FORM] handleCheckVoucherBalance completed, setting isCheckingBalance to false');
      setIsCheckingBalance(false);
    }
  };


  return (
    <Box sx={{ mt: 2, p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: '#E4DFDA' }}>
      
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
            console.log('[VOUCHER_FORM] ===== AMOUNT FIELD CHANGED =====', {
              oldValue: localAmount,
              newValue: inputValue,
              itemKey,
              voucherIndex,
              localEffectiveBalance,
              effectiveBalance,
              currentVoucherNumber
            });
            // Only update local state during typing, don't update the main state yet
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
            // Don't update global state during typing - only when Save is clicked
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
            value={localVoucherNumber} 
          inputProps={{ 
            suppressHydrationWarning: true,
            maxLength: 16
          }} 
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
              const previousValue = localVoucherNumber.replace(/\D/g, '');
              
              console.log('[VOUCHER_FORM] Voucher number onChange:', {
                inputValue: e.target.value,
                cleanedValue: value,
                previousValue,
                localVoucherNumber
              });
            
            // Only add 1114 prefix if:
            // 1. User is typing (value is longer than previous)
            // 2. Value doesn't start with 1114
            // 3. Value is short (1-3 digits)
            if (value.length > previousValue.length && value.length > 0 && !value.startsWith('1114') && value.length <= 3) {
              value = '1114' + value;
                console.log('[VOUCHER_FORM] Added 1114 prefix:', value);
            }
            
            // Add dash after 1114 if there are more digits
            if (value.length > 4) {
              value = value.substring(0, 4) + '-' + value.substring(4, 15); // Max 11 digits after dash
                console.log('[VOUCHER_FORM] Added dash:', value);
              }
              
              console.log('[VOUCHER_FORM] Setting localVoucherNumber to:', value);
              // Only update local state during typing, don't update global state yet
              setLocalVoucherNumber(value);
              // Reset applied state when voucher number changes
              setHasApplied(false);
              setVoucherBalance(null);
              setLocalEffectiveBalance(null);
            }} 
          />
          <Button
            variant="contained"
            onClick={handleCheckVoucherBalance}
            disabled={isCheckingBalance || localVoucherNumber.replace(/\D/g, '').length < 15}
            sx={{
              bgcolor: '#D4B483',
              color: 'white',
              height: 48,
              px: 2.5,
              '&:hover': {
                bgcolor: '#c19f5f'
              },
              '&:disabled': {
                bgcolor: '#E0E0E0',
                color: '#9E9E9E'
              }
            }}
          >
            Apply
          </Button>
        </Box>
        
        {/* Voucher Balance Display - Only show after Apply button is clicked */}
        {localEffectiveBalance !== null && (
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
                  Click Apply to check voucher balance
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
      
      {/* Save Button at bottom */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 3 }}>
        <Button
          variant="contained"
          size="small"
          onClick={async () => {
            console.log('[VOUCHER_FORM] ===== SAVE BUTTON CLICKED =====', {
              localAmount,
              localVoucherNumber,
              itemKey,
              voucherIndex,
              currentVoucherNumber,
              storedAmount,
              localEffectiveBalance,
              effectiveBalance
            });
            
            setIsSaved(true);
            // Apply validation and capping immediately when saving
            const inputValue = localAmount;
            // Handle empty input
            if (inputValue === '' || inputValue === null || inputValue === undefined) {
              console.log('[VOUCHER_FORM] Empty input, setting to 1.00');
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
            
            console.log('[VOUCHER_FORM] Final values for save:', {
              cappedValue,
              localVoucherNumber
            });
            
            setLocalAmount(cappedValue.toFixed(2));
            // Update the global state with the final amount and voucher number
            console.log('[VOUCHER_FORM] Updating global state with amount:', cappedValue.toString());
            updateMethodField(itemKey, 'voucher', 'amount', cappedValue.toString(), voucherIndex);
            console.log('[VOUCHER_FORM] Updating global state with voucher number:', localVoucherNumber);
            updateMethodField(itemKey, 'voucher', 'voucherNumber', localVoucherNumber, voucherIndex);
            
            // Ensure global voucher balance is initialized and then deduct used amount
            if (localVoucherNumber && updateVoucherBalance) {
              try {
                // Always initialize/refresh the global balance before deduction
                if (checkVoucherBalance) {
                  await checkVoucherBalance(localVoucherNumber);
                }
                
                updateVoucherBalance(localVoucherNumber, cappedValue);
              } catch (e) {
                
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


