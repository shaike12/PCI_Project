// Payment Logic Utilities

// Luhn algorithm for credit card validation
export const validateCreditCard = (cardNumber: string): boolean => {
  // Remove all non-digit characters
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // Check if the number is empty or too short
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }
  
  // Apply Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  // Process digits from right to left
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Check if payment method has all required fields filled
export const isPaymentMethodComplete = (
  itemKey: string, 
  method: string, 
  methodIndex: number,
  itemPaymentMethods: any
): boolean => {
  const methods = (itemPaymentMethods as any)[itemKey] || {};
  
  if (method === 'credit') {
    const credit = methods.credit;
    return credit && 
           credit.cardNumber && 
           validateCreditCard(credit.cardNumber) &&
           credit.holderName && 
           credit.expiryDate && 
           credit.cvv && 
           credit.amount && 
           parseFloat(credit.amount) > 0;
  } else if (method === 'voucher') {
    const vouchers = methods.vouchers || [];
    const voucher = vouchers[methodIndex];
    return voucher && 
           voucher.voucherNumber && 
           voucher.expiryDate && 
           voucher.amount && 
           parseFloat(voucher.amount) > 0;
  } else if (method === 'points') {
    const points = methods.points;
    return points && 
           points.memberNumber && 
           points.awardReference && 
           points.amount && 
           parseFloat(points.amount) > 0;
  }
  
  return false;
};

// getTotalPaidAmount: sums all assigned payment method amounts for an item
export const getTotalPaidAmount = (itemKey: string, itemPaymentMethods: any): number => {
  const currentMethods = (itemPaymentMethods as any)[itemKey] || {};
  let totalPaid = 0;
  
  // Add credit card amount
  if (currentMethods.credit?.amount) {
    const creditAmount = parseFloat(currentMethods.credit.amount) || 0;
    totalPaid += creditAmount;
  }
  
  // Add voucher amounts
  if (currentMethods.vouchers) {
    currentMethods.vouchers.forEach((voucher: any, index: number) => {
      if (voucher.amount) {
        const voucherAmount = parseFloat(voucher.amount) || 0;
        totalPaid += voucherAmount;
      }
    });
  }
  
  // Add points amount
  if (currentMethods.points?.amount) {
    const pointsAmount = parseFloat(currentMethods.points.amount) || 0;
    totalPaid += pointsAmount;
  }
  return totalPaid;
};

// isItemFullyPaid: convenience to check if total paid >= item price
export const isItemFullyPaid = (
  itemKey: string, 
  itemPaymentMethods: any, 
  reservation: any,
  resolvePassengerIndex: (passengerId: string) => number
): boolean => {
  const [passengerId, itemType] = itemKey.split('-');
  const passengerIndex = resolvePassengerIndex(passengerId);
  const passenger = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
  if (!passenger) return false;
  
  let itemPrice = 0;
  if (itemType === 'ticket') {
    itemPrice = passenger.ticket.price;
  } else if (itemType === 'seat') {
    itemPrice = passenger.ancillaries.seat.price;
  } else if (itemType === 'bag') {
    itemPrice = passenger.ancillaries.bag.price;
  }
  
  const totalPaid = getTotalPaidAmount(itemKey, itemPaymentMethods);
  return totalPaid >= itemPrice;
};

// Copy credit card details to all selected passengers and items
export const copyCreditCardDetails = (
  sourceItemKey: string,
  itemPaymentMethods: any,
  setItemPaymentMethods: (updater: (prev: any) => any) => void,
  selectedItems: { [passengerId: string]: string[] }
): void => {
  const sourceCreditData = (itemPaymentMethods as any)[sourceItemKey]?.credit;
  if (!sourceCreditData) return;

  setItemPaymentMethods((prev: any) => {
    const updated = { ...prev };
    
    // Copy to all selected items
    Object.entries(selectedItems).forEach(([passengerId, items]) => {
      items.forEach((itemType) => {
        const targetItemKey = `${passengerId}-${itemType}`;
        if (targetItemKey !== sourceItemKey) {
          if (!updated[targetItemKey]) {
            updated[targetItemKey] = {};
          }
          updated[targetItemKey].credit = { ...sourceCreditData };
        }
      });
    });
    
    return updated;
  });
};

