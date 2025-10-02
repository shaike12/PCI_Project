# Payment Portal System - Technical Specification

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [User Interface Components](#user-interface-components)
5. [Business Logic](#business-logic)
6. [Payment Methods](#payment-methods)
7. [State Management](#state-management)
8. [Validation & Error Handling](#validation--error-handling)
9. [Styling & Design System](#styling--design-system)
10. [Technical Implementation](#technical-implementation)

---

## System Overview

### Purpose
A comprehensive payment portal system for airline reservations that allows users to:
- Select passengers and items for payment
- Configure multiple payment methods (Credit Card, Vouchers, Points)
- Manage payment distribution across different items
- View real-time payment summaries

### Technology Stack
- **Frontend**: Next.js 15.5.4 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **Styling**: MUI's sx prop system
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **Build Tool**: Turbopack

---

## Architecture

### Component Structure
```
src/app/page.tsx (Main Component - 2943 lines)
├── Reservation Data Management
├── Passenger Selection Logic
├── Item Selection Logic
├── Payment Method Management
├── UI Rendering
└── Summary Calculations
```

### Key Design Patterns
- **Single Page Application**: All functionality in one main component
- **State-Driven UI**: All UI elements controlled by React state
- **Real-time Calculations**: Dynamic updates based on user selections
- **Accordion Pattern**: Collapsible sections for better UX

---

## Data Models

### Reservation Structure
```typescript
interface Reservation {
  passengers: Passenger[];
  // Additional reservation metadata
}

interface Passenger {
  id: string;
  name: string;
  ticket: {
    price: number;
    status: 'Paid' | 'Unpaid';
  };
  ancillaries: {
    seat: {
      price: number;
      status: 'Paid' | 'Unpaid';
    };
    bag: {
      price: number;
      status: 'Paid' | 'Unpaid';
    };
  };
}
```

### Payment Method Types
```typescript
interface PaymentMethods {
  credit?: {
    amount: number;
    cardNumber: string;
    holderName: string;
    expiryDate: string;
    cvv: string;
    idNumber: string;
    installments: number;
  };
  vouchers?: Array<{
    amount: number;
    uatpNumber: string;
    balance: number;
    expirationDate: string;
  }>;
  points?: {
    amount: number;
    accountId: string;
    memberNumber: string;
    pointsToUse: number;
    awardReference: string;
  };
}
```

### State Management Structure
```typescript
// Core State Variables
const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
const [selectedItems, setSelectedItems] = useState<{[passengerId: string]: string[]}>({});
const [itemPaymentMethods, setItemPaymentMethods] = useState<{[itemKey: string]: PaymentMethods}>({});
const [itemMethodForms, setItemMethodForms] = useState<{[itemKey: string]: Array<'credit' | 'voucher' | 'points'>}>({});
const [itemExpandedMethod, setItemExpandedMethod] = useState<{[itemKey: string]: number | null}>({});
const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
```

---

## User Interface Components

### 1. Passenger Selection Section
**Location**: Left side of the interface
**Components**:
- Passenger cards with checkboxes
- Item selection checkboxes (Ticket, Seat, Baggage)
- Price display for each item
- Status indicators (Paid/Unpaid)

**Behavior**:
- Selecting items automatically selects the passenger
- Deselecting all items removes passenger from selection
- Real-time price calculations

### 2. Payment Methods Section
**Location**: Right side of the interface
**Components**:
- Tabbed interface for each passenger with selected items
- Payment method selection buttons (Credit, Voucher, Points)
- Expandable forms for each payment method
- Accordion behavior (only one method expanded at a time)

**Tab Structure**:
```
Passenger Name
$Total Amount
$Remaining Left / ✓ Paid
```

### 3. Summary Section
**Location**: Bottom of the interface
**Components**:
- Real-time payment summary
- Accordion-based organization
- Quick stats chips
- Detailed breakdowns
- Action buttons (Confirm Payment, Cancel)

---

## Business Logic

### Selection Logic
```typescript
const toggleItem = (passengerId: string, itemType: 'ticket' | 'seat' | 'bag') => {
  // 1. Toggle item selection
  // 2. Update passenger selection
  // 3. Remove passenger if no items selected
  // 4. Clean up payment method assignments
};
```

### Payment Distribution Logic
```typescript
const getRemainingAmount = (itemKey: string) => {
  // Calculate remaining amount after all payment methods
  const itemPrice = getItemPrice(itemKey);
  const totalPaid = getTotalPaidAmount(itemKey);
  return Math.max(0, itemPrice - totalPaid);
};
```

### Amount Coercion Logic
```typescript
const updateMethodField = (itemKey, method, field, value) => {
  // 1. Validate input
  // 2. Apply amount limitations
  // 3. Update state
  // 4. Trigger real-time calculations
};
```

---

## Payment Methods

### 1. Credit Card Payment
**Fields**:
- Card Number (with formatting and type detection)
- Card Holder Name
- Expiry Date (MM/YY format)
- CVV/Confirmation Number
- ID Number
- Installments (1-5, dropdown)

**Features**:
- Real-time card type detection (Visa, Mastercard, Amex, Discover)
- Visual card type indicators with custom icons
- Automatic card number formatting
- Amount limitation based on remaining balance

**Validation**:
- Card number length validation
- Expiry date format validation
- CVV length validation
- ID number format validation

### 2. Voucher Payment
**Fields**:
- UATP Number (15 digits, always starts with "1114-")
- Amount (auto-calculated from balance)
- Balance (editable, with balance check)
- Expiration Date (MM/YY format)

**Features**:
- Automatic UATP number formatting
- Balance verification button
- Amount auto-adjustment based on balance
- Support for multiple vouchers per item (up to 3)

**Validation**:
- UATP number format (1114-XXXXXXXXXXX)
- Balance must be positive
- Expiry date format validation
- Amount cannot exceed balance

### 3. Points Payment
**Fields**:
- Member Number (7-9 digits)
- Award Master (A + 6 digits format)
- Payment Amount ($)
- Points to Use (with 50 points = $1 conversion)
- Points Slider (visual selection)

**Features**:
- Member verification with mock frequent flyer database
- Real-time points-to-dollars conversion
- Slider with dynamic limits based on available points
- Automatic amount adjustment based on member's points

**Mock Data**:
```typescript
const frequentFlyers = [
  { memberNumber: '1234567', name: 'John Smith', points: 25000 },
  { memberNumber: '2345678', name: 'Sarah Johnson', points: 18000 },
  { memberNumber: '3456789', name: 'Michael Brown', points: 32000 }
];
```

**Validation**:
- Member number length (7-9 digits)
- Award Master format (A + 6 digits)
- Points limitation based on available balance
- Payment amount limitation based on remaining balance

---

## State Management

### Core State Variables
1. **selectedPassengers**: Array of selected passenger IDs
2. **selectedItems**: Object mapping passenger IDs to their selected items
3. **itemPaymentMethods**: Object storing payment method data for each item
4. **itemMethodForms**: Object tracking which payment method forms are displayed
5. **itemExpandedMethod**: Object tracking which payment method is expanded
6. **fieldErrors**: Object storing validation error messages
7. **activePaymentPassenger**: Currently active passenger tab

### State Update Patterns
```typescript
// Immutable updates
setSelectedItems(prev => ({
  ...prev,
  [passengerId]: newItems
}));

// Complex state updates with cleanup
setItemPaymentMethods(prev => {
  const next = { ...prev };
  // Perform updates
  return next;
});
```

### Real-time Calculations
```typescript
// Memoized calculations for performance
const flightPrice = useMemo(() => {
  return passengersWithSelectedItems.reduce((sum, passengerId) => {
    // Calculate based on selected items
  }, 0);
}, [selectedItems, reservation.passengers]);
```

---

## Validation & Error Handling

### Field Validation System
```typescript
const setFieldError = (key: string, message: string) => {
  setFieldErrors(prev => ({ ...prev, [key]: message }));
};

const clearFieldError = (key: string) => {
  setFieldErrors(prev => {
    const next = { ...prev };
    delete next[key];
    return next;
  });
};
```

### Validation Rules
1. **Credit Card**:
   - Card number: 13-19 digits
   - Expiry: MM/YY format
   - CVV: 3-4 digits
   - ID: Required field

2. **Voucher**:
   - UATP: Must start with "1114-" and be 15 digits total
   - Balance: Must be positive number
   - Expiry: MM/YY format

3. **Points**:
   - Member Number: 7-9 digits
   - Award Master: A + 6 digits
   - Points: Cannot exceed available balance

### Error Display
- Errors appear below fields (not as alerts)
- Real-time validation on field changes
- Error clearing on successful input

---

## Styling & Design System

### Design Principles
- **Modern & Professional**: Clean, spacious layouts
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Proper contrast ratios and focus states
- **Consistent**: Unified spacing and typography

### Color Scheme
```typescript
// Primary colors
primary: '#1976d2' (Blue)
success: '#2e7d32' (Green)
warning: '#ed6c02' (Orange)
error: '#d32f2f' (Red)

// Text colors
text.primary: '#212121'
text.secondary: '#757575'
```

### Typography Scale
```typescript
// Font sizes
h6: '1.25rem' (20px) - Section headers
subtitle1: '1rem' (16px) - Subsection headers
body1: '0.875rem' (14px) - Body text
body2: '0.75rem' (12px) - Secondary text
caption: '0.75rem' (12px) - Small text
```

### Spacing System
```typescript
// MUI spacing units (8px base)
xs: 0.5 (4px)
sm: 1 (8px)
md: 2 (16px)
lg: 3 (24px)
xl: 4 (32px)
```

### Component Styling Patterns
```typescript
// Consistent field styling
sx={{
  '& .MuiInputBase-root': { height: 48 },
  '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' },
  '& .MuiInputLabel-root': { fontSize: '0.9rem' }
}}

// Card styling
sx={{
  border: '1px solid',
  borderColor: 'grey.300',
  borderRadius: 2,
  p: 2
}}
```

---

## Technical Implementation

### Performance Optimizations
1. **Memoized Calculations**: Expensive calculations wrapped in useMemo
2. **Conditional Rendering**: Components only render when needed
3. **Efficient State Updates**: Minimal re-renders through careful state management

### Code Organization
```typescript
// Function grouping in main component
1. Helper Functions (getPassengerNameById, detectCardType, etc.)
2. State Management Functions (toggleItem, updateMethodField, etc.)
3. Calculation Functions (getTotalPaidAmount, getRemainingAmount, etc.)
4. Event Handlers (onClick handlers, form submissions)
5. Render Functions (JSX components)
```

### Key Algorithms
1. **Card Type Detection**: Pattern matching for card number prefixes
2. **Amount Coercion**: Ensures payment amounts don't exceed remaining balance
3. **Real-time Calculations**: Dynamic updates based on user selections
4. **Accordion Management**: Single-expand behavior for payment methods

### Error Handling Strategy
1. **Graceful Degradation**: System continues to function with invalid inputs
2. **User Feedback**: Clear error messages and validation states
3. **Data Integrity**: State consistency maintained through validation

---

## Future Enhancements

### Potential Improvements
1. **Backend Integration**: Connect to real payment processing APIs
2. **Data Persistence**: Save payment progress to database
3. **Multi-language Support**: Internationalization
4. **Advanced Validation**: Server-side validation
5. **Payment History**: Track previous transactions
6. **Receipt Generation**: PDF receipt creation
7. **Email Notifications**: Payment confirmation emails

### Scalability Considerations
1. **Component Splitting**: Break down large component into smaller ones
2. **State Management**: Consider Redux or Zustand for complex state
3. **API Integration**: Implement proper API layer
4. **Testing**: Add comprehensive unit and integration tests
5. **Performance Monitoring**: Add performance tracking

---

## Conclusion

This payment portal system provides a comprehensive solution for airline reservation payments with:
- **Intuitive User Experience**: Clear navigation and real-time feedback
- **Flexible Payment Options**: Multiple payment methods with smart validation
- **Robust State Management**: Reliable data handling and calculations
- **Professional Design**: Modern, accessible interface
- **Extensible Architecture**: Foundation for future enhancements

The system successfully handles complex payment scenarios while maintaining data integrity and providing excellent user experience.
