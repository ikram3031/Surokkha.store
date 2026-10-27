/** The storefront is English-only: kept as a pass-through so existing call sites keep working. */
export function bn(n: number | string): string {
  return String(n)
}

/** Format a number as a taka amount, e.g. taka(1250) -> "৳1,250". */
export function taka(n: number): string {
  return '৳' + Number(n).toLocaleString('en-IN')
}
