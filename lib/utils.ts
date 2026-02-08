/**
 * Format number in Vietnamese style with dots as thousand separators
 * Example: 35000 -> "35.000"
 */
export function formatVND(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
