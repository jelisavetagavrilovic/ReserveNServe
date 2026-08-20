import { format, parse } from "date-fns"

// ============================================================================
// APPLICATION FORMATTERS
// ============================================================================

/**
 * Formats money in Serbian dinars.
 *
 * Examples:
 *
 * 890    -> 890 RSD
 * 1780   -> 1.780 RSD
 * 1780.5 -> 1.780,5 RSD
 */
export function formatCurrency(
  amount: number
): string {
  return new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}


/**
 * Formats time values returned by backend/mock.
 *
 * Examples:
 *
 * "18:30"    -> "18:30"
 * "18:30:00" -> "18:30"
 */
export function formatTime(
  value: string
): string {
  return value.slice(0, 5)
}


/**
 * Formats guest count.
 *
 * Examples:
 *
 * 1 -> "1 guest"
 * 4 -> "4 guests"
 */
export function formatGuestCount(
  count: number
): string {
  return count === 1
    ? "1 guest"
    : `${count} guests`
}

/**
 * Formats a backend date value for display.
 *
 * Example:
 *
 * "2026-08-16" -> "Sunday, August 16, 2026"
 */
export function formatDate(
  value: string
): string {
  return format(
    parse(
      value,
      "yyyy-MM-dd",
      new Date()
    ),
    "EEEE, MMMM d, yyyy"
  )
}