"use client";

import { Box, Paper, Typography, IconButton, Slider, Tooltip, Collapse } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { PaymentMethodCreditForm } from "./PaymentMethodCreditForm";
import { PaymentMethodVoucherForm } from "./PaymentMethodVoucherForm";
import { PaymentMethodPointsForm } from "./PaymentMethodPointsForm";
import { validateCreditCard } from "../utils/paymentLogic";

interface PaymentMethodCardProps {
  itemKey: string;
  method: 'credit' | 'voucher' | 'points';
  idx: number;
  formMethods: string[];
  paymentData: any;
  itemExpandedMethod: { [key: string]: number | null };
  isPaymentMethodComplete: (itemKey: string, method: 'credit' | 'voucher' | 'points', voucherIndex: number) => boolean;
  updateMethodField: (itemKey: string, method: 'credit' | 'voucher' | 'points', field: string, value: string, voucherIndex?: number) => void;
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number };
  getOriginalItemPrice: (itemKey: string) => number;
  getTotalPaidAmountWrapper: (itemKey: string) => number;
  setItemExpandedMethod: (updater: (prev: { [key: string]: number | null }) => { [key: string]: number | null }) => void;
  removeMethod: (itemKey: string, formIndex: number) => void;
  onCopyMethod?: (itemKey: string, method: 'credit' | 'voucher' | 'points') => void;
  checkVoucherBalance?: (voucherNumber: string) => Promise<number>;
  getVoucherBalance?: (voucherNumber: string) => number;
  updateVoucherBalance?: (voucherNumber: string, usedAmount: number) => void;
  getVoucherInitialBalance?: (voucherNumber: string) => number;
  getCurrentVoucherUsage?: (voucherNumber: string) => number;
  getVoucherUsageExcluding?: (voucherNumber: string, excludeItemKey: string, excludeVoucherIndex: number) => number;
}

// Function to get detailed validation message for incomplete forms
const getValidationMessage = (method: string, paymentData: any, voucherIndex?: number): string => {
  if (method === 'credit') {
    const credit = paymentData?.credit;
    if (!credit) return 'Credit card form not initialized';
    
    const missing = [];
    if (!credit.cardNumber) missing.push('Card Number');
    else if (!validateCreditCard(credit.cardNumber)) missing.push('Valid Card Number');
    if (!credit.holderName) missing.push('Cardholder Name');
    if (!credit.expiryDate) missing.push('Expiry Date');
    if (!credit.cvv) missing.push('CVV');
    if (!credit.amount || parseFloat(credit.amount) <= 0) missing.push('Amount');
    
    return missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All fields completed';
  } else if (method === 'voucher') {
    const vouchers = paymentData?.vouchers || [];
    const voucher = vouchers[voucherIndex || 0];
    if (!voucher) return 'Voucher form not initialized';
    
    const missing = [];
    if (!voucher.voucherNumber) missing.push('Voucher Number');
    if (!voucher.expiryDate) missing.push('Expiry Date');
    if (!voucher.amount || parseFloat(voucher.amount) <= 0) missing.push('Amount');
    
    return missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All fields completed';
  } else if (method === 'points') {
    const points = paymentData?.points;
    if (!points) return 'Points form not initialized';
    
    const missing = [];
    if (!points.memberNumber) missing.push('Member Number');
    if (!points.awardReference) missing.push('Award Reference');
    if (!points.amount || parseFloat(points.amount) <= 0) missing.push('Amount');
    
    return missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All fields completed';
  }
  
  return 'Unknown payment method';
};

