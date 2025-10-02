"use client";

import { Box, IconButton } from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import StarIcon from "@mui/icons-material/Star";

interface PaymentMethodButtonsProps {
  itemKey: string;
  formMethods: string[];
  isItemFullyPaid: (itemKey: string) => boolean;
  confirmAddMethod: (itemKey: string, method: 'credit' | 'voucher' | 'points') => void;
}

export function PaymentMethodButtons({
  itemKey,
  formMethods,
  isItemFullyPaid,
  confirmAddMethod
}: PaymentMethodButtonsProps) {
  // Show buttons when no methods exist and item isn't fully paid
  const showInitialButtons = formMethods.length === 0 && !isItemFullyPaid(itemKey);
  
  // Show additional buttons when there are existing methods but item isn't fully paid
  const showAdditionalButtons = formMethods.length >= 1 && formMethods.length < 3 && !isItemFullyPaid(itemKey);

  if (!showInitialButtons && !showAdditionalButtons) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 0.5 }}>
      {(!formMethods.includes('credit')) && (
        <IconButton
          size="small"
          onClick={() => confirmAddMethod(itemKey, 'credit')}
          sx={{ 
            color: 'success.main',
            '&:hover': { bgcolor: 'success.light', color: 'white' },
            border: 1,
            borderColor: 'success.main',
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
            color: 'warning.main',
            '&:hover': { bgcolor: 'warning.light', color: 'white' },
            border: 1,
            borderColor: 'warning.main',
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
            color: 'info.main',
            '&:hover': { bgcolor: 'info.light', color: 'white' },
            border: 1,
            borderColor: 'info.main',
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
}
