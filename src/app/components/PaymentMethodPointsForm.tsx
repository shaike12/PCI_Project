"use client";

import { Box, TextField, Typography, Button, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface PaymentMethodPointsFormProps {
  itemKey: string;
  paymentData?: any;
  updateMethodField: (itemKey: string, method: 'credit' | 'voucher' | 'points', field: string, value: string, voucherIndex?: number) => void;
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number };
  getOriginalItemPrice: (itemKey: string) => number;
  getTotalPaidAmountWrapper: (itemKey: string) => number;
  setItemExpandedMethod?: (updater: (prev: { [key: string]: number | null }) => { [key: string]: number | null }) => void;
}

export function PaymentMethodPointsForm({ itemKey, paymentData, updateMethodField, getRemainingAmount, getOriginalItemPrice, getTotalPaidAmountWrapper, setItemExpandedMethod }: PaymentMethodPointsFormProps) {
  const amounts = getRemainingAmount(itemKey);
  const storedAmount = paymentData?.points?.amount;
  const fallbackAmount = amounts.remaining;
  const originalPrice = getOriginalItemPrice(itemKey);
  
  const [isSaved, setIsSaved] = useState(false);
  const [localAmount, setLocalAmount] = useState((storedAmount || fallbackAmount).toFixed(2));

  // Update local amount when stored amount changes (after save)
  useEffect(() => {
    if (storedAmount !== undefined && storedAmount !== null && storedAmount !== '') {
      setLocalAmount(storedAmount.toFixed(2));
    }
  }, [storedAmount]);
  
  const [isChecking, setIsChecking] = useState(false);
  const memberChecked = paymentData?.points?.memberChecked || false;
  const pointsBalance = paymentData?.points?.pointsBalance || null;
  
  const checkMemberNumber = async () => {
    
    const memberNumber = paymentData?.points?.memberNumber;
    if (!memberNumber || memberNumber.length < 7 || memberNumber.length > 9) {
      alert('Please enter a valid member number (7-9 digits)');
      return;
    }
    setIsChecking(true);
    
    // Simulate API call to check member
    setTimeout(() => {
      
      // Generate points balance based on member number (for demo purposes)
      // In real app, this would be an API call that returns the actual balance
      let pointsBalance;
      
      // Special case: member number 100000000 gets exactly 10,000 points
      if (memberNumber === '100000000') {
        pointsBalance = 10000;
      } else {
        const memberNumberInt = parseInt(memberNumber);
        pointsBalance = 30000 + (memberNumberInt % 40000); // Range: 30,000 - 70,000 points
      }
      
      // Save to paymentData instead of local state
      updateMethodField(itemKey, 'points', 'pointsBalance', pointsBalance.toString());
      updateMethodField(itemKey, 'points', 'memberChecked', 'true');
      setIsChecking(false);
      
      // Auto-populate points based on remaining amount
      // Calculate remaining amount BEFORE adding the points payment
      // We need to exclude the current points payment from the calculation
      const currentPaidAmount = getTotalPaidAmountWrapper(itemKey);
      const currentPointsAmount = paymentData?.points?.amount || 0;
      const otherMethodsPaid = currentPaidAmount - currentPointsAmount;
      const currentRemaining = originalPrice - otherMethodsPaid;
      
      
      // If item is already fully paid by other methods, don't populate points
      if (currentRemaining <= 0) {
        updateMethodField(itemKey, 'points', 'pointsToUse', '0');
        updateMethodField(itemKey, 'points', 'amount', '0');
        updateMethodField(itemKey, 'points', 'balance', pointsBalance.toString());
        return;
      }
      
      const maxPointsForRemaining = currentRemaining * 50; // 50 points = $1
      const pointsToUse = Math.min(pointsBalance, maxPointsForRemaining);
      const dollarAmount = (pointsToUse / 50).toFixed(2);
      
      
      updateMethodField(itemKey, 'points', 'pointsToUse', pointsToUse.toString());
      
      updateMethodField(itemKey, 'points', 'amount', dollarAmount);
      
      updateMethodField(itemKey, 'points', 'balance', pointsBalance.toString());
      
      
    }, 1000);
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
          label="Payment Amount ($)" 
          placeholder="$0.00"
          InputLabelProps={{ shrink: true }}
          type="number" 
            value={localAmount}
          inputProps={{ suppressHydrationWarning: true }} 
          onChange={(e) => {
            const inputValue = e.target.value;
            const value = parseFloat(inputValue) || 0;
            
            // Calculate maximum allowed amount based on available points and remaining balance
            const availablePoints = pointsBalance || 0;
            const maxAmountFromPoints = availablePoints / 50; // 50 points = $1
            
            // Calculate remaining amount (excluding current points payment)
            const currentPaidAmount = getTotalPaidAmountWrapper(itemKey);
            const currentPointsAmount = parseFloat(storedAmount || '0') || 0;
            const otherMethodsPaid = currentPaidAmount - currentPointsAmount;
            const currentRemaining = Math.max(0, originalPrice - otherMethodsPaid);
            
            const maxAllowedAmount = Math.min(maxAmountFromPoints, currentRemaining);
            
            // Cap the input value to the maximum allowed
            const cappedValue = Math.min(value, maxAllowedAmount);
            
            // Only update if the value is within limits or if it's being reduced
            if (value <= maxAllowedAmount || value < parseFloat(localAmount)) {
              setLocalAmount(inputValue);
              const pointsToUse = Math.round(cappedValue * 50);
              updateMethodField(itemKey, 'points', 'pointsToUse', pointsToUse.toString());
            } else {
              // If trying to exceed limit, cap to maximum
              setLocalAmount(cappedValue.toFixed(2));
              const pointsToUse = Math.round(cappedValue * 50);
              updateMethodField(itemKey, 'points', 'pointsToUse', pointsToUse.toString());
            }
          }}
          onBlur={(e) => {
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
            const inputValue = e.target.value;
            const pointsToUse = parseInt(inputValue) || 0;
            
            // Calculate maximum allowed points based on available points and remaining balance
            const availablePoints = pointsBalance || 0;
            
            // Calculate remaining amount (excluding current points payment)
            const currentPaidAmount = getTotalPaidAmountWrapper(itemKey);
            const currentPointsAmount = parseFloat(storedAmount || '0') || 0;
            const otherMethodsPaid = currentPaidAmount - currentPointsAmount;
            const currentRemaining = Math.max(0, originalPrice - otherMethodsPaid);
            const maxPointsForRemaining = currentRemaining * 50; // 50 points = $1
            
            const maxAllowedPoints = Math.min(availablePoints, maxPointsForRemaining);
            
            // Cap the input value to the maximum allowed
            const cappedPoints = Math.min(pointsToUse, maxAllowedPoints);
            
            // Only update if the value is within limits or if it's being reduced
            if (pointsToUse <= maxAllowedPoints || pointsToUse < (parseInt(paymentData?.points?.pointsToUse || '0') || 0)) {
              const dollarAmount = (pointsToUse / 50).toFixed(2);
              updateMethodField(itemKey, 'points', 'pointsToUse', inputValue);
              updateMethodField(itemKey, 'points', 'amount', dollarAmount);
              setLocalAmount(dollarAmount);
            } else {
              // If trying to exceed limit, cap to maximum
              const dollarAmount = (cappedPoints / 50).toFixed(2);
              updateMethodField(itemKey, 'points', 'pointsToUse', cappedPoints.toString());
              updateMethodField(itemKey, 'points', 'amount', dollarAmount);
              setLocalAmount(dollarAmount);
            }
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
              updateMethodField(itemKey, 'points', 'memberChecked', 'false'); // Reset check status when number changes
              updateMethodField(itemKey, 'points', 'pointsBalance', '0'); // Reset points balance when number changes
            }} 
          />
          <Button
            variant="contained"
            onClick={checkMemberNumber}
            disabled={isChecking || !paymentData?.points?.memberNumber || paymentData.points.memberNumber.length < 7 || paymentData.points.memberNumber.length > 9}
            sx={{ 
              color: memberChecked ? '#48A9A6' : '#1B358F',
              height: 48,
              minWidth: 100,
              whiteSpace: 'nowrap'
            }}
            startIcon={isChecking ? <CircularProgress size={20} color="inherit" /> : memberChecked ? <CheckCircleIcon /> : null}
          >
            {isChecking ? 'Checking...' : memberChecked ? 'Checked' : 'Check'}
          </Button>
        </Box>
        {pointsBalance !== null && (
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#48A9A6', fontWeight: 'bold' }}>
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
              updateMethodField(itemKey, 'points', 'amount', '1');
              updateMethodField(itemKey, 'points', 'pointsToUse', '50');
              return;
            }
            
            const value = parseFloat(inputValue);
            // Handle invalid input (NaN)
            if (isNaN(value)) {
              setLocalAmount('1');
              updateMethodField(itemKey, 'points', 'amount', '1');
              updateMethodField(itemKey, 'points', 'pointsToUse', '50');
              return;
            }
            
            // Don't allow negative values, and always cap at remaining amount
            // If value is 0, set it to 1 dollar minimum
            const minValue = value <= 0 ? 1 : Math.max(0.01, value);
            
            // Calculate remaining amount WITHOUT the current payment method
            // We need to exclude the current points amount from the calculation
            const currentPaidAmount = getTotalPaidAmountWrapper(itemKey);
            
            // Subtract the current points amount to get the amount paid by OTHER methods
            const currentPointsAmount = parseFloat(storedAmount || '0') || 0;
            const otherMethodsPaid = currentPaidAmount - currentPointsAmount;
            
            const currentRemaining = Math.max(0, originalPrice - otherMethodsPaid);
            
            // Always cap at current remaining amount, but ensure minimum is 1 if remaining is 0
            const cappedAmount = currentRemaining > 0 ? Math.min(minValue, currentRemaining) : (originalPrice > 0 ? Math.min(minValue, originalPrice) : 1);
            const pointsToUse = Math.round(cappedAmount * 50); // 50 points = $1
            
            setLocalAmount(cappedAmount.toFixed(2));
            updateMethodField(itemKey, 'points', 'amount', cappedAmount.toString());
            updateMethodField(itemKey, 'points', 'pointsToUse', pointsToUse.toString());
            
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


