import { toEnDigits, isValidPhone, isValidEmail } from '@/lib/checkout'
import { DISTRICT_NAMES } from '@/data/districts'

// Shared checkout helpers for the standalone campaign pages (/special-offer, /3-in-1,
// /combo-offer). These pages are Bangla-only by design, so the digit helpers here always
// render Bangla numerals instead of following the site language the way `@/lib/bn` does.
// Phone and email rules come from `@/lib/checkout`, so a landing page and the main
// storefront can never drift apart on what counts as a valid number.

/** Converts the Western digits in a value to Bangla digits. */
export const bn = (n: number | string): string => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)])

/** Formats an amount as a Bangla taka string, e.g. tk(1470) -> "৳১,৪৭০". */
export const tk = (n: number | string): string => '৳' + bn(Number(n).toLocaleString('en-IN'))

export { toEnDigits }

/** Normalises a typed phone number to the local 01XXXXXXXXX form. */
export const cleanPhone = (value: string): string => {
  const digits = toEnDigits(value).replace(/[^\d]/g, '')
  return digits.startsWith('880') ? digits.slice(2) : digits
}

/** Tells whether a fully typed phone number is a valid BD mobile. */
export const phoneOk = (value: string): boolean => isValidPhone(cleanPhone(value))

/**
 * Flags a phone number that is already wrong while it is still being typed, so the field
 * can complain early without nagging about a number the customer has not finished.
 */
export const phoneWrongSoFar = (value: string): boolean => {
  const p = cleanPhone(value)
  if (!p || '880'.startsWith(p)) return false
  return !/^0(1([3-9]\d{0,8})?)?$/.test(p)
}

/** The district names the campaign pages offer, sorted for the picker. */
export const OFFER_DISTRICT_NAMES = [...DISTRICT_NAMES].sort((a, b) => a.localeCompare(b))

/** Tells whether each mandatory checkout field value is acceptable. */
export const FIELD_OK: Record<string, (value: string) => boolean> = {
  name: (v) => v.trim().length >= 2,
  phone: (v) => phoneOk(v),
  email: (v) => isValidEmail(v),
  district: (v) => OFFER_DISTRICT_NAMES.includes(v),
  thana: (v) => v.trim().length >= 2,
  address: (v) => v.trim().length >= 5,
}