export function PaymentMethodCard({
  itemKey,
  method,
  idx,
  formMethods,
  paymentData,
  itemExpandedMethod,
  isPaymentMethodComplete,
  updateMethodField,
  getRemainingAmount,
  getOriginalItemPrice,
  getTotalPaidAmountWrapper,
  setItemExpandedMethod,
  removeMethod,
  onCopyMethod,
  checkVoucherBalance,
  getVoucherBalance,
  updateVoucherBalance,
  getVoucherInitialBalance,
  getCurrentVoucherUsage,
  getVoucherUsageExcluding
}: PaymentMethodCardProps) {
  const expanded = itemExpandedMethod[itemKey] === idx;
  if (process.env.NODE_ENV !== 'production') {
    // Lightweight render-time trace
    try {
      // Avoid spamming too much: only log when expanded or when first method
      if (expanded || idx === 0) {
        console.log('[CARD] render', { itemKey, method, idx, expanded });
      }
    } catch {}
  }
  
  const toggleExpanded = () => {
    setItemExpandedMethod(prev => {
      if (prev[itemKey] === idx) {
        return { ...prev, [itemKey]: null };
      }
      return { [itemKey]: idx } as typeof prev;
    });
  };
  
  let methodAmount = 0;
  if (method === 'credit') {
    methodAmount = Number(paymentData?.credit?.amount) || 0;
  } else if (method === 'voucher') {
    const voucherIdx = formMethods.slice(0, idx).filter(m => m === 'voucher').length;
    methodAmount = Number(paymentData?.vouchers?.[voucherIdx]?.amount) || 0;
  } else if (method === 'points') {
    methodAmount = Number(paymentData?.points?.amount) || 0;
  }
  
  // For voucher slider: compute available headroom from global usage
  let voucherHeadroom = Infinity as number;
  if (method === 'voucher') {
    try {
      const voucherIdx = formMethods.slice(0, idx).filter(m => m === 'voucher').length;
      const voucherNumber: string = paymentData?.vouchers?.[voucherIdx]?.voucherNumber || '';
      if (voucherNumber && getVoucherInitialBalance && getCurrentVoucherUsage) {
        const initial = getVoucherInitialBalance(voucherNumber);
        const used = getCurrentVoucherUsage(voucherNumber);
        const available = Math.max(0, initial - used); // already excludes current method amount
        voucherHeadroom = available; // do NOT subtract methodAmount again
      }
    } catch {}
  }

  const isComplete = isPaymentMethodComplete(itemKey, method, method === 'voucher' ? formMethods.slice(0, idx).filter(m => m === 'voucher').length : 0);

  return (
    <Paper id={`payment-method-${itemKey}-${idx}`} sx={{ 
      p: 1.5, 
      mt: 1, 
      border: 1, 
      borderColor: expanded ? '#E4DFDA' : (isComplete ? '#E4DFDA' : '#E4DFDA'), 
      bgcolor: 'white',
      position: 'relative'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: expanded ? 1 : 0 }}>
        <Box 
          sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          onClick={toggleExpanded}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleExpanded();
            }
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
            {method === 'credit' ? 'Credit Card' : method === 'voucher' ? 'UATP Voucher' : 'Points'}
          </Typography>
          {isComplete ? (
            <Tooltip title="All fields completed" arrow>
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#48A9A6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', cursor: 'help' }}>✓</Box>
            </Tooltip>
          ) : (
            <Tooltip title={getValidationMessage(method, paymentData, method === 'voucher' ? formMethods.slice(0, idx).filter(m => m === 'voucher').length : undefined)} arrow>
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#D4B483', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', cursor: 'help' }}>!</Box>
            </Tooltip>
          )}
          {!expanded && methodAmount > 0 && (
            <Box 
              sx={{ width: 200, mx: 2, ml: 'auto', flex: '0 0 auto' }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Slider
                value={methodAmount}
                min={1}
                max={(() => {
                  const amounts = getRemainingAmount(itemKey);
                  if (method === 'points') {
                    // For points, limit to available points balance
                    const pointsBalance = paymentData?.points?.balance;
                    if (pointsBalance && pointsBalance > 0) {
                      const maxFromPoints = pointsBalance / 50; // 50 points = $1
                      return Math.min(methodAmount + amounts.remaining, maxFromPoints);
                    }
                  }
                  // Default max is current amount + remaining price for the item
                  let baseMax = methodAmount + amounts.remaining;
                  // For vouchers, also cap by available voucher balance (global), already excludes current amount
                  if (method === 'voucher' && Number.isFinite(voucherHeadroom)) {
                    baseMax = Math.min(baseMax, methodAmount + Math.max(0, voucherHeadroom));
                  }
                  return baseMax;
                })()}
                step={1}
                onChange={(_e: Event, newValue: number | number[]) => {
                  const value = typeof newValue === 'number' ? newValue : newValue[0];
                  // Ensure minimum value is 1
                  const minValue = Math.max(1, value);
                  if (method === 'credit') {
                    updateMethodField(itemKey, 'credit', 'amount', minValue.toString());
                  } else if (method === 'voucher') {
                    const voucherIdx = formMethods.slice(0, idx).filter(m => m === 'voucher').length;
                    // If no headroom, do not allow increasing
                    if (Number.isFinite(voucherHeadroom) && voucherHeadroom <= 0 && minValue > methodAmount) {
                      return;
                    }
                    updateMethodField(itemKey, 'voucher', 'amount', minValue.toString(), voucherIdx);
                  } else if (method === 'points') {
                    updateMethodField(itemKey, 'points', 'amount', minValue.toString());
                    // Also update points to use based on the amount
                    const pointsToUse = Math.round(minValue * 50); // 50 points = $1
                    updateMethodField(itemKey, 'points', 'pointsToUse', pointsToUse.toString());
                  }
                }}
                size="small"
                sx={{ 
                  color: '#1B358F',
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                  },
                  '& .MuiSlider-track': {
                    height: 4,
                  },
                  '& .MuiSlider-rail': {
                    height: 4,
                    opacity: 0.3,
                  }
                }}
              />
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1B358F' }}>
            ${methodAmount.toLocaleString()}
            {method === 'points' && paymentData?.points?.pointsToUse && (
              <span style={{ fontSize: '0.8em', color: '#48A9A6', marginLeft: '8px' }}>
                ({paymentData.points.pointsToUse.toLocaleString()} pts)
              </span>
            )}
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => {
              setItemExpandedMethod(prev => {
                // If clicking on the same method, toggle it
                if (prev[itemKey] === idx) {
                  return {
                    ...prev,
                    [itemKey]: null
                  };
                } else {
                  // If clicking on a different method, close all others and open this one
                  return {
                    [itemKey]: idx
                  };
                }
              });
            }}
            sx={{ 
              color: expanded ? '#1B358F' : '#1B358F',
              '&:hover': { bgcolor: '#E4DFDA', color: 'white' }
            }}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </IconButton>
          {onCopyMethod && (
            <IconButton 
              size="small" 
              onClick={() => onCopyMethod(itemKey, method)}
              sx={{ 
                color: '#48A9A6',
                '&:hover': { bgcolor: '#E4DFDA', color: 'white' }
              }}
              title="Copy payment method to other passengers"
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton 
            size="small" 
            onClick={() => removeMethod(itemKey, idx)}
            sx={{ 
              color: '#C1666B',
              '&:hover': { bgcolor: '#E4DFDA', color: 'white' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>


      <Collapse in={expanded && method === 'credit'} timeout={300} unmountOnExit mountOnEnter>
        <PaymentMethodCreditForm 
          itemKey={itemKey} 
          paymentData={paymentData}
          updateMethodField={updateMethodField}
          getRemainingAmount={getRemainingAmount}
          getOriginalItemPrice={getOriginalItemPrice}
          getTotalPaidAmountWrapper={getTotalPaidAmountWrapper}
          setItemExpandedMethod={setItemExpandedMethod}
        />
      </Collapse>

      <Collapse in={expanded && method === 'voucher'} timeout={400} mountOnEnter>
        <PaymentMethodVoucherForm 
          itemKey={itemKey} 
          index={formMethods.slice(0, idx).filter(m => m === 'voucher').length}
          paymentData={paymentData}
          updateMethodField={updateMethodField}
          getRemainingAmount={getRemainingAmount}
          getOriginalItemPrice={getOriginalItemPrice}
          getTotalPaidAmountWrapper={getTotalPaidAmountWrapper}
          setItemExpandedMethod={setItemExpandedMethod}
          checkVoucherBalance={checkVoucherBalance}
          getVoucherBalance={getVoucherBalance}
          updateVoucherBalance={updateVoucherBalance}
          getVoucherInitialBalance={getVoucherInitialBalance}
          getCurrentVoucherUsage={getCurrentVoucherUsage}
          getVoucherUsageExcluding={getVoucherUsageExcluding}
        />
      </Collapse>

      <Collapse in={expanded && method === 'points'} timeout={400} unmountOnExit mountOnEnter>
        <PaymentMethodPointsForm 
          itemKey={itemKey} 
          paymentData={paymentData}
          updateMethodField={updateMethodField}
          getRemainingAmount={getRemainingAmount}
          getOriginalItemPrice={getOriginalItemPrice}
          getTotalPaidAmountWrapper={getTotalPaidAmountWrapper}
          setItemExpandedMethod={setItemExpandedMethod}
        />
      </Collapse>
    </Paper>
  );
}
