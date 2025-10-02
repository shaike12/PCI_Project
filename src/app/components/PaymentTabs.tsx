"use client";

import { Box, Paper, Tabs, Tab, Typography, IconButton, Slider } from "@mui/material";
import type { ReactNode } from "react";
import FlightIcon from "@mui/icons-material/Flight";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import LuggageIcon from "@mui/icons-material/Luggage";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import StarIcon from "@mui/icons-material/Star";
import type { Reservation } from "@/types/reservation";
import { PaymentMethodCreditForm } from "./PaymentMethodCreditForm";
import { PaymentMethodVoucherForm } from "./PaymentMethodVoucherForm";
import { PaymentMethodPointsForm } from "./PaymentMethodPointsForm";

interface PaymentTabsProps {
  selectedItems: { [passengerId: string]: string[] };
  activePaymentPassenger: string | null;
  setActivePaymentPassenger: (pid: string) => void;
  reservation: Reservation;

  itemMethodForms: { [itemKey: string]: ("credit" | "voucher" | "points")[] };
  itemPaymentMethods: any;
  itemExpandedMethod: { [key: string]: number | null };

  getPassengerTabLabel: (pid: string) => ReactNode;
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number };
  isItemFullyPaid: (itemKey: string) => boolean;
  confirmAddMethod: (itemKey: string, method: "credit" | "voucher" | "points") => void;
  isPaymentMethodComplete: (itemKey: string, method: "credit" | "voucher" | "points", voucherIndex: number) => boolean;
  updateMethodField: (itemKey: string, method: "credit" | "voucher" | "points", field: string, value: string, voucherIndex?: number) => void;
  setItemExpandedMethod: (updater: (prev: { [key: string]: number | null }) => { [key: string]: number | null }) => void;
  removeMethod: (itemKey: string, formIndex: number) => void;
}

