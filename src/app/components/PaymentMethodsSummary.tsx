"use client";

import { Accordion, AccordionDetails, AccordionSummary, Badge, Box, IconButton, List, ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PaymentIcon from "@mui/icons-material/Payment";
import DeleteIcon from "@mui/icons-material/Delete";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import StarIcon from "@mui/icons-material/Star";

type Credit = { amount: number };
type Voucher = { amount: number };
type Points = { amount: number; pointsToUse?: number };

type MethodsForItem = {
  credit?: Credit;
  vouchers?: Voucher[];
  points?: Points;
};

export type ItemPaymentMethods = Record<string, MethodsForItem>;

interface PaymentMethodsSummaryProps {
  itemPaymentMethods: ItemPaymentMethods;
  onClearAll: () => void;
  onClearAllData?: () => void;
}

export function PaymentMethodsSummary({ itemPaymentMethods, onClearAll, onClearAllData }: PaymentMethodsSummaryProps) {
  let totalCreditAmount = 0;
  let totalVoucherAmount = 0;
  let totalPointsAmount = 0;
  let totalPointsUsed = 0;
  let totalPaymentMethods = 0;

  Object.values(itemPaymentMethods).forEach((methods) => {
    if (methods.credit) {
      totalCreditAmount += methods.credit.amount;
      totalPaymentMethods++;
    }
    if (methods.vouchers) {
      methods.vouchers.forEach((voucher) => {
        totalVoucherAmount += voucher.amount;
        totalPaymentMethods++;
      });
    }
    if (methods.points) {
      totalPointsAmount += methods.points.amount;
      totalPointsUsed += methods.points.pointsToUse || 0;
      totalPaymentMethods++;
    }
  });

  const totalPaymentAmount = totalCreditAmount + totalVoucherAmount + totalPointsAmount;

  if (totalPaymentMethods === 0) return null;

  return (
    <Accordion sx={{ mb: 2, boxShadow: "none", border: "1px solid", borderColor: "divider" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
            <PaymentIcon sx={{ color: "#48A9A6" }} />
            {totalPaymentMethods > 0 && (
              <Typography variant="caption" sx={{ 
                ml: 0.5, 
                color: "#48A9A6", 
                fontWeight: "bold",
                backgroundColor: "#E4DFDA",
                borderRadius: "50%",
                width: 18,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem"
              }}>
                {totalPaymentMethods}
              </Typography>
            )}
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
            Payment Methods
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#48A9A6" }}>
            ${totalPaymentAmount.toLocaleString()}
          </Typography>
          {totalPaymentMethods > 0 && (
            <Box
              component="div"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onClearAll();
                }
              }}
              sx={{
                ml: 2,
                color: '#C1666B',
                border: 1,
                borderColor: '#C1666B',
                width: 32,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'error.50',
                  borderColor: '#a04a4f',
                },
              }}
              title="Clear All Payment Methods"
            >
              <DeleteIcon fontSize="small" />
            </Box>
          )}
          {onClearAllData && (
            <Box
              onClick={onClearAllData}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onClearAllData();
                }
              }}
              sx={{
                ml: 1,
                color: '#D4B483',
                border: 1,
                borderColor: '#D4B483',
                width: 32,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'warning.50',
                  borderColor: '#c19f5f',
                },
              }}
              title="Clear All Data (including incorrect data)"
            >
              <DeleteIcon fontSize="small" />
            </Box>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <List dense>
          {totalCreditAmount > 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CreditCardIcon sx={{ color: '#1B358F' }} />
              </ListItemIcon>
              <ListItemText primary="Credit Card" secondary="Visa, Mastercard, Amex" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ${totalCreditAmount.toLocaleString()}
              </Typography>
            </ListItem>
          )}

          {totalVoucherAmount > 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CardGiftcardIcon sx={{ color: '#48A9A6' }} />
              </ListItemIcon>
              <ListItemText primary="UATP Voucher" secondary="UATP vouchers" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ${totalVoucherAmount.toLocaleString()}
              </Typography>
            </ListItem>
          )}

          {totalPointsAmount > 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <StarIcon sx={{ color: '#D4B483' }} />
              </ListItemIcon>
              <ListItemText primary="Points" secondary={`${totalPointsUsed.toLocaleString()} points (50 points = $1)`} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ${totalPointsAmount.toLocaleString()}
              </Typography>
            </ListItem>
          )}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}


