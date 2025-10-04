"use client";

import { Box, Paper, Typography, Chip, IconButton } from "@mui/material";
import FlightIcon from "@mui/icons-material/Flight";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import LuggageIcon from "@mui/icons-material/Luggage";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import StarIcon from "@mui/icons-material/Star";
import { PaymentMethodCard } from "./PaymentMethodCard";
import { validateCreditCard } from "../utils/paymentLogic";

interface ItemDetailsProps {
  itemKey: string;
  itemType: string;
  title: string;
  price: number;
  color: string;
  icon: React.ReactNode;
  formMethods: string[];
  paymentData: any;
  itemExpandedMethod: { [key: string]: number | null };
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number };
  getOriginalItemPrice: (itemKey: string) => number;
  getTotalPaidAmountWrapper: (itemKey: string) => number;
  isItemFullyPaid: (itemKey: string) => boolean;
  isPaymentMethodComplete: (itemKey: string, method: 'credit' | 'voucher' | 'points', voucherIndex: number) => boolean;
  updateMethodField: (itemKey: string, method: 'credit' | 'voucher' | 'points', field: string, value: string, voucherIndex?: number) => void;
  setItemExpandedMethod: (updater: (prev: { [key: string]: number | null }) => { [key: string]: number | null }) => void;
  removeMethod: (itemKey: string, formIndex: number) => void;
  confirmAddMethod: (itemKey: string, method: 'credit' | 'voucher' | 'points') => void;
  onCopyMethod?: (itemKey: string, method: 'credit' | 'voucher' | 'points') => void;
  getGeneratedNumber?: (itemKey: string) => string | null;
}

// Function to check if all payment methods are properly filled
const areAllPaymentMethodsComplete = (formMethods: string[], paymentData: any): boolean => {
  if (formMethods.length === 0) return false;
  
  return formMethods.every(method => {
    if (method === 'credit') {
      const credit = paymentData?.credit;
      return credit && 
             credit.cardNumber && 
             validateCreditCard(credit.cardNumber) &&
             credit.holderName && 
             credit.expiryDate && 
             credit.cvv && 
             credit.amount && 
             parseFloat(credit.amount) > 0;
    } else if (method === 'voucher') {
      const vouchers = paymentData?.vouchers || [];
      const voucherIndex = formMethods.slice(0, formMethods.indexOf(method)).filter(m => m === 'voucher').length;
      const voucher = vouchers[voucherIndex];
      return voucher && 
             voucher.voucherNumber && 
             voucher.expiryDate && 
             voucher.amount && 
             parseFloat(voucher.amount) > 0;
    } else if (method === 'points') {
      const points = paymentData?.points;
      return points && 
             points.memberNumber && 
             points.awardReference && 
             points.amount && 
             parseFloat(points.amount) > 0;
    }
    return false;
  });
};

export function ItemDetails({
  itemKey,
  itemType,
  title,
  price,
  color,
  icon,
  formMethods,
  paymentData,
  itemExpandedMethod,
  getRemainingAmount,
  getOriginalItemPrice,
  getTotalPaidAmountWrapper,
  isItemFullyPaid,
  isPaymentMethodComplete,
  updateMethodField,
  setItemExpandedMethod,
  removeMethod,
  confirmAddMethod,
  onCopyMethod,
  getGeneratedNumber
}: ItemDetailsProps) {
  const amounts = getRemainingAmount(itemKey);
  const showAlways = true;

  return (
    <Paper key={itemKey} sx={{ 
      p: 2, 
      mb: 2, 
      border: 1, 
      borderColor: '#E4DFDA', 
      bgcolor: 'white',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: 'medium', color }}>
            {title}
          </Typography>
        </Box>
        
        {/* Payment Method Add Buttons - Between title and price */}
        {(() => {
          const showInitialButtons = formMethods.length === 0 && !isItemFullyPaid(itemKey);
          const showAdditionalButtons = formMethods.length >= 1 && formMethods.length < 3 && !isItemFullyPaid(itemKey);
          
          if (!showInitialButtons && !showAdditionalButtons) {
            return null;
          }

          return (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {(!formMethods.includes('credit')) && (
                <IconButton
                  size="small"
                  onClick={() => confirmAddMethod(itemKey, 'credit')}
                  sx={{ 
                    color: '#1B358F',
                    '&:hover': { bgcolor: '#1B358F', color: 'white' },
                    border: 1,
                    borderColor: '#1B358F',
                    width: 32,
                    height: 32
                  }}
                  title="Add Credit Card"
                >
                  <CreditCardIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              {formMethods.filter(m => m === 'voucher').length < 2 && (
                <IconButton
                  size="small"
                  onClick={() => confirmAddMethod(itemKey, 'voucher')}
                  sx={{ 
                    color: '#D4B483',
                    '&:hover': { bgcolor: '#D4B483', color: 'white' },
                    border: 1,
                    borderColor: '#D4B483',
                    width: 32,
                    height: 32
                  }}
                  title="Add UATP Voucher"
                >
                  <CardGiftcardIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              {(!formMethods.includes('points')) && (
                <IconButton
                  size="small"
                  onClick={() => confirmAddMethod(itemKey, 'points')}
                  sx={{ 
                    color: '#48A9A6',
                    '&:hover': { bgcolor: '#48A9A6', color: 'white' },
                    border: 1,
                    borderColor: '#48A9A6',
                    width: 32,
                    height: 32
                  }}
                  title="Add Points"
                >
                  <StarIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          );
        })()}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1B358F' }}>
            ${price.toLocaleString()}
          </Typography>
          {isItemFullyPaid(itemKey) ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label="Complete" 
                sx={{
                  backgroundColor: areAllPaymentMethodsComplete(formMethods, paymentData) ? '#48A9A6' : '#D4B483',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                size="small"
              />
              {getGeneratedNumber && getGeneratedNumber(itemKey) && (
                <Chip 
                  label={getGeneratedNumber(itemKey)} 
                  sx={{ 
                    backgroundColor: '#48A9A6', 
                    color: 'white',
                    fontWeight: 'bold', 
                    fontSize: '0.75rem' 
                  }} 
                  size="small"
                />
              )}
            </Box>
          ) : (
            <Chip 
              label={`$${amounts.remaining.toFixed(2)} remaining`} 
              sx={{ 
                fontWeight: 'bold',
                backgroundColor: '#D4B483',
                color: 'white'
              }}
              size="small"
            />
          )}
        </Box>
      </Box>

      {(() => {
        const amounts = getRemainingAmount(itemKey);
        const showAlways = true;
        
        if (showAlways || amounts.remaining > 0) {
          return (
            <Box>
              {formMethods.map((method, idx) => (
                <PaymentMethodCard
                  key={`${itemKey}-method-${idx}`}
                  itemKey={itemKey}
                  method={method as 'credit' | 'voucher' | 'points'}
                  idx={idx}
                  formMethods={formMethods}
                  paymentData={paymentData}
                  itemExpandedMethod={itemExpandedMethod}
                  isPaymentMethodComplete={isPaymentMethodComplete}
                  updateMethodField={updateMethodField}
                  getRemainingAmount={getRemainingAmount}
                  getOriginalItemPrice={getOriginalItemPrice}
                  getTotalPaidAmountWrapper={getTotalPaidAmountWrapper}
                  setItemExpandedMethod={setItemExpandedMethod}
                  removeMethod={removeMethod}
                  onCopyMethod={onCopyMethod}
                />
              ))}

            </Box>
          );
        }
        return null;
      })()}
    </Paper>
  );
}
