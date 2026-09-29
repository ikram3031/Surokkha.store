export function formatCurrency(amount, currency = "৳") {
  return `${currency}${amount.toFixed(2)}`;
}
