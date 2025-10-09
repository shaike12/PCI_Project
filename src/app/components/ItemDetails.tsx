"use client";

import { useState } from "react";
import { Box, Paper, Typography, Chip, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import FlightIcon from "@mui/icons-material/Flight";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import LuggageIcon from "@mui/icons-material/Luggage";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import StarIcon from "@mui/icons-material/Star";
import AddIcon from "@mui/icons-material/Add";
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
  getVoucherInitialBalance?: (voucherNumber: string) => number;
  getCurrentVoucherUsage?: (voucherNumber: string) => number;
  getVoucherUsageExcluding?: (voucherNumber: string, excludeItemKey: string, excludeVoucherIndex: number) => number;
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
  ,getVoucherInitialBalance
  ,getCurrentVoucherUsage
  ,getVoucherUsageExcluding
}: ItemDetailsProps) {
  const amounts = getRemainingAmount(itemKey);
  const showAlways = true;
  
  // State for payment method selection menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddMethod = (method: 'credit' | 'voucher' | 'points') => {
    confirmAddMethod(itemKey, method);
    handleClose();
    
    // Expand the new method after state updates
    setTimeout(() => {
      // First, collapse all other forms for this item
      setItemExpandedMethod((prev) => {
        const newExpanded = { ...prev };
        // Close all forms for this item
        newExpanded[itemKey] = null;
        return newExpanded;
      });
      
      // Then expand the new method
      setTimeout(() => {
        if (method === 'credit') {
          setItemExpandedMethod((prev) => ({ ...prev, [itemKey]: 0 }));
        } else if (method === 'voucher') {
          // Calculate the index of the new voucher (it will be the last voucher in the array)
          const currentVoucherCount = formMethods.filter(m => m === 'voucher').length;
          const newVoucherIndex = formMethods.length; // The new voucher will be at the end
          setItemExpandedMethod((prev) => ({ ...prev, [itemKey]: newVoucherIndex }));
        } else if (method === 'points') {
          // Calculate the index of the new points (it will be at the end of the array)
          const newPointsIndex = formMethods.length; // The new points will be at the end
          setItemExpandedMethod((prev) => ({ ...prev, [itemKey]: newPointsIndex }));
        }
      }, 50); // Small delay to ensure the collapse happens first
    }, 0);
  };

  return (
    <Paper key={itemKey} sx={{ 
      p: 2, 
      mb: 2, 
      border: 1, 
      borderColor: '#E4DFDA', 
      bgcolor: 'white',
      animation: 'slideIn 0.3s ease-out',
      position: 'relative' // Add relative positioning for absolute children
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: 'medium', color }}>
            {title}
          </Typography>
        </Box>
        
        {/* Payment Method Icons */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5,
          minWidth: '120px', // Fixed width to ensure consistent positioning
          justifyContent: 'flex-end', // Align icons to the right side of this container
          position: 'absolute',
          top: 16, // align with card's padding top (p:2 => 16px)
          right: '40%'
        }}>
          {/* Show active payment method icons */}
          {formMethods.map((method, index) => {
            if (method === 'credit') {
              return (
                <Tooltip key={`${method}-${index}`} title="Credit Card" arrow>
                  <IconButton size="small" sx={{ width: 28, height: 28, p: 0 }}>
                    <CreditCardIcon sx={{ fontSize: 20, color: '#1B358F' }} />
                  </IconButton>
                </Tooltip>
              );
            } else if (method === 'voucher') {
              return (
                <Tooltip key={`${method}-${index}`} title="UATP Voucher" arrow>
                  <IconButton size="small" sx={{ width: 28, height: 28, p: 0 }}>
                    <CardGiftcardIcon sx={{ fontSize: 20, color: '#48A9A6' }} />
                  </IconButton>
                </Tooltip>
              );
            } else if (method === 'points') {
              return (
                <Tooltip key={`${method}-${index}`} title="Points" arrow>
                  <IconButton size="small" sx={{ width: 28, height: 28, p: 0 }}>
                    <StarIcon sx={{ fontSize: 20, color: '#D4B483' }} />
                  </IconButton>
                </Tooltip>
              );
            }
            return null;
          })}
          
          {/* Add payment method button */}
          {formMethods.length < 3 && !isItemFullyPaid(itemKey) && (
            <Tooltip title="Add Payment Method" arrow>
              <IconButton
                size="small"
                onClick={handleClick}
                sx={{ 
                  color: '#1B358F',
                  '&:hover': { bgcolor: '#1B358F', color: 'white' },
                  border: 1,
                  borderColor: '#1B358F',
                  width: 28,
                  height: 28,
                  p: 0
                }}
              >
                <AddIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
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
                  getVoucherInitialBalance={getVoucherInitialBalance}
                  getCurrentVoucherUsage={getCurrentVoucherUsage}
                  getVoucherUsageExcluding={getVoucherUsageExcluding}
                />);
              })}

            </Box>
          );
        }
        return null;
      })()}
      
      {/* Payment Method Selection Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {!formMethods.includes('credit') && (
          <MenuItem onClick={() => handleAddMethod('credit')}>
            <ListItemIcon>
              <CreditCardIcon sx={{ color: '#1B358F' }} />
            </ListItemIcon>
            <ListItemText>Credit Card</ListItemText>
          </MenuItem>
        )}
        {formMethods.filter(m => m === 'voucher').length < 2 && (
          <MenuItem onClick={() => handleAddMethod('voucher')}>
            <ListItemIcon>
              <CardGiftcardIcon sx={{ color: '#48A9A6' }} />
            </ListItemIcon>
            <ListItemText>UATP Voucher</ListItemText>
          </MenuItem>
        )}
        {!formMethods.includes('points') && (
          <MenuItem onClick={() => handleAddMethod('points')}>
            <ListItemIcon>
              <StarIcon sx={{ color: '#D4B483' }} />
            </ListItemIcon>
            <ListItemText>Points</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
}
