import { config } from "../config/index.js";

// Shared Surokkha brand styling for the invoice page and every email template.
// Emails can't rely on CSS variables, grid or scripts, so everything here is inline styles and tables.
// Domain, brand name, contacts, links and logo come from the client config per site (shop / store).

export const BRAND = {
  ink: "#1f0d14",
  maroon: "#4a0d22",
  maroon2: "#6b1530",
  crimson: "#c0264b",
  blush: "#fbf1f4",
  line: "#ecdde2",
  muted: "#7a6670",
  ok: "#1f7a4d",
  page: "#f4eef0",
};

const trimSlash = (u) => String(u || "").replace(/\/+$/, "");

// Picks the site an order or email belongs to: explicit key, the order number prefix (SH / ST),
// then the order's domain. The prefix comes first because store orders are saved with the shop domain.
const pickSiteKey = ({ site, clientDomain, orderId } = {}) => {
  const sites = config.sites || {};
  if (site && sites[site]) return site;
  const id = String(orderId || "").toUpperCase();
  const byPrefix = Object.keys(sites).find((k) => sites[k].orderPrefix && id.startsWith(String(sites[k].orderPrefix).toUpperCase()));
  if (byPrefix) return byPrefix;
  const domain = String(clientDomain || "").toLowerCase();
  const byDomain = Object.keys(sites).find((k) => domain && domain.includes(String(sites[k].domain || "").toLowerCase()));
  return byDomain || (sites.shop ? "shop" : Object.keys(sites)[0]);
};

// Brand identity for one site, all read from the client config
export const resolveSite = (opts = {}) => {
  const key = pickSiteKey(opts);
  const s = (config.sites || {})[key] || {};
  const domain = s.domain || config.domain || "";
  const apiBase = trimSlash(s.apiBaseUrl || config.apiBaseUrl);
  const dashboardUrl = trimSlash(config.dashboardUrl);
  return {
    key,
    domain,
    name: s.name || config.brandName || domain,
    url: trimSlash(s.storefrontUrl || s.url || config.storefrontUrl || (domain ? `https://${domain}` : "")),
    email: s.supportEmail || config.supportEmail || (domain ? `support@${domain}` : ""),
    helpline: s.whatsappNumber || config.whatsappNumber || config.supportPhone || config.phone || "",
    invoiceBase: apiBase ? `${apiBase}${s.invoicePath || "/api/v1/orders"}` : "",
    tagline: config.tagline || "Safe today · Tomorrow",
    logo: dashboardUrl ? `${dashboardUrl}/invoice_logo.png` : "",
  };
};

