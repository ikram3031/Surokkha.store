/**
 * Site language. surokkha.store shows Bangla only for now; English copy is kept
 * next to every Bangla string so the site can be switched back (or a language
 * toggle added) later by changing LANG.
 */
export type Lang = 'bn' | 'en'

export const LANG: Lang = 'bn'

/** Pick the visible copy: L('Add to cart', 'কার্টে যোগ করুন'). */
export function L(en: string, bnText: string): string {
  return LANG === 'bn' ? bnText : en
}
