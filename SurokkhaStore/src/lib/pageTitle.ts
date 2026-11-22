import { L } from '@/lib/i18n'
import type { Route } from '@/lib/router'

const SITE = () => L('Surokkha Store', 'সুরক্ষা স্টোর')

export const HOME_TITLE = 'সুরক্ষা স্টোর | অরিজিনাল হেলথ ও ওয়েলনেস প্রোডাক্ট, গোপনীয় হোম ডেলিভারি'

// Builds "<page> | <site>" for any page title
export const withSite = (page: string) => `${page} | ${SITE()}`

// Title for routes that need no data; product, category, blog and 404 pages set their own
export const staticRouteTitle = (route: Route): string | null => {
  switch (route.name) {
    case 'home':
    case 'home-classic':
      return HOME_TITLE
    case 'shop':
      return withSite(L('Shop all health and wellness products', 'সব হেলথ ও ওয়েলনেস প্রোডাক্ট'))
    case 'offer':
    case 'offers':
      return withSite(L('Combo offers and discount deals', 'কম্বো অফার ও ডিসকাউন্ট ডিল'))
    case 'offer-products':
      return withSite(L('Offer products with special prices', 'বিশেষ দামের অফার প্রোডাক্ট'))
    case 'checkout':
      return withSite(L('Checkout', 'চেকআউট'))
    case 'account':
      return withSite(L('My account and orders', 'আমার অ্যাকাউন্ট ও অর্ডার'))
    case 'confirmation':
      return withSite(L('Order confirmed', 'অর্ডার কনফার্ম হয়েছে'))
    case 'faq':
      return withSite(L('Frequently asked questions', 'সাধারণ জিজ্ঞাসা'))
    case 'policy':
      return withSite(
        route.page === 'terms'
          ? L('Terms and conditions', 'শর্তাবলী')
          : route.page === 'privacy'
            ? L('Privacy policy', 'প্রাইভেসি পলিসি')
            : L('Return and refund policy', 'রিটার্ন ও রিফান্ড পলিসি'),
      )
    default:
      return null
  }
}