// Always the brand's own logo; a caller-supplied absolute URL is only a fallback
export const resolveLogo = (logoUrl, site = resolveSite()) =>
  site.logo || (logoUrl && /^https?:\/\//.test(logoUrl) ? logoUrl : "");

export const FONT_LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">';
export const SANS = "Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const SERIF = "Fraunces,Georgia,'Times New Roman',serif";

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const tk = (n) =>
  "৳" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// 8801711711621 / 01711711621 -> +880 1711-711621
export const fmtPhone = (p) => {
  const d = String(p || "").replace(/\D/g, "").replace(/^880/, "0");
  return d.length === 11 ? `+880 ${d.slice(1, 5)}-${d.slice(5)}` : String(p || "");
};

export const waLink = (p) => "https://wa.me/880" + String(p || "").replace(/\D/g, "").replace(/^880/, "").replace(/^0/, "");

// Address object (billingInfo / shippingInfo) or string -> display lines
export const addressLines = (addr) => {
  if (!addr) return [];
  if (typeof addr === "string") return [addr];
  const street = addr.street || addr.address || "";
  const area = [addr.thana, addr.district || addr.city || addr.state, addr.zipCode || addr.zip].filter(Boolean).join(", ");
  return [street, area].filter(Boolean);
};

// "Thin x4 • Dotted x3" -> [["Thin x4"], ...] chips; plain variant text stays one chip
export const variantChips = (variantName) =>
  String(variantName || "")
    .split(/\s*•\s*/)
    .map((v) => v.trim())
    .filter(Boolean);

export const isPaidStatus = (status) => ["paid", "completed"].includes(String(status || "").toLowerCase());

// Brand logo header (falls back to a text wordmark only if no logo URL can be resolved)
export const brandHeader = (logoUrl, site = resolveSite()) => {
  const src = resolveLogo(logoUrl, site);
  return src
    ? `<img src="${esc(src)}" alt="${esc(site.name)}" height="44" style="display:block;height:44px;width:auto;max-width:220px;border:0;outline:none">`
    : `<div style="font-family:${SERIF};font-weight:600;font-size:30px;line-height:1;color:${BRAND.maroon}">${esc(site.name)}</div>
       <div style="margin-top:6px;font-family:${SANS};font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:${BRAND.muted}">${esc(site.tagline)}</div>`;
};

// Primary call-to-action button (bulletproof table button)
export const button = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto 4px">
    <tr><td bgcolor="${BRAND.maroon}" style="border-radius:999px;background:${BRAND.maroon}">
      <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:12px 26px;font-family:${SANS};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a>
    </td></tr>
  </table>`;

// Small uppercase crimson label used above sections
export const label = (text) =>
  `<div style="font-family:${SANS};font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${BRAND.crimson};font-weight:700;margin-bottom:8px">${esc(text)}</div>`;

// Soft blush card
export const card = (inner) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate">
    <tr><td bgcolor="${BRAND.blush}" style="background:${BRAND.blush};border-radius:10px;padding:14px 16px;font-family:${SANS};font-size:13px;line-height:1.55;color:${BRAND.ink}">${inner}</td></tr>
  </table>`;

// Full email document: gradient top bar, brand header, body, blush footer
export const emailLayout = ({ title, preheader = "", logoUrl, body, footerNote = "", site = resolveSite() }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${FONT_LINK}
<style>
  @media only screen and (max-width:620px){
    .sk-container{width:100% !important}
    .sk-pad{padding-left:20px !important;padding-right:20px !important}
    .sk-col{display:block !important;width:100% !important;padding:0 0 12px 0 !important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.page};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.page}" style="background:${BRAND.page}">
  <tr><td align="center" style="padding:28px 12px">
    <table role="presentation" class="sk-container" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BRAND.line}">
      <tr><td height="6" style="height:6px;line-height:6px;font-size:0;background:${BRAND.maroon};background-image:linear-gradient(90deg,${BRAND.maroon},${BRAND.crimson})">&nbsp;</td></tr>
      <tr><td class="sk-pad" style="padding:28px 36px 0">${brandHeader(logoUrl, site)}</td></tr>
      <tr><td class="sk-pad" style="padding:22px 36px 30px;font-family:${SANS};font-size:13.5px;line-height:1.6;color:${BRAND.ink}">${body}</td></tr>
      <tr><td class="sk-pad" bgcolor="${BRAND.blush}" style="background:${BRAND.blush};border-top:1px solid ${BRAND.line};padding:18px 36px">
        <div style="font-family:${SERIF};font-size:15px;font-weight:600;color:${BRAND.maroon}">Thank you for choosing ${esc(site.name)}</div>
        <div style="font-family:${SANS};font-size:11.5px;color:${BRAND.muted};margin-top:3px">
          ${site.helpline ? `WhatsApp <a href="${waLink(site.helpline)}" style="color:${BRAND.ink};font-weight:600;text-decoration:none">${fmtPhone(site.helpline)}</a>` : ""}
          ${site.helpline && site.email ? "&middot;" : ""}
          ${site.email ? `<a href="mailto:${esc(site.email)}" style="color:${BRAND.ink};font-weight:600;text-decoration:none">${esc(site.email)}</a>` : ""}
          ${site.url ? `&middot; <a href="${esc(site.url)}" style="color:${BRAND.ink};font-weight:600;text-decoration:none">${esc(site.domain)}</a>` : ""}
        </div>
        ${footerNote ? `<div style="font-family:${SANS};font-size:11px;color:${BRAND.muted};margin-top:8px">${footerNote}</div>` : ""}
        <div style="font-family:${SANS};font-size:10.5px;color:${BRAND.muted};margin-top:8px">&copy; ${new Date().getFullYear()} ${esc(site.name)}. All rights reserved.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

// Order line items as an email-safe table (product / qty / unit / total)
export const itemsTable = (items = []) => {
  const th = (t, align = "left", w = "") =>
    `<th align="${align}" ${w ? `width="${w}"` : ""} style="font-family:${SANS};font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:${BRAND.muted};font-weight:600;text-align:${align};padding:0 0 8px;border-bottom:1.5px solid ${BRAND.maroon}">${t}</th>`;
  const rows = items
    .map((i) => {
      const qty = Number(i.quantity || 1);
      const unit = Number(i.price ?? i.unitPrice ?? 0);
      const total = Number(i.subtotal || unit * qty);
      const chips = variantChips(i.variantName)
        .map((v) => `<span style="display:inline-block;font-size:10.5px;background:${BRAND.blush};color:${BRAND.maroon2};border:1px solid ${BRAND.line};border-radius:999px;padding:1px 8px;margin:6px 4px 0 0">${esc(v)}</span>`)
        .join("");
      const td = (c, align = "left", extra = "") =>
        `<td align="${align}" valign="top" style="font-family:${SANS};font-size:13px;color:${BRAND.ink};padding:12px 0 12px ${align === "left" ? 0 : 12}px;border-bottom:1px solid ${BRAND.line};text-align:${align};${extra}">${c}</td>`;
      return `<tr>
        ${td(`<div style="font-weight:600">${esc(i.productName || i.name || "Product")}</div>${chips}`)}
        ${td(String(qty), "center")}
        ${td(tk(unit), "right", "white-space:nowrap")}
        ${td(`<b>${tk(total)}</b>`, "right", "white-space:nowrap")}
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:22px">
    <tr>${th("Product")}${th("Qty", "center", "48")}${th("Unit price", "right")}${th("Total", "right")}</tr>
    ${rows}
  </table>`;
};

// Subtotal / delivery / discount / grand total block
export const totalsTable = ({ subtotal = 0, shippingFee = 0, discountAmount = 0, couponCode = null, totalAmount = 0 }) => {
  const row = (l, v, color = BRAND.ink) =>
    `<tr><td style="font-family:${SANS};font-size:13px;color:${BRAND.muted};padding:5px 0">${l}</td><td align="right" style="font-family:${SANS};font-size:13px;color:${color};font-weight:500;padding:5px 0;text-align:right">${v}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
    ${row("Subtotal", tk(subtotal))}
    ${row("Delivery fee", tk(shippingFee))}
    ${Number(discountAmount) > 0 ? row(`Discount${couponCode ? ` (${esc(couponCode)})` : ""}`, "−" + tk(discountAmount), BRAND.ok) : ""}
    <tr>
      <td style="font-family:${SANS};font-size:14px;font-weight:700;color:${BRAND.maroon};padding-top:10px;border-top:1.5px solid ${BRAND.maroon}">Grand total</td>
      <td align="right" style="font-family:${SANS};font-size:20px;font-weight:700;color:${BRAND.maroon};padding-top:10px;border-top:1.5px solid ${BRAND.maroon};text-align:right;white-space:nowrap">${tk(totalAmount)}</td>
    </tr>
  </table>`;
};

// Maroon "collect on delivery" / green "paid" box
export const paymentBox = ({ totalAmount = 0, paymentMethod = "Cash on Delivery", paymentStatus }) => {
  const paid = isPaidStatus(paymentStatus);
  const bg = paid ? BRAND.ok : BRAND.maroon;
  const grad = paid ? `linear-gradient(135deg,#145a39,${BRAND.ok})` : `linear-gradient(135deg,${BRAND.maroon},${BRAND.maroon2})`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate">
    <tr><td bgcolor="${bg}" style="background:${bg};background-image:${grad};border-radius:12px;padding:16px 18px;font-family:${SANS};color:#ffffff">
      <div style="font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;opacity:.8">${paid ? "Payment received" : "Collect on delivery"}</div>
      <div style="font-size:26px;font-weight:700;margin:4px 0 2px;letter-spacing:-.5px">${paid ? "Paid" : tk(totalAmount)}</div>
      <div style="font-size:11px;opacity:.88">${paid ? `${esc(paymentMethod)} · nothing to collect` : "Courier: collect this exact amount in cash"}</div>
    </td></tr>
  </table>`;
};

export const discreetNote = () => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;border-collapse:separate">
    <tr><td style="border:1px dashed ${BRAND.line};border-radius:10px;padding:10px 14px;font-family:${SANS};font-size:11.5px;color:${BRAND.muted}">
      &#128230; <b style="color:${BRAND.ink}">Discreetly packed.</b> Plain outer packaging, no product names on the parcel.
    </td></tr>
  </table>`;

export const invoiceUrl = (orderId, site = resolveSite({ orderId })) =>
  site.invoiceBase ? `${site.invoiceBase}/${encodeURIComponent(orderId)}/invoice` : "";
