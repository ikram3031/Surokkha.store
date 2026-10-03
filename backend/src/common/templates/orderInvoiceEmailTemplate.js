import { getClientInvoiceHtml } from './invoices/index.js';

/**
 * Builds HTML email body with embedded order invoice for customer confirmation
 */
export const buildOrderInvoiceEmailHtml = (options = {}) => {
  return getClientInvoiceHtml(options);
};

export default { buildOrderInvoiceEmailHtml };
