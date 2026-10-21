import {
  BRAND, SANS, resolveSite, SERIF, esc, fmtPhone, addressLines, emailLayout, label, card,
  itemsTable, totalsTable, paymentBox, discreetNote, button, invoiceUrl,
} from "./surokkhaBrand.js";

// Customer order confirmation email, styled like the Surokkha invoice
export const buildOrderInvoiceEmailHtml = ({ order = {}, logoUrl } = {}) => {
  const {
    orderId = "",
    createdAt = "",
    customerName = "Valued Customer",
    customerPhone = "",
    billingAddress = {},
    shippingAddress = null,
    items = [],
    paymentMethod = "Cash on Delivery",
  } = order;

  const site = resolveSite({ orderId, clientDomain: order.clientDomain });
  const deliverTo = shippingAddress && Object.keys(shippingAddress).length ? shippingAddress : billingAddress;
  const method = /^cod$/i.test(paymentMethod) ? "Cash on Delivery" : paymentMethod;
  const address = addressLines(deliverTo);

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="top">
        <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${BRAND.maroon};line-height:1.25">Thank you for your order</div>
        <div style="font-family:${SANS};font-size:13.5px;color:${BRAND.muted};margin-top:6px">Hello ${esc(customerName)}, we've received your order and it's now being processed.</div>
      </td>
      <td valign="top" align="right" style="text-align:right;white-space:nowrap;padding-left:12px">
        <div style="font-family:${SANS};font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:${BRAND.crimson};font-weight:700">Order</div>
        <div style="font-family:${SANS};font-size:18px;font-weight:700;color:${BRAND.maroon}">#${esc(orderId)}</div>
        <div style="font-family:${SANS};font-size:11.5px;color:${BRAND.muted}">${esc(createdAt)}</div>
      </td>
    </tr></table>

    <div style="height:20px;line-height:20px;font-size:0">&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="sk-col" width="56%" valign="top" style="padding-right:7px">
        ${card(`${label("Deliver to")}
          <div style="font-size:14px;font-weight:700">${esc(deliverTo?.fullName || deliverTo?.name || customerName)}</div>
          ${deliverTo?.phone || customerPhone ? `<div style="color:${BRAND.muted}">${esc(fmtPhone(deliverTo?.phone || customerPhone))}</div>` : ""}
          ${address.length ? `<div style="margin-top:6px">${address.map(esc).join("<br>")}</div>` : ""}`)}
      </td>
      <td class="sk-col" width="44%" valign="top" style="padding-left:7px">
        ${card(`${label("Payment")}
          <div style="font-weight:600">${esc(method)}</div>
          <div style="color:${BRAND.muted};margin-top:4px">${items.reduce((s, i) => s + Number(i.quantity || 1), 0)} item(s)</div>`)}
      </td>
    </tr></table>

    ${itemsTable(items)}

    <div style="height:18px;line-height:18px;font-size:0">&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="sk-col" width="50%" valign="top" style="padding-right:10px">${paymentBox(order)}</td>
      <td class="sk-col" width="50%" valign="top" style="padding-left:10px">${totalsTable(order)}</td>
    </tr></table>

    ${discreetNote()}
    ${orderId ? button(invoiceUrl(orderId, site), "View / download invoice") : ""}`;

  return emailLayout({
    title: `Order #${orderId} confirmed · ${site.name}`,
    preheader: `We've received your order #${orderId}.`,
    logoUrl,
    site,
    body,
  });
};

export default { buildOrderInvoiceEmailHtml };