export function PaymentTabs(props: PaymentTabsProps) {
  const {
    selectedItems,
    activePaymentPassenger,
    setActivePaymentPassenger,
    reservation,
    itemMethodForms,
    itemPaymentMethods,
    itemExpandedMethod,
    getPassengerTabLabel,
    getRemainingAmount,
    isItemFullyPaid,
    confirmAddMethod,
    isPaymentMethodComplete,
    updateMethodField,
    setItemExpandedMethod,
    removeMethod,
  } = props;

  // Safely resolve a passenger index
  const resolvePassengerIndex = (passengerId: string): number => {
    if (!passengerId) return -1;
    if (/^\d+$/.test(passengerId)) {
      const idx = Number(passengerId) - 1;
      return reservation.passengers[idx] ? idx : -1;
    }
    const match = passengerId.match(/\d+/);
    if (match) {
      const idx = Number(match[0]) - 1;
      return reservation.passengers[idx] ? idx : -1;
    }
    return -1;
  };

  const tabIds = Object.entries(selectedItems)
    .filter(([pid, items]) => {
      if (!items || items.length === 0) return false;
      const idx = resolvePassengerIndex(pid);
      const p = idx >= 0 ? reservation.passengers[idx] : undefined;
      if (!p) return false;
      const hasUnpaid = p.ticket.status !== 'Paid' || p.ancillaries.seat.status !== 'Paid' || p.ancillaries.bag.status !== 'Paid';
      return hasUnpaid;
    })
    .map(([pid]) => pid);

  const tabsValue = tabIds.includes(activePaymentPassenger || '') ? (activePaymentPassenger as string) : (tabIds[0] ?? false);

  if (Object.values(selectedItems).flat().length === 0) return null;

  return (
    <Box sx={{ mb: 2, minHeight: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Tabs
        value={tabsValue}
        onChange={(_, v) => setActivePaymentPassenger(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {tabIds.map((pid) => (
          <Tab 
            key={pid}
            value={pid}
            label={getPassengerTabLabel(pid)}
            sx={{
              transition: 'all 0.3s ease-in-out',
              '&.Mui-selected': {
                backgroundColor: 'primary.50',
                color: 'primary.main',
                fontWeight: 600,
                borderRadius: 1,
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)'
              },
              '&:hover': {
                backgroundColor: 'grey.50',
                transform: 'translateY(-1px)'
              }
            }}
          />
        ))}
      </Tabs>

      {typeof tabsValue === 'string' && tabsValue !== '' && (
        <Paper sx={{ 
          p: 2, 
          mt: 2, 
          border: 1, 
          borderColor: 'grey.300', 
          bgcolor: 'white', 
          minHeight: 0, 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease-out',
          transition: 'all 0.3s ease-in-out'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, overflowY: 'auto', pr: 1 }}>
            {(selectedItems[tabsValue] || []).map((itemType) => {
              const pIndex = resolvePassengerIndex(tabsValue);
              const p = pIndex >= 0 ? reservation.passengers[pIndex] : undefined;
              if (!p) return null;
              let title = '';
              let price = 0;
              let color: any = 'primary.main';
              let icon: any = <FlightIcon sx={{ fontSize: 18, mr: 1 }} />;
              if (itemType === 'ticket') {
                title = 'Flight Ticket';
                price = p.ticket.price;
                color = 'success.main';
                icon = <FlightIcon sx={{ fontSize: 18, mr: 1 }} />;
              } else if (itemType === 'seat') {
                title = 'Seat Selection';
                price = p.ancillaries.seat.price;
                color = 'info.main';
                icon = <EventSeatIcon sx={{ fontSize: 18, mr: 1 }} />;
              } else if (itemType === 'bag') {
                title = 'Baggage';
                price = p.ancillaries.bag.price;
                color = 'warning.main';
                icon = <LuggageIcon sx={{ fontSize: 18, mr: 1 }} />;
              }

              const itemKey = `${tabsValue}-${itemType}`;
              const formMethods = itemMethodForms[itemKey] || [];
              const paymentData = itemPaymentMethods[itemKey] || {};

              return (
                <Paper key={`${tabsValue}-${itemType}`} sx={{ p: 1.5, border: 1, borderColor: 'grey.200' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {icon}
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {title}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color }}>
                        ${price.toLocaleString()}
                      </Typography>
                      {(() => {
                        const amounts = getRemainingAmount(itemKey);
                        const showAlways = true;
                        if (showAlways || amounts.paid > 0) {
                          return (
                            <Typography variant="caption" sx={{ 
                              color: amounts.remaining > 0 ? 'warning.main' : 'success.main',
                              fontWeight: 'medium'
                            }}>
                              {amounts.remaining > 0 
                                ? `Remaining: $${amounts.remaining.toLocaleString()}` 
                                : 'Fully Paid'
                              }
                            </Typography>
                          );
                        }
                        return null;
                      })()}
                    </Box>
                  </Box>

                  {formMethods.length === 0 && !isItemFullyPaid(itemKey) && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 0.5 }}>
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
                        title="Add Voucher"
                      >
                        <CardGiftcardIcon sx={{ fontSize: 16 }} />
                      </IconButton>
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
                    </Box>
                  )}

                  {formMethods.map((method, idx) => {
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
                      <Paper key={`${itemKey}-method-${idx}`} sx={{ 
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
                                if (expanded) {
                                  setItemExpandedMethod(prev => ({ ...prev, [itemKey]: null }));
                                } else {
                                  setItemExpandedMethod(prev => {
                                    const newExpanded: { [key: string]: number | null } = {};
                                    Object.keys(prev).forEach(key => { newExpanded[key] = null; });
                                    newExpanded[itemKey] = idx;
                                    return newExpanded;
                                  });
                                }
                              }}
                              sx={{ color: 'primary.main' }}
                            >
                              {expanded ? <ExpandLessIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => removeMethod(itemKey, idx)}>
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
                  })}

                  {/* Show additional "Add" buttons when there are existing methods but item isn't fully paid */}
                  {formMethods.length >= 1 && formMethods.length < 3 && !isItemFullyPaid(itemKey) && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 0.5 }}>
                      {!formMethods.includes('credit') && (
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
                          title="Add Voucher"
                        >
                          <CardGiftcardIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                      {!formMethods.includes('points') && (
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
                  )}
                </Paper>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
}


