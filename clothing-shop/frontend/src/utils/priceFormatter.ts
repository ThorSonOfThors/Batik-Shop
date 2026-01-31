/**
 * Format a price in cents to a currency string
 * @param value - Price in cents (e.g., 14999 for $149.99)
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted price string
 */
export const formatPrice = (
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  // Convert cents to dollars if value > 100 (assuming most prices are in cents)
  const amount = value >= 100 ? value / 100 : value
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format a price without currency symbol
 * @param value - Price in cents
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted price without currency symbol
 */
export const formatPriceNoSymbol = (
  value: number,
  locale: string = 'en-US'
): string => {
  const amount = value >= 100 ? value / 100 : value
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Extract numeric value from formatted price string
 * @param formattedPrice - Formatted price string
 * @returns Numeric value
 */
export const parseFormattedPrice = (formattedPrice: string): number => {
  // Remove all non-numeric characters except dots and commas
  const numericString = formattedPrice.replace(/[^0-9.,]/g, '')
  // Replace comma with dot for decimal parsing
  const normalized = numericString.replace(',', '.')
  return parseFloat(normalized) || 0
}

/**
 * Calculate tax amount
 * @param subtotal - Subtotal in cents
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @returns Tax amount in cents
 */
export const calculateTax = (subtotal: number, taxRate: number): number => {
  return Math.round(subtotal * taxRate)
}

/**
 * Calculate total with tax
 * @param subtotal - Subtotal in cents
 * @param taxRate - Tax rate as decimal
 * @returns Total amount in cents
 */
export const calculateTotalWithTax = (subtotal: number, taxRate: number): number => {
  return subtotal + calculateTax(subtotal, taxRate)
}