// Passenger Logic Utilities

// Safely resolve a passenger index from passenger ID
export const resolvePassengerIndex = (passengerId: string, reservation: any): number => {
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

// Get passenger name by ID
export const getPassengerNameById = (pid: string, reservation: any, resolvePassengerIndex: (passengerId: string) => number): string => {
  const idx = resolvePassengerIndex(pid);
  return idx >= 0 ? (reservation.passengers[idx]?.name || pid) : pid;
};

// Get passenger tab label
export const getPassengerTabLabel = (pid: string, reservation: any, resolvePassengerIndex: (passengerId: string) => number): any => {
  const idx = resolvePassengerIndex(pid);
  const passenger = idx >= 0 ? reservation.passengers[idx] : undefined;
  if (!passenger) return `Passenger ${pid}`;
  
  const unpaidItems = [];
  let totalAmount = 0;
  
  if (passenger.ticket.status !== 'Paid') {
    unpaidItems.push('Ticket');
    totalAmount += passenger.ticket.price;
  }
  if (passenger.ancillaries.seat.status !== 'Paid') {
    unpaidItems.push('Seat');
    totalAmount += passenger.ancillaries.seat.price;
  }
  if (passenger.ancillaries.bag.status !== 'Paid') {
    unpaidItems.push('Bag');
    totalAmount += passenger.ancillaries.bag.price;
  }
  if (passenger.ancillaries.secondBag && passenger.ancillaries.secondBag.status !== 'Paid') {
    unpaidItems.push('Second Bag');
    totalAmount += passenger.ancillaries.secondBag.price;
  }
  if (passenger.ancillaries.thirdBag && passenger.ancillaries.thirdBag.status !== 'Paid') {
    unpaidItems.push('Third Bag');
    totalAmount += passenger.ancillaries.thirdBag.price;
  }
  if (passenger.ancillaries.uatp && passenger.ancillaries.uatp.status !== 'Paid') {
    unpaidItems.push('UATP');
    totalAmount += passenger.ancillaries.uatp.price;
  }
  
  const unpaidText = unpaidItems.length > 0 ? ` (${unpaidItems.join(', ')})` : '';
  const totalText = totalAmount > 0 ? ` - $${totalAmount}` : '';
  return `${passenger.name}${unpaidText}${totalText}`;
};

// Toggle passenger selection
export const togglePassenger = (
  passengerId: string,
  selectedPassengers: string[],
  setSelectedPassengers: (updater: (prev: string[]) => string[]) => void
): void => {
  setSelectedPassengers(prev => 
    prev.includes(passengerId) 
      ? prev.filter(id => id !== passengerId)
      : [...prev, passengerId]
  );
};

// Toggle passenger expanded state
export const toggleExpanded = (
  passengerId: string,
  expandedPassengers: string[],
  setExpandedPassengers: (updater: (prev: string[]) => string[]) => void
): void => {
  setExpandedPassengers(prev => {
    // If the passenger is already expanded, collapse it
    if (prev.includes(passengerId)) {
      return prev.filter(id => id !== passengerId);
    }
    // If expanding a passenger, close all others (accordion behavior)
    return [passengerId];
  });
};

// Toggle item selection for a passenger
export const toggleItem = (
  passengerId: string,
  itemType: string,
  selectedItems: { [passengerId: string]: string[] },
  selectedPassengers: string[],
  setSelectedItems: (updater: (prev: any) => any) => void,
  setSelectedPassengers: (updater: (prev: string[]) => string[]) => void
): void => {
  setSelectedItems(prev => {
    const passengerItems = prev[passengerId] || [];
    const isSelected = passengerItems.includes(itemType);
    
    if (isSelected) {
      // Remove item
      const newItems = passengerItems.filter((item: string) => item !== itemType);
      
      // If no items left, remove passenger from selectedPassengers
      if (newItems.length === 0) {
        setSelectedPassengers(prevSel => prevSel.filter(id => id !== passengerId));
      }
      
      return {
        ...prev,
        [passengerId]: newItems
      };
    } else {
      // Add item
      const newItems = [...passengerItems, itemType];
      
      // Add passenger to selectedPassengers if not already there
      setSelectedPassengers(prevSel => 
        prevSel.includes(passengerId) ? prevSel : [...prevSel, passengerId]
      );
      
      return {
        ...prev,
        [passengerId]: newItems
      };
    }
  });
};

// Toggle all items for a passenger
export const toggleAllItemsForPassenger = (
  passengerId: string,
  reservation: any,
  selectedItems: { [passengerId: string]: string[] },
  selectedPassengers: string[],
  setSelectedItems: (updater: (prev: any) => any) => void,
  setSelectedPassengers: (updater: (prev: string[]) => string[]) => void,
  resolvePassengerIndex: (passengerId: string) => number
): void => {
  const passengerIndex = resolvePassengerIndex(passengerId);
  const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
  if (!passengerData) return;

  const currentItems = selectedItems[passengerId] || [];
  const unpaidItems: string[] = [];
  
  if (passengerData.ticket.status !== 'Paid') unpaidItems.push('ticket');
  if (passengerData.ancillaries.seat.status !== 'Paid') unpaidItems.push('seat');
  if (passengerData.ancillaries.bag.status !== 'Paid') unpaidItems.push('bag');
  if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status !== 'Paid') unpaidItems.push('secondBag');
  if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status !== 'Paid') unpaidItems.push('thirdBag');
  if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status !== 'Paid') unpaidItems.push('uatp');
  
  setSelectedItems(prev => {
    // If all unpaid items are selected, deselect all
    const allUnpaidSelected = unpaidItems.every(item => currentItems.includes(item));
    
    if (allUnpaidSelected) {
      // Deselect all items for this passenger
      setSelectedPassengers(prevSel => prevSel.filter(id => id !== passengerId));
      return {
        ...prev,
        [passengerId]: []
      };
    } else {
      // Select all unpaid items
      // Ensure passenger is marked selected
      setSelectedPassengers(prevSel => (prevSel.includes(passengerId) ? prevSel : [...prevSel, passengerId]));
      return {
        ...prev,
        [passengerId]: unpaidItems
      };
    }
  });
};

// Check if item is selected
export const isItemSelected = (
  passengerId: string,
  itemType: string,
  selectedItems: { [passengerId: string]: string[] }
): boolean => {
  return selectedItems[passengerId]?.includes(itemType) || false;
};