// Remove payment method
export const removeMethod = (
  itemKey: string,
  index: number,
  itemMethodForms: any,
  itemPaymentMethods: any,
  setItemMethodForms: (updater: (prev: any) => any) => void,
  setItemPaymentMethods: (updater: (prev: any) => any) => void,
  setItemExpandedMethod: (updater: (prev: any) => any) => void
): void => {
  setItemMethodForms((prev: any) => {
    const arr = [...(prev[itemKey] || [])];
    arr.splice(index, 1);
    return { ...prev, [itemKey]: arr };
  });

  setItemPaymentMethods((prev: any) => {
    const updated = { ...prev };
    const methods = updated[itemKey] || {};
    const formMethods = itemMethodForms[itemKey] || [];
    const methodToRemove = formMethods[index];
    
    if (methodToRemove === 'credit') {
      delete methods.credit;
    } else if (methodToRemove === 'voucher') {
      const voucherIndex = formMethods.slice(0, index).filter((m: string) => m === 'voucher').length;
      if (methods.vouchers && methods.vouchers[voucherIndex]) {
        methods.vouchers.splice(voucherIndex, 1);
        if (methods.vouchers.length === 0) {
          delete methods.vouchers;
        }
      }
    } else if (methodToRemove === 'points') {
      delete methods.points;
    }
    
    updated[itemKey] = methods;
    return updated;
  });

  setItemExpandedMethod((prev: any) => ({
    ...prev,
    [itemKey]: null
  }));
};

// Confirm add payment method
export const confirmAddMethod = (
  itemKey: string,
  method: 'credit' | 'voucher' | 'points',
  itemMethodForms: any,
  itemPaymentMethods: any,
  setItemMethodForms: (updater: (prev: any) => any) => void,
  setItemPaymentMethods: (updater: (prev: any) => any) => void,
  setItemExpandedMethod: (updater: (prev: any) => any) => void,
  getRemainingAmount: (itemKey: string) => { total: number; paid: number; remaining: number }
): void => {
  if (!itemKey) return;

  const remainingAmount = getRemainingAmount(itemKey).remaining;

  // First, add the payment method data structure
  setItemPaymentMethods((current: any) => {
    // Ensure the itemKey exists in current
    if (!current[itemKey]) {
      current[itemKey] = {
        credit: undefined,
        vouchers: [],
        points: undefined
      };
    }
    
    const key = method === 'voucher' ? 'vouchers' : method;
    
    if (method === 'voucher') {
      // Initialize vouchers array if it doesn't exist
      if (!current[itemKey].vouchers) {
        current[itemKey].vouchers = [];
      }
      
      // Calculate which voucher index this should be based on existing form entries
      const voucherCountInForms = (itemMethodForms[itemKey] || []).filter((m: string) => m === 'voucher').length;
      
      // Only add a new voucher if the array doesn't have enough vouchers yet
      if (current[itemKey].vouchers.length < voucherCountInForms + 1 && current[itemKey].vouchers.length < 2) {
        current[itemKey].vouchers.push({ 
          uatpNumber: '', 
          balance: 0, 
          expirationDate: '', 
          amount: remainingAmount 
        });
      }
    } else {
      // For credit and points, initialize if not exists
      if (!current[itemKey][key]) {
        current[itemKey][key] = method === 'credit' 
          ? { cardNumber: '', holderName: '', expiryDate: '', cvv: '', amount: remainingAmount }
          : { memberNumber: '', awardReference: '', amount: remainingAmount, pointsToUse: '' };
      }
    }
    
    return { ...current };
  });

  // Then, add the form entry and set expanded index based on the new length
  setItemMethodForms((prev: any) => {
    const current = [...(prev[itemKey] || [])];
    // constraints: max 3 methods per item; only one credit; up to 3 vouchers; only one points
    if (current.length >= 3) return prev;
    if (method === 'credit' && current.includes('credit')) return prev;
    if (method === 'points' && current.includes('points')) return prev;
    current.push(method);
    const nextForms = { ...prev, [itemKey]: current };
    
    // Set the expanded method to the newly added one
    setItemExpandedMethod((prevExpanded: any) => ({
      ...prevExpanded,
      [itemKey]: current.length - 1
    }));
    
    return nextForms;
  });
};

// Update method field
export const updateMethodField = (
  itemKey: string,
  method: 'credit' | 'voucher' | 'points',
  field: string,
  value: string,
  voucherIndex: number | undefined,
  itemPaymentMethods: any,
  setItemPaymentMethods: (updater: (prev: any) => any) => void
): void => {
  setItemPaymentMethods((prev: any) => {
    const updated = { ...prev };
    const methods = updated[itemKey] || {};
    
    // Helper function to convert numeric fields to numbers
    const processValue = (field: string, value: string) => {
      const numericFields = ['amount', 'pointsToUse', 'balance'];
      if (numericFields.includes(field)) {
        const numValue = parseFloat(value);
        return isNaN(numValue) ? 0 : numValue;
      }
      return value;
    };

    if (method === 'credit') {
      if (!methods.credit) methods.credit = {};
      methods.credit[field] = processValue(field, value);
    } else if (method === 'voucher') {
      if (!methods.vouchers) methods.vouchers = [];
      if (voucherIndex !== undefined) {
        if (!methods.vouchers[voucherIndex]) {
          methods.vouchers[voucherIndex] = {};
        }
        methods.vouchers[voucherIndex][field] = processValue(field, value);
      }
    } else if (method === 'points') {
      if (!methods.points) methods.points = {};
      methods.points[field] = processValue(field, value);
    }
    
    updated[itemKey] = methods;
    return updated;
  });
};
