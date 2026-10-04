import { getClientInvoiceHtml } from './invoices/index.js';
import { compileTransactionalEmailHtml } from './invoices/templateEngine.js';
import { config } from '../config/index.js';

// Builds HTML email body with embedded order invoice for customer confirmation
export const buildOrderInvoiceEmailHtml = (options = {}) => {
  if (options.templateConfig) {
    try {
      return compileTransactionalEmailHtml({
        templateConfig: options.templateConfig,
        order: options.order || options,
        clientConfig: config,
      });
    } catch (err) {
      console.warn('Dynamic email template compilation fallback:', err.message);
    }
  }
  return getClientInvoiceHtml(options);
};

export default { buildOrderInvoiceEmailHtml };

