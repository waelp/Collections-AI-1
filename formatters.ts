/**
 * Utility functions for consistent number formatting across the application
 * All numbers are formatted without decimals and with thousand separators
 */

/**
 * Format a number with thousand separators and no decimals
 * @param num - The number to format
 * @returns Formatted string with commas as thousand separators
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(num));
};

/**
 * Format a currency value with thousand separators and no decimals
 * @param num - The amount to format
 * @param currency - Currency code (default: 'SAR')
 * @returns Formatted currency string
 */
export const formatCurrency = (num: number, currency: string = 'SAR'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(num));
};

/**
 * Format a percentage value with no decimals
 * @param num - The percentage value
 * @returns Formatted percentage string
 */
export const formatPercent = (num: number): string => {
  return `${Math.round(num)}%`;
};

/**
 * Format a compact number (e.g., 1.5K, 2M)
 * @param num - The number to format
 * @returns Compact formatted string
 */
export const formatCompact = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 0,
  }).format(Math.round(num));
};

/**
 * Format a trend percentage with sign
 * @param current - Current value
 * @param previous - Previous value
 * @returns Formatted trend string with + or - sign
 */
export const formatTrend = (current: number, previous: number): string => {
  if (!previous) return '0%';
  const diff = ((current - previous) / previous) * 100;
  return `${diff > 0 ? '+' : ''}${Math.round(diff)}%`;
};
