// Barcode utility functions

/**
 * Validate different barcode formats
 */
export const validateBarcode = (barcode: string, format?: string): boolean => {
  if (!barcode || barcode.trim().length === 0) {
    return false;
  }

  const cleanBarcode = barcode.trim();

  switch (format) {
    case 'EAN-13':
      return validateEAN13(cleanBarcode);
    case 'EAN-8':
      return validateEAN8(cleanBarcode);
    case 'UPC-A':
      return validateUPCA(cleanBarcode);
    case 'UPC-E':
      return validateUPCE(cleanBarcode);
    case 'Code128':
      return validateCode128(cleanBarcode);
    case 'Code39':
      return validateCode39(cleanBarcode);
    default:
      // Try to detect format automatically
      return detectBarcodeFormat(cleanBarcode) !== null;
  }
};

/**
 * Detect barcode format automatically
 */
export const detectBarcodeFormat = (barcode: string): string | null => {
  const cleanBarcode = barcode.trim();

  if (validateEAN13(cleanBarcode)) return 'EAN-13';
  if (validateEAN8(cleanBarcode)) return 'EAN-8';
  if (validateUPCA(cleanBarcode)) return 'UPC-A';
  if (validateUPCE(cleanBarcode)) return 'UPC-E';
  if (validateCode128(cleanBarcode)) return 'Code128';
  if (validateCode39(cleanBarcode)) return 'Code39';

  return null;
};

/**
 * Validate EAN-13 barcode
 */
const validateEAN13 = (barcode: string): boolean => {
  if (!/^\d{13}$/.test(barcode)) return false;

  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return calculatedCheckDigit === checkDigit;
};

/**
 * Validate EAN-8 barcode
 */
const validateEAN8 = (barcode: string): boolean => {
  if (!/^\d{8}$/.test(barcode)) return false;

  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return calculatedCheckDigit === checkDigit;
};

/**
 * Validate UPC-A barcode
 */
const validateUPCA = (barcode: string): boolean => {
  if (!/^\d{12}$/.test(barcode)) return false;

  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return calculatedCheckDigit === checkDigit;
};

/**
 * Validate UPC-E barcode
 */
const validateUPCE = (barcode: string): boolean => {
  return /^\d{8}$/.test(barcode);
};

/**
 * Validate Code128 barcode
 */
const validateCode128 = (barcode: string): boolean => {
  // Code128 can contain alphanumeric characters and special characters
  return /^[\x00-\x7F]+$/.test(barcode) && barcode.length >= 1;
};

/**
 * Validate Code39 barcode
 */
const validateCode39 = (barcode: string): boolean => {
  // Code39 supports uppercase letters, digits, and some special characters
  return /^[A-Z0-9\-\.\s\$\/\+\%\*]+$/.test(barcode);
};

/**
 * Format barcode for display
 */
export const formatBarcode = (barcode: string, format?: string): string => {
  if (!barcode) return '';
  
  const cleanBarcode = barcode.trim();
  const detectedFormat = format || detectBarcodeFormat(cleanBarcode);
  
  switch (detectedFormat) {
    case 'EAN-13':
      // Format as: 1 234567 890123
      return cleanBarcode.replace(/(\d{1})(\d{6})(\d{6})/, '$1 $2 $3');
    case 'EAN-8':
      // Format as: 1234 5678
      return cleanBarcode.replace(/(\d{4})(\d{4})/, '$1 $2');
    case 'UPC-A':
      // Format as: 1 23456 78901 2
      return cleanBarcode.replace(/(\d{1})(\d{5})(\d{5})(\d{1})/, '$1 $2 $3 $4');
    default:
      return cleanBarcode;
  }
};

/**
 * Generate random barcode for testing
 */
export const generateTestBarcode = (format: string = 'EAN-13'): string => {
  switch (format) {
    case 'EAN-13':
      return generateEAN13();
    case 'EAN-8':
      return generateEAN8();
    case 'UPC-A':
      return generateUPCA();
    default:
      return generateEAN13();
  }
};

const generateEAN13 = (): string => {
  // Generate 12 random digits
  let barcode = '';
  for (let i = 0; i < 12; i++) {
    barcode += Math.floor(Math.random() * 10);
  }
  
  // Calculate check digit
  const digits = barcode.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return barcode + checkDigit;
};

const generateEAN8 = (): string => {
  // Generate 7 random digits
  let barcode = '';
  for (let i = 0; i < 7; i++) {
    barcode += Math.floor(Math.random() * 10);
  }
  
  // Calculate check digit
  const digits = barcode.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return barcode + checkDigit;
};

const generateUPCA = (): string => {
  // Generate 11 random digits
  let barcode = '';
  for (let i = 0; i < 11; i++) {
    barcode += Math.floor(Math.random() * 10);
  }
  
  // Calculate check digit
  const digits = barcode.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return barcode + checkDigit;
};

/**
 * Search products by barcode across different fields
 */
export const createBarcodeSearchQuery = (barcode: string) => {
  const cleanBarcode = barcode.trim();
  
  return {
    or: [
      { barcode: { eq: cleanBarcode } },
      { ean_code: { eq: cleanBarcode } },
      { upc_code: { eq: cleanBarcode } },
      { gtin: { eq: cleanBarcode } },
      { sku: { eq: cleanBarcode } }
    ]
  };
};

/**
 * Log barcode scan for analytics
 */
export const logBarcodeScan = async (
  supabase: any,
  {
    companyId,
    barcode,
    scanType,
    productId,
    sessionId,
    scannedBy,
    scanResult,
    metadata = {}
  }: {
    companyId: string;
    barcode: string;
    scanType: string;
    productId?: string;
    sessionId?: string;
    scannedBy?: string;
    scanResult: 'success' | 'not_found' | 'error';
    metadata?: any;
  }
) => {
  try {
    const { error } = await supabase
      .from('barcode_scan_logs')
      .insert({
        company_id: companyId,
        barcode,
        scan_type: scanType,
        product_id: productId,
        session_id: sessionId,
        scanned_by: scannedBy,
        scan_result: scanResult,
        metadata
      });
    
    if (error) {
      console.error('Error logging barcode scan:', error);
    }
  } catch (error) {
    console.error('Error logging barcode scan:', error);
  }
};