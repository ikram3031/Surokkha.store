import { buildSurokkhaOrderInvoiceHtml } from "./surokkhaOrderInvoice.js";
import { buildDashboardInvoiceHtml } from "../dashboardInvoiceTemplate.js";
import { config } from "../../config/index.js";

const CLIENT_INVOICE_TEMPLATES = {
  surokkha: buildSurokkhaOrderInvoiceHtml,
};

// Resolves client-specific or fallback invoice template HTML
export const getClientInvoiceHtml = ({
  order = {},
  client,
  isPrintView = false,
  logoUrl,
  brandName,
  address,
  phone,
  email,
  ...rest
} = {}) => {
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
