"use client";

import { Box, Paper, Typography, Chip } from "@mui/material";
import FlightIcon from "@mui/icons-material/Flight";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import LuggageIcon from "@mui/icons-material/Luggage";
import { PaymentMethodCard } from "./PaymentMethodCard";
import { PaymentMethodButtons } from "./PaymentMethodButtons";

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
  isItemFullyPaid: (itemKey: string) => boolean;
  isPaymentMethodComplete: (itemKey: string, method: 'credit' | 'voucher' | 'points', voucherIndex: number) => boolean;
  updateMethodField: (itemKey: string, method: 'credit' | 'voucher' | 'points', field: string, value: string, voucherIndex?: number) => void;
  setItemExpandedMethod: (updater: (prev: { [key: string]: number | null }) => { [key: string]: number | null }) => void;
  removeMethod: (itemKey: string, formIndex: number) => void;
  confirmAddMethod: (itemKey: string, method: 'credit' | 'voucher' | 'points') => void;
  onCopyMethod?: (itemKey: string, method: 'credit' | 'voucher' | 'points') => void;
}

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
  isItemFullyPaid,
  isPaymentMethodComplete,
  updateMethodField,
  setItemExpandedMethod,
  removeMethod,
  confirmAddMethod,
  onCopyMethod
}: ItemDetailsProps) {
  const amounts = getRemainingAmount(itemKey);
  const showAlways = true;

  return (
    <Paper key={itemKey} sx={{ 
      p: 2, 
      mb: 2, 
      border: 1, 
      borderColor: 'grey.300', 
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            ${price.toLocaleString()}
          </Typography>
          {isItemFullyPaid(itemKey) ? (
            <Chip 
              label="Paid" 
              color="success" 
              size="small" 
              sx={{ fontWeight: 'bold' }}
            />
          ) : (
            <Chip 
              label={`$${amounts.remaining} remaining`} 
              color="warning" 
              size="small" 
              sx={{ fontWeight: 'bold' }}
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
                  setItemExpandedMethod={setItemExpandedMethod}
                  removeMethod={removeMethod}
                  onCopyMethod={onCopyMethod}
                />
              ))}

              <PaymentMethodButtons
                itemKey={itemKey}
                formMethods={formMethods}
                isItemFullyPaid={isItemFullyPaid}
                confirmAddMethod={confirmAddMethod}
              />
            </Box>
          );
        }
        return null;
      })()}
    </Paper>
  );
}
