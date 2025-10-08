import type { Reservation } from "@/types/reservation";

export function computeSelectedAmount(reservation: Reservation, selectedItems: { [passengerId: string]: string[] }) {
  let totalSelected = 0;
  Object.entries(selectedItems).forEach(([passengerId, items]) => {
    const resolvePassengerIndex = (pid: string): number => {
      if (!pid) return -1;
      if (/^\d+$/.test(pid)) {
        const idx = Number(pid) - 1;
        return reservation.passengers[idx] ? idx : -1;
      }
      const match = pid.match(/\d+/);
      if (match) {
        const idx = Number(match[0]) - 1;
        return reservation.passengers[idx] ? idx : -1;
      }
      return -1;
    };

    const passengerIndex = resolvePassengerIndex(passengerId);
    const passengerData = passengerIndex >= 0 ? reservation.passengers[passengerIndex] : undefined;
    if (!passengerData) return;
    items.forEach(item => {
      switch(item) {
        case 'ticket':
          if (passengerData.ticket.status !== 'Paid') {
            totalSelected += passengerData.ticket.price;
          }
          break;
        case 'seat':
          if (passengerData.ancillaries.seat && passengerData.ancillaries.seat.status !== 'Paid') {
            totalSelected += passengerData.ancillaries.seat.price || 0;
          }
          break;
        case 'bag':
          if (passengerData.ancillaries.bag && passengerData.ancillaries.bag.status !== 'Paid') {
            totalSelected += passengerData.ancillaries.bag.price || 0;
          }
          break;
        case 'secondBag':
          if (passengerData.ancillaries.secondBag && passengerData.ancillaries.secondBag.status !== 'Paid') {
            totalSelected += passengerData.ancillaries.secondBag.price || 0;
          }
          break;
        case 'thirdBag':
          if (passengerData.ancillaries.thirdBag && passengerData.ancillaries.thirdBag.status !== 'Paid') {
            totalSelected += passengerData.ancillaries.thirdBag.price || 0;
          }
          break;
        case 'uatp':
          if (passengerData.ancillaries.uatp && passengerData.ancillaries.uatp.status !== 'Paid') {
            totalSelected += passengerData.ancillaries.uatp.price || 0;
          }
          break;
      }
    });
  });
  return totalSelected;
}


