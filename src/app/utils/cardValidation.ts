// Card Validation Utilities

// detectCardType: Given a raw card number string, returns best-effort card scheme.
export const detectCardType = (cardNumber: string): string => {
  const number = cardNumber.replace(/\D/g, '');
  if (number.startsWith('4')) return 'Visa';
  if (number.startsWith('5') || number.startsWith('2')) return 'Mastercard';
  if (number.startsWith('3')) return 'American Express';
  if (number.startsWith('6')) return 'Discover';
  return 'Unknown';
};

// getCardIconProps: Returns the appropriate icon props for each card type
export const getCardIconProps = (cardType: string) => {
  switch (cardType) {
    case 'Visa':
      return {
        text: 'VISA',
        backgroundColor: '#1B358F',
        fontSize: '10px'
      };
    case 'Mastercard':
      return {
        text: 'MC',
        backgroundColor: '#C1666B',
        fontSize: '8px'
      };
    case 'American Express':
      return {
        text: 'AMEX',
        backgroundColor: '#48A9A6',
        fontSize: '8px'
      };
    case 'Discover':
      return {
        text: 'DISC',
        backgroundColor: '#D4B483',
        fontSize: '8px'
      };
    default:
      return {
        text: '?',
        backgroundColor: '#C1666B',
        fontSize: '8px'
      };
  }
};

// formatCardNumber: applies spacing per detected scheme (Amex 4-6-5, others 4-4-4-4)
export const formatCardNumber = (value: string): string => {
  const number = value.replace(/\D/g, '');
  const cardType = detectCardType(number);
  
  if (cardType === 'American Express') {
    // Amex: 4-6-5 format
    return number.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').substring(0, 17);
  } else {
    // Visa, Mastercard, Discover: 4-4-4-4 format
    return number.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4').substring(0, 19);
  }
};
