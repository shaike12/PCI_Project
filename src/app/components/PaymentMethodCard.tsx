"use client";

import { Box, Paper, Typography, IconButton, Slider } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
  removeMethod
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
            {method === 'credit' ? 'Credit Card' : method === 'voucher' ? 'Voucher' : 'Points'}
          </Typography>
          {isComplete ? (
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</Box>
          ) : (
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'warning.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>!</Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            ${methodAmount.toLocaleString()}
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => {
              setItemExpandedMethod(prev => ({
                ...prev,
                [itemKey]: prev[itemKey] === idx ? null : idx
              }));
            }}
            sx={{ 
              color: expanded ? 'primary.main' : 'text.secondary',
              '&:hover': { bgcolor: 'primary.light', color: 'white' }
            }}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </IconButton>
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

      {!expanded && methodAmount > 0 && (
        <Box sx={{ mt: 2, px: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 50 }}>Amount</Typography>
            <Slider
              value={methodAmount}
              min={0}
              max={(() => {
                const amounts = getRemainingAmount(itemKey);
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
                  const pointsToUse = value * 50;
                  updateMethodField(itemKey, 'points', 'amount', value.toString());
                  updateMethodField(itemKey, 'points', 'pointsToUse', pointsToUse.toString());
                }
              }}
              valueLabelDisplay="auto"
              valueLabelFormat={(value: number) => `$${value}`}
              sx={{ flex: 1 }}
            />
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: 50, textAlign: 'right' }}>
              ${methodAmount}
            </Typography>
          </Box>
        </Box>
      )}

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
