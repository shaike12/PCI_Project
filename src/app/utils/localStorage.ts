// Local Storage Utilities

// Save progress to localStorage
export const saveProgressToLocalStorage = (progressData: {
  selectedPassengers: string[];
  selectedItems: { [key: string]: string[] };
  itemPaymentMethods: any;
  itemMethodForms: { [key: string]: Array<'credit' | 'voucher' | 'points'> };
  itemExpandedMethod: { [key: string]: number | null };
  timestamp: string;
}): void => {
  try {
    localStorage.setItem('paymentPortalProgress', JSON.stringify(progressData));
    console.log('💾 Progress saved to localStorage');
  } catch (error) {
    console.error('Error saving progress to localStorage:', error);
  }
};

// Load progress from localStorage
export const loadProgressFromLocalStorage = (): {
  selectedPassengers: string[];
  selectedItems: { [key: string]: string[] };
  itemPaymentMethods: any;
  itemMethodForms: { [key: string]: Array<'credit' | 'voucher' | 'points'> };
  itemExpandedMethod: { [key: string]: number | null };
} | null => {
  try {
    const savedProgress = localStorage.getItem('paymentPortalProgress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      const savedTime = new Date(parsed.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
      
      // Only load if saved within last 24 hours
      if (hoursDiff < 24) {
        console.log('📦 Progress loaded from localStorage');
        return {
          selectedPassengers: parsed.selectedPassengers || [],
          selectedItems: parsed.selectedItems || {},
          itemPaymentMethods: parsed.itemPaymentMethods || {},
          itemMethodForms: parsed.itemMethodForms || {},
          itemExpandedMethod: parsed.itemExpandedMethod || {}
        };
      } else {
        console.log('⏰ Saved progress is too old, clearing...');
        localStorage.removeItem('paymentPortalProgress');
      }
    }
  } catch (error) {
    console.error('Error loading progress from localStorage:', error);
  }
  return null;
};

// Clear progress from localStorage
export const clearProgressFromLocalStorage = (): void => {
  try {
    localStorage.removeItem('paymentPortalProgress');
    console.log('🗑️ Progress cleared from localStorage');
  } catch (error) {
    console.error('Error clearing progress from localStorage:', error);
  }
};
