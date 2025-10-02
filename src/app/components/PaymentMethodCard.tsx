"use client";

import { Box, Paper, Typography, IconButton, Slider } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { PaymentMethodCreditForm } from "./PaymentMethodCreditForm";
import { PaymentMethodVoucherForm } from "./PaymentMethodVoucherForm";
import { PaymentMethodPointsForm } from "./PaymentMethodPointsForm";

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
  setItemExpandedMethod: (updater: (prev: { [key: string]: number | null }) => { [key: string]: number | null }) => void;
  removeMethod: (itemKey: string, formIndex: number) => void;
  onCopyMethod?: (itemKey: string, method: 'credit' | 'voucher' | 'points') => void;
}

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
  setItemExpandedMethod,
  removeMethod,
  onCopyMethod
}: PaymentMethodCardProps) {
  const expanded = itemExpandedMethod[itemKey] === idx;
  
  let methodAmount = 0;
  if (method === 'credit') {
    methodAmount = Number(paymentData?.credit?.amount) || 0;
  } else if (method === 'voucher') {
    const voucherIdx = formMethods.slice(0, idx).filter(m => m === 'voucher').length;
    methodAmount = Number(paymentData?.vouchers?.[voucherIdx]?.amount) || 0;
  } else if (method === 'points') {
    methodAmount = Number(paymentData?.points?.amount) || 0;
  }
  
  const isComplete = isPaymentMethodComplete(itemKey, method, method === 'voucher' ? formMethods.slice(0, idx).filter(m => m === 'voucher').length : 0);

  return (
    <Paper sx={{ 
      p: 1.5, 
      mt: 1, 
      border: 1, 
      borderColor: expanded ? 'primary.light' : (isComplete ? 'success.light' : 'warning.light'), 
      bgcolor: expanded ? 'white' : (isComplete ? 'success.50' : 'warning.50'),
      position: 'relative'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: expanded ? 1 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
            {method === 'credit' ? 'Credit Card' : method === 'voucher' ? 'UATP Voucher' : 'Points'}
          </Typography>
          {isComplete ? (
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</Box>
          ) : (
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'warning.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>!</Box>
          )}
          {!expanded && methodAmount > 0 && (
            <Box sx={{ flex: 1, mx: 2 }}>
              <Slider
                value={methodAmount}
                min={0}
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
                  return methodAmount + amounts.remaining;
                })()}
                step={1}
                onChange={(_e: Event, newValue: number | number[]) => {
                  const value = typeof newValue === 'number' ? newValue : newValue[0];
                  if (method === 'credit') {
                    updateMethodField(itemKey, 'credit', 'amount', value.toString());
                  } else if (method === 'voucher') {
                    const voucherIdx = formMethods.slice(0, idx).filter(m => m === 'voucher').length;
                    updateMethodField(itemKey, 'voucher', 'amount', value.toString(), voucherIdx);
                  } else if (method === 'points') {
                    updateMethodField(itemKey, 'points', 'amount', value.toString());
                  }
                }}
                size="small"
                sx={{ 
                  color: 'primary.main',
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
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            ${methodAmount.toLocaleString()}
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
              color: expanded ? 'primary.main' : 'text.secondary',
              '&:hover': { bgcolor: 'primary.light', color: 'white' }
            }}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </IconButton>
          {onCopyMethod && (
            <IconButton 
              size="small" 
              onClick={() => onCopyMethod(itemKey, method)}
              sx={{ 
                color: 'info.main',
                '&:hover': { bgcolor: 'info.light', color: 'white' }
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
              color: 'error.main',
              '&:hover': { bgcolor: 'error.light', color: 'white' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>


      {expanded && method === 'credit' && (
        <PaymentMethodCreditForm 
          itemKey={itemKey} 
          paymentData={paymentData}
          updateMethodField={updateMethodField}
          getRemainingAmount={getRemainingAmount}
        />
      )}

      {expanded && method === 'voucher' && (
        <PaymentMethodVoucherForm 
          itemKey={itemKey} 
          index={formMethods.slice(0, idx).filter(m => m === 'voucher').length}
          paymentData={paymentData}
          updateMethodField={updateMethodField}
          getRemainingAmount={getRemainingAmount}
        />
      )}

      {expanded && method === 'points' && (
        <PaymentMethodPointsForm 
          itemKey={itemKey} 
          paymentData={paymentData}
          updateMethodField={updateMethodField}
          getRemainingAmount={getRemainingAmount}
        />
      )}
    </Paper>
  );
}
