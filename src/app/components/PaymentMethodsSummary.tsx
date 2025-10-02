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
}

export function PaymentMethodsSummary({ itemPaymentMethods, onClearAll }: PaymentMethodsSummaryProps) {
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
          {totalPaymentMethods > 0 ? (
            <Badge badgeContent={totalPaymentMethods} color="success">
              <PaymentIcon sx={{ mr: 1, color: "success.main" }} />
            </Badge>
          ) : (
            <PaymentIcon sx={{ mr: 1, color: "success.main" }} />
          )}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
            Payment Methods
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
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
                color: 'error.main',
                border: 1,
                borderColor: 'error.main',
                width: 32,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'error.50',
                  borderColor: 'error.dark',
                },
              }}
              title="Clear All Payment Methods"
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
                <CreditCardIcon color="primary" />
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
                <CardGiftcardIcon color="secondary" />
              </ListItemIcon>
              <ListItemText primary="Vouchers" secondary="UATP vouchers" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ${totalVoucherAmount.toLocaleString()}
              </Typography>
            </ListItem>
          )}

          {totalPointsAmount > 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <StarIcon color="warning" />
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


