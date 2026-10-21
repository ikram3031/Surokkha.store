import { buildSurokkhaOrderInvoiceHtml } from "./surokkhaOrderInvoice.js";
import { config } from "../../config/index.js";

const CLIENT_INVOICE_TEMPLATES = {
  surokkha: buildSurokkhaOrderInvoiceHtml,
};

// Resolves the client invoice template. The branded Surokkha design is always used, so a
// template saved in the dashboard customizer (templateConfig) no longer overrides it.
export const getClientInvoiceHtml = ({
  order = {},
  client,
  isPrintView = false,
  logoUrl,
  brandName,
  address,
  phone,
  email,
  templateConfig, // eslint-disable-line no-unused-vars
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
};

export default {
  getClientInvoiceHtml,
  buildSurokkhaOrderInvoiceHtml,
};
