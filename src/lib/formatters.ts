/**
 * Shared formatters for consistent Australian locale formatting across the application.
 * Consolidates currency and date formatting to avoid duplication.
 */

/** Australian currency formatter - formats as $X,XXX.XX AUD */
export const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
})

/** Australian date formatter - short format (DD/MM/YY, HH:MM am/pm) */
export const dateFormatterShort = new Intl.DateTimeFormat('en-AU', {
  dateStyle: 'short',
  timeStyle: 'short',
})

/** Australian date formatter - medium format (DD Mon YYYY, HH:MM am/pm) */
export const dateFormatterMedium = new Intl.DateTimeFormat('en-AU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Australian date formatter - date only (DD/MM/YYYY) */
export const dateFormatterDateOnly = new Intl.DateTimeFormat('en-AU', {
  dateStyle: 'short',
})

/** Australian date formatter - long format for display (e.g., "Thursday, 11 December 2025") */
export const dateFormatterLong = new Intl.DateTimeFormat('en-AU', {
  dateStyle: 'full',
})

/**
 * Format a currency amount with proper Australian locale.
 * @param amount - The numeric amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

/**
 * Format a date in short Australian format.
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "11/12/25, 2:30 pm")
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateFormatterShort.format(d)
}

/**
 * Format a date in medium Australian format.
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "11 Dec 2025, 2:30 pm")
 */
export function formatDateMedium(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateFormatterMedium.format(d)
}
