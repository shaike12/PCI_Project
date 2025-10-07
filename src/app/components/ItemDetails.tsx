"use client";

import { Box, Paper, Typography, Chip, IconButton, Tooltip } from "@mui/material";
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
  checkVoucherBalance?: (voucherNumber: string) => Promise<number>;
  getVoucherBalance?: (voucherNumber: string) => number;
  updateVoucherBalance?: (voucherNumber: string, usedAmount: number) => void;
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
  getGeneratedNumber,
  checkVoucherBalance,
  getVoucherBalance,
  updateVoucherBalance
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
                <Tooltip title="Add Credit Card" arrow>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (process.env.NODE_ENV !== 'production') {
                        console.log('[UI] add credit click', { itemKey });
                      }
                      confirmAddMethod(itemKey, 'credit');
                      // Defer expand to next tick to allow first mount to animate
                      setTimeout(() => {
                        if (process.env.NODE_ENV !== 'production') {
                          console.log('[UI] expand credit index 0', { itemKey });
                        }
                        setItemExpandedMethod((prev) => ({ ...prev, [itemKey]: 0 }));
                      }, 0);
                    }}
                    sx={{ 
                      color: '#1B358F',
                      '&:hover': { bgcolor: '#1B358F', color: 'white' },
                      border: 1,
                      borderColor: '#1B358F',
                      width: 32,
                      height: 32
                    }}
                  >
                    <CreditCardIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
              {formMethods.filter(m => m === 'voucher').length < 2 && (
                <Tooltip title="Add UATP Voucher" arrow>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const currentVoucherCount = formMethods.slice(0).filter(m => m === 'voucher').length;
                      if (process.env.NODE_ENV !== 'production') {
                        console.log('[UI] add voucher click', { itemKey, currentVoucherCountBefore: currentVoucherCount });
                      }
                      confirmAddMethod(itemKey, 'voucher');
                      // New voucher will be appended, expand its index after state updates
                      setTimeout(() => {
                        if (process.env.NODE_ENV !== 'production') {
                          console.log('[UI] expand voucher at index', { itemKey, index: currentVoucherCount });
                        }
                        setItemExpandedMethod((prev) => ({ ...prev, [itemKey]: currentVoucherCount }));
                      }, 0);
                    }}
                    sx={{ 
                      color: '#D4B483',
                      '&:hover': { bgcolor: '#D4B483', color: 'white' },
                      border: 1,
                      borderColor: '#D4B483',
                      width: 32,
                      height: 32
                    }}
                  >
                    <CardGiftcardIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
              {(!formMethods.includes('points')) && (
                <Tooltip title="Add Points" arrow>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (process.env.NODE_ENV !== 'production') {
                        console.log('[UI] add points click', { itemKey });
                      }
                      confirmAddMethod(itemKey, 'points');
                      // Expand the points form (index 0) after state updates
                      setTimeout(() => {
                        if (process.env.NODE_ENV !== 'production') {
                          console.log('[UI] expand points index 0', { itemKey });
                        }
                        setItemExpandedMethod((prev) => ({ ...prev, [itemKey]: 0 }));
                      }, 0);
                    }}
                    sx={{ 
                      color: '#48A9A6',
                      '&:hover': { bgcolor: '#48A9A6', color: 'white' },
                      border: 1,
                      borderColor: '#48A9A6',
                      width: 32,
                      height: 32
                    }}
                  >
                    <StarIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        })()}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1B358F' }}>
            ${(price || 0).toLocaleString()}
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
              {formMethods.map((method, idx) => {
                const isExpanded = itemExpandedMethod[itemKey] === idx;
                if (process.env.NODE_ENV !== 'production') {
                  try { console.log('[LIST] method row', { itemKey, idx, method, isExpanded }); } catch {}
                }
                return (
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
                  checkVoucherBalance={checkVoucherBalance}
                  getVoucherBalance={getVoucherBalance}
                  updateVoucherBalance={updateVoucherBalance}
                />);
              })}

            </Box>
          );
        }
        return null;
      })()}
    </Paper>
  );
}
