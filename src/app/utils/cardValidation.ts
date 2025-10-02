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

// getCardIcon: Returns the appropriate icon component for each card type
export const getCardIcon = (cardType: string) => {
  switch (cardType) {
    case 'Visa':
      return (
        <Box sx={{
          width: 24,
          height: 16,
          backgroundColor: '#1A1F71',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>
          VISA
        </Box>
      );
    case 'Mastercard':
      return (
        <Box sx={{
          width: 24,
          height: 16,
          backgroundColor: '#EB001B',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '8px',
          fontWeight: 'bold'
        }}>
          MC
        </Box>
      );
    case 'American Express':
      return (
        <Box sx={{
          width: 24,
          height: 16,
          backgroundColor: '#006FCF',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '8px',
          fontWeight: 'bold'
        }}>
          AMEX
        </Box>
      );
    case 'Discover':
      return (
        <Box sx={{
          width: 24,
          height: 16,
          backgroundColor: '#FF6000',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '8px',
          fontWeight: 'bold'
        }}>
          DISC
        </Box>
      );
    default:
      return (
        <Box sx={{
          width: 24,
          height: 16,
          backgroundColor: 'grey.400',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '8px',
          fontWeight: 'bold'
        }}>
          ?
        </Box>
      );
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
