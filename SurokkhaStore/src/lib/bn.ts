const BN_DIGITS = '০১২৩৪৫৬৭৮৯'

/** Convert any number/string of ASCII digits to Bengali digits. */
export function bn(n: number | string): string {
  return String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)])
}

/** Format a number as a Bengali taka amount, e.g. taka(500) -> "৳৫০০". */
export function taka(n: number): string {
  return '৳' + bn(Number(n).toLocaleString('en-IN'))
}
