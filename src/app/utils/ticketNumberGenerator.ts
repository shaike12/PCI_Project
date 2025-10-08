// Utility functions for generating ticket and ancillary numbers

/**
 * Generate a random 7-digit number
 */
const generateRandomDigits = (length: number): string => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min + '';
};

/**
 * Generate a flight ticket number
 * Format: 114-245XXXXXXX (114-245 + 7 random digits)
 */
export const generateTicketNumber = (): string => {
  const randomDigits = generateRandomDigits(7);
  return `114-245${randomDigits}`;
};

/**
 * Generate an ancillary number for seat or bag
 * Format: 114-8XXXXXXXXX (114-8 + 9 random digits)
 */
export const generateAncillaryNumber = (): string => {
  const randomDigits = generateRandomDigits(9);
  return `114-8${randomDigits}`;
};


/**
 * Validate ticket number format
 */
export const isValidTicketNumber = (ticketNumber: string): boolean => {
  const pattern = /^114-245\d{7}$/;
  return pattern.test(ticketNumber);
};

/**
 * Validate ancillary number format
 */
export const isValidAncillaryNumber = (ancillaryNumber: string): boolean => {
  const pattern = /^114-8\d{9}$/;
  return pattern.test(ancillaryNumber);
};
