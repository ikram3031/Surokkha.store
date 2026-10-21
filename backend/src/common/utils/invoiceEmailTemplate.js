import {
  BRAND, SANS, SERIF, resolveSite, esc, emailLayout, label, card, button, discreetNote,
} from "../templates/surokkhaBrand.js";

// Amounts arrive either as numbers or as already formatted strings ("৳1,200.00")
const money = (v) => (typeof v === "number" ? "৳" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v ?? ""));

// "Send invoice" email from the dashboard, styled like the Surokkha invoice
export const buildInvoiceEmailHtml = ({
  invoiceNumber,
  createdDate,
  buyerName,
  buyerAddress,
  buyerEmail,
  paymentMethod,
  items,
  subtotal,
  taxes,
  discount,
  total,
  invoiceUrl,
  notes,
  logoUrl,
  siteKey,
} = {}) => {
  const site = resolveSite({ site: siteKey, orderId: invoiceNumber });
  const rows = (Array.isArray(items) ? items : [])
    .map((i) => {
      const td = (c, align = "left", extra = "") =>
        `<td align="${align}" valign="top" style="font-family:${SANS};font-size:13px;color:${BRAND.ink};padding:12px 0 12px ${align === "left" ? 0 : 12}px;border-bottom:1px solid ${BRAND.line};text-align:${align};${extra}">${c}</td>`;
      return `<tr>${td(`<b style="font-weight:600">${esc(i.description || "Item")}</b>`)}${td(esc(i.quantity ?? 1), "center")}${td(esc(money(i.price)), "right", "white-space:nowrap")}${td(`<b>${esc(money(i.total ?? i.price))}</b>`, "right", "white-space:nowrap")}</tr>`;
    })
    .join("");
  const th = (t, align = "left", w = "") =>
    `<th align="${align}" ${w ? `width="${w}"` : ""} style="font-family:${SANS};font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:${BRAND.muted};font-weight:600;text-align:${align};padding:0 0 8px;border-bottom:1.5px solid ${BRAND.maroon}">${t}</th>`;
  const sumRow = (l, v) =>
    v || v === 0
      ? `<tr><td style="font-family:${SANS};font-size:13px;color:${BRAND.muted};padding:5px 0">${l}</td><td align="right" style="font-family:${SANS};font-size:13px;color:${BRAND.ink};padding:5px 0;text-align:right">${esc(money(v))}</td></tr>`
      : "";

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="top">
        <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${BRAND.maroon};line-height:1.25">Your invoice</div>
        <div style="font-family:${SANS};font-size:13.5px;color:${BRAND.muted};margin-top:6px">Hello ${esc(buyerName || "there")}, here's your invoice from ${esc(site.name)}.</div>
      </td>
      <td valign="top" align="right" style="text-align:right;white-space:nowrap;padding-left:12px">
        <div style="font-family:${SANS};font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:${BRAND.crimson};font-weight:700">Invoice</div>
        <div style="font-family:${SANS};font-size:18px;font-weight:700;color:${BRAND.maroon}">#${esc(invoiceNumber || "")}</div>
        <div style="font-family:${SANS};font-size:11.5px;color:${BRAND.muted}">${esc(createdDate || new Date().toLocaleDateString("en-GB"))}</div>
      </td>
    </tr></table>

    <div style="height:20px;line-height:20px;font-size:0">&nbsp;</div>
    ${card(`${label("Billed to")}
      <div style="font-size:14px;font-weight:700">${esc(buyerName || "Customer")}</div>
      ${buyerAddress ? `<div style="margin-top:4px">${esc(buyerAddress)}</div>` : ""}
      ${buyerEmail ? `<div style="color:${BRAND.muted}">${esc(buyerEmail)}</div>` : ""}
      ${paymentMethod ? `<div style="margin-top:6px;color:${BRAND.muted}">Payment: <b style="color:${BRAND.ink}">${esc(paymentMethod)}</b></div>` : ""}`)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:22px">
      <tr>${th("Product")}${th("Qty", "center", "48")}${th("Unit price", "right")}${th("Total", "right")}</tr>
      ${rows}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:14px">
      ${sumRow("Subtotal", subtotal)}
      ${sumRow("Taxes", taxes)}
      ${sumRow("Discount", discount)}
      <tr>
        <td style="font-family:${SANS};font-size:14px;font-weight:700;color:${BRAND.maroon};padding-top:10px;border-top:1.5px solid ${BRAND.maroon}">Grand total</td>
        <td align="right" style="font-family:${SANS};font-size:20px;font-weight:700;color:${BRAND.maroon};padding-top:10px;border-top:1.5px solid ${BRAND.maroon};text-align:right;white-space:nowrap">${esc(money(total))}</td>
      </tr>
    </table>

    ${notes ? `<div style="font-family:${SANS};font-size:12px;color:${BRAND.muted};margin-top:16px">${esc(notes)}</div>` : ""}
    ${discreetNote()}
    ${invoiceUrl ? button(invoiceUrl, "View / download invoice") : ""}`;

  return emailLayout({
    title: `Invoice #${invoiceNumber || ""} · ${site.name}`,
    preheader: `Invoice #${invoiceNumber || ""} from ${site.name}`,
    logoUrl,
    site,
    body,
  });
};

export default { buildInvoiceEmailHtml };
