"use client";

import { Box, IconButton, Tooltip } from "@mui/material";
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
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1, gap: 0.5 }}>
      {(!formMethods.includes('credit')) && (
        <Tooltip title="Add Credit Card" arrow>
          <IconButton
            size="small"
            onClick={() => confirmAddMethod(itemKey, 'credit')}
            sx={{ 
              color: '#48A9A6',
              '&:hover': { bgcolor: '#E4DFDA', color: 'white' },
              border: 1,
              borderColor: '#48A9A6',
              width: 28,
              height: 28,
              p: 0
            }}
          >
            <CreditCardIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      )}
      {formMethods.filter(m => m === 'voucher').length < 2 && (
        <Tooltip title="Add UATP Voucher" arrow>
          <IconButton
            size="small"
            onClick={() => confirmAddMethod(itemKey, 'voucher')}
            sx={{ 
              color: '#D4B483',
              '&:hover': { bgcolor: '#E4DFDA', color: 'white' },
              border: 1,
              borderColor: '#D4B483',
              width: 28,
              height: 28,
              p: 0
            }}
          >
            <CardGiftcardIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      )}
      {(!formMethods.includes('points')) && (
        <Tooltip title="Add Points" arrow>
          <IconButton
            size="small"
            onClick={() => confirmAddMethod(itemKey, 'points')}
            sx={{ 
              color: '#48A9A6',
              '&:hover': { bgcolor: '#E4DFDA', color: 'white' },
              border: 1,
              borderColor: '#48A9A6',
              width: 28,
              height: 28,
              p: 0
            }}
          >
            <StarIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
