import { buildDecantreOrderInvoiceHtml } from "./decantreOrderInvoice.js";
import { buildSurokkhaOrderInvoiceHtml } from "./surokkhaOrderInvoice.js";
import { buildDashboardInvoiceHtml } from "../dashboardInvoiceTemplate.js";
import { buildOrderInvoiceEmailHtml } from "../orderInvoiceEmailTemplate.js";

/**
 * Registry of client-specific invoice templates.
 * Each client brand (Decantre, Surokkha, Engulfic, Toyoland, etc.) can maintain their own tailored invoice design.
 */
const CLIENT_INVOICE_TEMPLATES = {
  decantre: buildDecantreOrderInvoiceHtml,
  surokkha: buildSurokkhaOrderInvoiceHtml,
  // Add other client templates here:
  // engulfic: buildEngulficOrderInvoiceHtml,
  // toyoland: buildToyolandOrderInvoiceHtml,
};

import { config } from "../../config/index.js";

/**
 * Multi-Client Invoice Template Resolver.
 * Resolves the tailored invoice template based on client identifier, with graceful fallback.
 *
 * @param {Object} params
 * @param {Object} params.order - Formatted order data
 * @param {string} [params.client] - Client store identifier ('decantre', 'surokkha', 'engulfic', 'toyoland')
 * @param {boolean} [params.isPrintView=false] - Print mode toggle
 * @param {string} [params.logoUrl] - Custom logo URL
 * @returns {string} Fully rendered HTML string
 */
export const getClientInvoiceHtml = ({
  order = {},
  client,
  isPrintView = false,
  logoUrl,
}) => {
  const activeClient = (client || order?.client || config.clientKey || process.env.CLIENT_NAME || "surokkha").toLowerCase().trim();
  const templateBuilder = CLIENT_INVOICE_TEMPLATES[activeClient] || (activeClient === "surokkha" ? buildSurokkhaOrderInvoiceHtml : buildDecantreOrderInvoiceHtml);

  return templateBuilder({ order, isPrintView, logoUrl });
};

export {
  buildDecantreOrderInvoiceHtml,
  buildSurokkhaOrderInvoiceHtml,
  buildDashboardInvoiceHtml,
  buildOrderInvoiceEmailHtml,
};
