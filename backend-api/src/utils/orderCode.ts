/**
 * Generate order code: B[tableNumber]-[counterPadded]
 * Examples: B05-001, B05-002, B03-001
 * Spec: counter resets when a new table session is opened
 */
export function generateOrderCode(displayName: string, counter: number): string {
  // Extract numeric suffix from displayName e.g. "Bàn 05" -> "05"
  const match = displayName.match(/\d+$/);
  const tableNum = match ? match[0].padStart(2, '0') : '00';
  const seq = String(counter).padStart(3, '0');
  return `B${tableNum}-${seq}`;
}
