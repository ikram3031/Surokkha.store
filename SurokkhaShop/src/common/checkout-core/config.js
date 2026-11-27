import { SITE_CONFIG } from '../config/siteConfig';

// Shared checkout settings, kept in step with the Store's checkout core
export const PAYMENT_METHOD = 'cod';

export const ORDER_PREFIX = SITE_CONFIG.orderPrefix;

export const LEAD_DEBOUNCE_MS = 1500;

export const MIN_ACTION_MS = 350;
