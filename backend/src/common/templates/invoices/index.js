import { buildSurokkhaOrderInvoiceHtml } from "./surokkhaOrderInvoice.js";
import { buildDashboardInvoiceHtml } from "../dashboardInvoiceTemplate.js";
import { config } from "../../config/index.js";
import { compileA4InvoiceHtml } from "./templateEngine.js";

const CLIENT_INVOICE_TEMPLATES = {
  surokkha: buildSurokkhaOrderInvoiceHtml,
};

// Resolves client-specific, dynamic customizer, or fallback invoice template HTML
export const getClientInvoiceHtml = ({
  order = {},
  client,
  isPrintView = false,
  logoUrl,
  brandName,
  address,
  phone,
  email,
  templateConfig,
  ...rest
} = {}) => {
  if (templateConfig) {
    try {
      return compileA4InvoiceHtml({
        templateConfig,
        order,
        clientConfig: config,
        isPrintView,
      });
    } catch (err) {
      console.warn("Dynamic template compilation fallback to default:", err.message);
    }
  }

  const activeClient = (client || order?.client || config.clientKey || process.env.CLIENT_NAME || "surokkha").toLowerCase().trim();
  const templateBuilder = CLIENT_INVOICE_TEMPLATES[activeClient] || buildSurokkhaOrderInvoiceHtml;

  return templateBuilder({
    order,
    isPrintView,
    logoUrl,
    brandName,
    address,
    phone,
    email,
    ...rest,
  });
};

export {
  buildSurokkhaOrderInvoiceHtml,
  buildDashboardInvoiceHtml,
};

export default {
  getClientInvoiceHtml,
  buildSurokkhaOrderInvoiceHtml,
  buildDashboardInvoiceHtml,
};
