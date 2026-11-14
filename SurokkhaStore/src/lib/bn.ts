import { LANG } from './i18n'

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

/** Convert Western digits to Bangla digits when the site language is Bangla. */
export function bn(n: number | string): string {
  const s = String(n)
  return LANG === 'bn' ? s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]) : s
}

/** Format a number as a taka amount, e.g. taka(1250) -> "৳১,২৫০". */
export function taka(n: number): string {
  return '৳' + bn(Number(n).toLocaleString('en-IN'))
}
