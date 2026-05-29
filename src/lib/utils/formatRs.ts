/** Format Sri Lankan Rupee amounts: Rs. 1,234,567 */
export function formatRs(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded).toLocaleString("en-LK");
  const sign = rounded < 0 ? "-" : "";
  return `${sign}Rs. ${formatted}`;
}
