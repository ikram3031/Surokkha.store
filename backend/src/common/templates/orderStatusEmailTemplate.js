import { esc, fmtPhone, waLink, addressLines, variantChips, isPaidStatus, resolveSite, resolveLogo, invoiceUrl } from "./surokkhaBrand.js";

// Customer emails sent when an order's status changes (processing, hold, shipped, completed, cancelled, return).
// Email-safe: tables + inline styles only.

const C = {
  bg: "#F4EDEF", ink: "#2A1A20", muted: "#6F5F66", faint: "#A8989E", line: "#EFE4E7",
  soft: "#FBF6F8", maroon: "#72062A", crimson: "#C2003C", green: "#15803D",
};
const SANS = "'Inter','Hind Siliguri',Arial,Helvetica,sans-serif";
const SERIF = "'Playfair Display',Georgia,'Times New Roman',serif";
const money = (n) => "৳" + Math.round(Number(n || 0)).toLocaleString("en-US");

const fmtDate = (v) => {
  const d = v ? new Date(v) : new Date();
  return Number.isNaN(d.getTime()) ? String(v || "") : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

// Per-status look and copy. `step` = how far along the tracker (0 = no tracker).
export const STATUS_EMAILS = {
  processing: {
    label: "Processing", color: C.crimson, tint: "#FCE7EE", icon: "📦", step: 2,
    subject: (o) => `We've got your order, ${o.firstName}! 📦 (#${o.orderId})`,
    preheader: () => "Thanks for shopping with us. We're packing your order now.",
    heading: "We're packing your order",
    message: (o) => `Hi ${o.firstName}, thank you for shopping with us! We've received your order and our team is getting it ready. We'll email you again the moment it's on the way.`,
  },
  shipped: {
    label: "Dispatched", color: "#1D5FA8", tint: "#E3EDF9", icon: "🚚", step: 3,
    subject: (o) => `Your order is on the way 🚚${o.tracking ? ` — Tracking ${o.tracking}` : ` (#${o.orderId})`}`,
    preheader: () => "Your parcel has been handed to our courier partner.",
    heading: "Your order is on its way",
    message: (o) => `Good news, ${o.firstName}! Your parcel has been handed to our courier partner and is heading to you now.`,
  },
  completed: {
    label: "Delivered", color: C.green, tint: "#E3F3E8", icon: "🎉", step: 4,
    subject: (o) => `Delivered! Thank you for choosing ${o.siteName} 💝`,
    preheader: (o) => `Your order #${o.orderId} was delivered.`,
    heading: "Delivered — stay safe!",
    message: (o) => `Hi ${o.firstName}, your order has been delivered. We hope everything arrived in perfect condition. Thank you for trusting ${o.siteName}.`,
  },
  cancelled: {
    label: "Cancelled", color: "#4B5563", tint: "#ECEEF1", icon: "&#10005;", step: 0,
    subject: (o) => `Your order #${o.orderId} has been cancelled`,
    preheader: () => "Your order has been cancelled.",
    heading: "Your order has been cancelled",
    message: (o) => `Hi ${o.firstName}, your order has been cancelled.${o.paidAmount > 0 ? " Since you paid in advance, our team will contact you about your refund." : ""}`,
  },
  hold: {
    label: "On hold", color: "#B45309", tint: "#FDF0DC", icon: "&#10074;&#10074;", step: 2, stepLabel: "On hold",
    subject: (o) => `Your order #${o.orderId} is on hold`,
    preheader: () => "We need to confirm a few details before we continue.",
    heading: "Your order is on hold",
    message: (o) => `Hi ${o.firstName}, we've paused your order for a moment. Our team will call you to confirm a few details, or you can reach us any time using the button below.`,
  },
  return: {
    label: "Returned", color: "#6B7280", tint: "#EEF0F2", icon: "↩", step: 0,
    subject: (o) => `Your order #${o.orderId} was returned`,
    preheader: () => "Your parcel came back to us without being delivered.",
    heading: "Your parcel came back to us",
    message: (o) => `Hi ${o.firstName}, your parcel was returned to us without being delivered. If you'd still like it, message us and we'll send it again.`,
  },
};

const pill = (href, text, bg, color = "#ffffff", outline = false) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
<td align="center" ${outline ? `style="border-radius:999px;border:1.5px solid ${bg};"` : `bgcolor="${bg}" style="border-radius:999px;background:${bg};"`}>
<a href="${esc(href)}" target="_blank" style="display:inline-block;padding:${outline ? "12px 26px" : "14px 32px"};font-family:${SANS};font-size:${outline ? 14 : 15}px;font-weight:600;color:${outline ? bg : color};text-decoration:none;border-radius:999px;">${esc(text)}</a>
</td></tr></table>`;

const tracker = (meta) => {
  if (!meta.step) return "";
  const steps = ["Order placed", meta.stepLabel || "Processing", "Dispatched", "Delivered"];
  const cells = steps.map((text, i) => {
    const n = i + 1;
    const done = n < meta.step || (n === meta.step && meta.step === 4);
    const current = n === meta.step && !done;
    const lineL = i === 0 ? "transparent" : n <= meta.step ? meta.color : C.line;
    const lineR = i === 3 ? "transparent" : n < meta.step ? meta.color : C.line;
    const dot = done
      ? `<td width="26" height="26" align="center" bgcolor="${meta.color}" style="width:26px;height:26px;border-radius:50%;background:${meta.color};color:#fff;font-family:${SANS};font-size:13px;font-weight:700;line-height:26px;">&#10003;</td>`
      : `<td width="26" height="26" align="center" bgcolor="#ffffff" style="width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid ${current ? meta.color : C.line};line-height:22px;">${current ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${meta.color};vertical-align:middle;"></span>` : ""}</td>`;
    return `<td width="25%" valign="top" style="width:25%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-size:0;line-height:0;"><div style="height:2px;background:${lineL};"></div></td>${dot}<td style="font-size:0;line-height:0;"><div style="height:2px;background:${lineR};"></div></td>
</tr></table>
<p style="margin:8px 2px 0;font-family:${SANS};font-size:12px;line-height:16px;font-weight:${current ? 700 : 500};color:${done || current ? C.ink : C.faint};text-align:center;">${esc(text)}</p></td>`;
  }).join("");
  return `<tr><td style="padding:4px 32px 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table></td></tr>`;
};

// Key/value info box
const infoBox = (title, rows, meta, tinted = false) => {
  const list = rows.filter(([, v]) => v);
  if (!list.length) return "";
  const body = list.map(([k, v], i) => {
    const pb = i === list.length - 1 ? 0 : 10;
    return `<tr><td valign="top" style="padding:0 12px ${pb}px 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted};white-space:nowrap;">${esc(k)}</td>
<td valign="top" align="right" style="padding:0 0 ${pb}px;font-family:${SANS};font-size:14px;line-height:20px;font-weight:600;color:${C.ink};">${v}</td></tr>`;
  }).join("");
  const bg = tinted ? meta.tint : C.soft;
  return `<tr><td style="padding:0 32px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bg};border:1px solid ${C.line};border-radius:14px;"><tr><td style="padding:18px 20px;">
${title ? `<p style="margin:0 0 12px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${meta.color};">${esc(title)}</p>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table></td></tr></table></td></tr>`;
};

const note = (html) => `<tr><td align="center" style="padding:0 32px 34px;"><p style="margin:0;font-family:${SANS};font-size:13px;line-height:22px;color:${C.muted};">${html}</p></td></tr>`;

const summary = (o, totalNote) => {
  const rows = o.items.map((i) => {
    const name = i.productName || i.name || "Product";
    const qty = Number(i.quantity || 1);
    const line = Number(i.subtotal ?? Number(i.price ?? i.unitPrice ?? 0) * qty);
    const sub = [...variantChips(i.variantName), `Qty ${qty}`].map(esc).join(" &nbsp;·&nbsp; ");
    return `<tr>
<td width="56" valign="top" style="padding:0 0 16px;width:56px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="52" height="52" align="center" bgcolor="${C.soft}" style="width:52px;height:52px;border-radius:12px;background:${C.soft};border:1px solid ${C.line};font-family:${SERIF};font-size:22px;font-weight:700;color:${C.maroon};">${esc(name.trim().charAt(0).toUpperCase() || "•")}</td></tr></table></td>
<td valign="top" style="padding:2px 12px 16px 12px;font-family:${SANS};"><p style="margin:0;font-size:14px;line-height:20px;font-weight:600;color:${C.ink};">${esc(name)}</p><p style="margin:2px 0 0;font-size:12px;line-height:18px;color:${C.muted};">${sub}</p></td>
<td valign="top" align="right" style="padding:2px 0 16px;font-family:${SANS};font-size:14px;line-height:20px;font-weight:600;color:${C.ink};white-space:nowrap;">${money(line)}</td></tr>`;
  }).join("");
  const tr = (k, v, color = C.ink) => `<tr><td style="padding:4px 0;font-family:${SANS};font-size:14px;font-weight:500;color:${C.muted};">${k}</td><td align="right" style="padding:4px 0;font-family:${SANS};font-size:14px;font-weight:500;color:${color};white-space:nowrap;">${v}</td></tr>`;
  return `<tr><td style="padding:8px 32px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-family:${SERIF};font-size:20px;font-weight:700;color:${C.maroon};">Order summary</td>
<td align="right" style="font-family:${SANS};font-size:12px;color:${C.muted};">#${esc(o.orderId)} &nbsp;·&nbsp; ${esc(fmtDate(o.createdAt))}</td></tr></table>
<div style="height:1px;background:${C.line};margin:14px 0 18px;"></div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
<div style="height:1px;background:${C.line};margin:0 0 12px;"></div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${tr("Subtotal", money(o.subtotal))}
${tr("Delivery", money(o.shippingFee))}
${Number(o.discountAmount) > 0 ? tr(`Discount${o.couponCode ? ` <span style="font-size:12px;color:${C.crimson};">(${esc(o.couponCode)})</span>` : ""}`, `−${money(o.discountAmount)}`, C.green) : ""}
<tr><td colspan="2" style="padding:8px 0 4px;"><div style="height:1px;background:${C.line};"></div></td></tr>
<tr><td style="padding:4px 0;font-family:${SANS};font-size:16px;font-weight:700;color:${C.ink};">Total</td>
<td align="right" style="padding:4px 0;font-family:${SANS};font-size:16px;font-weight:700;color:${C.maroon};white-space:nowrap;">${money(o.totalAmount)}</td></tr>
${totalNote ? `<tr><td colspan="2" style="padding:2px 0 0;font-family:${SANS};font-size:12px;color:${C.muted};text-align:right;">${esc(totalNote)}</td></tr>` : ""}
</table></td></tr>`;
};

const addressAndPayment = (o, paymentLines) => {
  const col = (title, html) => `<div class="col" style="display:inline-block;width:100%;max-width:262px;vertical-align:top;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 8px 18px 0;font-family:${SANS};">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${C.crimson};">${title}</p>
<p style="margin:0;font-size:14px;line-height:22px;color:${C.ink};">${html}</p></td></tr></table></div>`;
  const addr = [`<strong>${esc(o.recipient)}</strong>`, ...o.address.map(esc), o.phone ? esc(fmtPhone(o.phone)) : ""].filter(Boolean).join("<br>");
  return `<tr><td style="padding:28px 32px 10px;"><div style="height:1px;background:${C.line};margin:0 0 22px;"></div>
<div style="font-size:0;">${col("Delivery address", addr)}${col("Payment", paymentLines.join("<br>"))}</div></td></tr>`;
};

const helpBox = (site) => `<tr><td style="padding:10px 32px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.soft};border-radius:14px;"><tr><td style="padding:18px 20px;font-family:${SANS};">
<p style="margin:0;font-size:14px;line-height:21px;color:${C.ink};"><strong>Need help with your order?</strong></p>
<p style="margin:4px 0 0;font-size:13px;line-height:20px;color:${C.muted};">${site.helpline ? `Message us on <a href="${esc(waLink(site.helpline))}" style="color:${C.crimson};font-weight:600;text-decoration:none;">WhatsApp ${esc(fmtPhone(site.helpline))}</a>, ` : ""}${site.email ? `email <a href="mailto:${esc(site.email)}" style="color:${C.crimson};font-weight:600;text-decoration:none;">${esc(site.email)}</a>, ` : ""}or just reply to this email.</p>
</td></tr></table></td></tr>`;

const footer = (site, trackHref) => {
  const sep = `<span style="color:#B76A84;">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`;
  const links = [
    site.url && [site.url, "Shop"],
    trackHref && [trackHref, "View order"],
    site.helpline && [waLink(site.helpline), "WhatsApp"],
  ].filter(Boolean).map(([h, t]) => `<a href="${esc(h)}" style="color:#ffffff;text-decoration:none;font-weight:600;">${t}</a>`).join(sep);
  return `<tr><td align="center" bgcolor="${C.maroon}" style="background:${C.maroon};padding:30px 32px 32px;">
<p style="margin:0;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:4px;color:#F7C9D6;">SAFE TODAY &nbsp;&#9679;&nbsp; TOMORROW</p>
${links ? `<p style="margin:18px 0 0;font-family:${SANS};font-size:13px;line-height:20px;">${links}</p>` : ""}
<p style="margin:20px 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:#D9A3B4;">${esc(site.name)} · Dhaka, Bangladesh<br>You're receiving this email because you placed an order with us.</p>
</td></tr>`;
};

/**
 * order: formatted order (same shape as the invoice email) plus optional `courier`.
 * Returns { subject, html } or null for statuses that don't email the customer.
 */
export const buildOrderStatusEmail = ({ status, order = {}, logoUrl } = {}) => {
  const meta = STATUS_EMAILS[status];
  if (!meta) return null;

  const site = resolveSite({ orderId: order.orderId, clientDomain: order.clientDomain });
  const logo = resolveLogo(logoUrl, site);
  const deliverTo = order.shippingAddress && Object.keys(order.shippingAddress).length ? order.shippingAddress : order.billingAddress || {};
  const recipient = deliverTo.fullName || deliverTo.name || order.customerName || "Valued Customer";
  const courier = order.courier || {};
  const totalAmount = Number(order.totalAmount || 0);
  const paidAmount = Number(order.paidAmount || 0);
  const isPaid = isPaidStatus(order.paymentStatus) || (totalAmount > 0 && paidAmount >= totalAmount);
  const due = Math.max(0, totalAmount - paidAmount);
  const method = /^cod$/i.test(order.paymentMethod || "") ? "Cash on Delivery" : order.paymentMethod || "Cash on Delivery";

  const o = {
    ...order,
    orderId: order.orderId || "",
    items: Array.isArray(order.items) ? order.items : [],
    firstName: String(order.customerName || recipient).trim().split(/\s+/)[0] || "there",
    siteName: site.name,
    recipient,
    phone: deliverTo.phone || order.customerPhone || "",
    address: addressLines(deliverTo),
    tracking: courier.trackingCode || courier.consignmentId || "",
    paidAmount,
  };
  const trackHref = o.orderId ? invoiceUrl(o.orderId, site) : "";
  const helpHref = site.helpline ? waLink(site.helpline) : site.email ? `mailto:${site.email}` : trackHref;

  // Status-specific middle section
  let middle = "";
  if (status === "processing") {
    middle = infoBox("", [["Order number", `#${esc(o.orderId)}`], ["Delivery area", esc(deliverTo.district || deliverTo.city || "")]], meta)
      + (trackHref ? `<tr><td align="center" style="padding:0 32px 32px;">${pill(trackHref, "View my order", meta.color)}</td></tr>` : "");
  } else if (status === "shipped") {
    const provider = /redx/i.test(courier.provider || "") ? "RedX" : courier.provider ? "Pathao" : "";
    middle = infoBox("Shipment details", [
      ["Courier", esc(provider)],
      ["Tracking ID", o.tracking ? `<span style="font-family:Consolas,Menlo,monospace;letter-spacing:.5px;">${esc(o.tracking)}</span>` : ""],
      ["Dispatched on", esc(fmtDate(courier.dispatchedAt))],
    ], meta, true)
      + (trackHref ? `<tr><td align="center" style="padding:0 32px 14px;">${pill(trackHref, "View my order", meta.color)}</td></tr>` : "")
      + note(`The delivery person will call <strong style="color:${C.ink};">${esc(fmtPhone(o.phone))}</strong> before arriving.${due > 0 ? `<br>Please keep <strong style="color:${C.ink};">${money(due)}</strong> ready for Cash on Delivery.` : ""}`);
  } else if (status === "completed") {
    middle = (site.url ? `<tr><td align="center" style="padding:0 32px 14px;">${pill(site.url, "Shop again", C.maroon)}</td></tr>` : "")
      + note("Something not right? Just reply to this email and we'll sort it out.");
  } else if (status === "cancelled") {
    middle = infoBox("Cancellation details", [
      ["Cancelled on", esc(fmtDate())],
      ["Paid in advance", paidAmount > 0 ? `<span style="color:${C.maroon};">${money(paidAmount)}</span>` : ""],
    ], meta, true)
      + (site.url ? `<tr><td align="center" style="padding:0 32px 14px;">${pill(site.url, "Continue shopping", C.maroon)}</td></tr>` : "")
      + note(`Didn't ask to cancel this order? <a href="${esc(helpHref)}" style="color:${C.crimson};font-weight:600;text-decoration:none;">Contact us right away</a> and we'll sort it out.`);
  } else if (status === "hold") {
    middle = infoBox("What happens next", [["Order", `#${esc(o.orderId)}`], ["Status", `<span style="color:${meta.color};">Waiting for confirmation</span>`]], meta, true)
      + (helpHref ? `<tr><td align="center" style="padding:0 32px 14px;">${pill(helpHref, site.helpline ? "Message us on WhatsApp" : "Contact us", meta.color)}</td></tr>` : "")
      + note("Once everything is confirmed, we'll continue with your order right away.");
  } else if (status === "return") {
    middle = (helpHref ? `<tr><td align="center" style="padding:0 32px 14px;">${pill(helpHref, "Send it again", C.maroon)}</td></tr>` : "")
      + note("We'd be happy to deliver it again whenever you're ready.");
  }

  const totalNote = {
    processing: isPaid ? "Paid" : "To be paid on delivery",
    shipped: isPaid ? "Paid" : `To be paid on delivery`,
    completed: `Paid · ${method}`,
    cancelled: paidAmount > 0 ? "Refund to be arranged" : "Order cancelled",
    hold: isPaid ? "Paid" : "Awaiting confirmation",
    return: "Returned",
  }[status];

  const paymentLines = [`<strong>${esc(method)}</strong>`];
  if (status === "completed" || isPaid) paymentLines.push(`Paid ${money(isPaid ? totalAmount : paidAmount)}`);
  else if (status === "cancelled" || status === "return") { if (paidAmount > 0) paymentLines.push(`Paid in advance: ${money(paidAmount)}`); }
  else {
    if (paidAmount > 0) paymentLines.push(`Paid in advance: ${money(paidAmount)}`);
    paymentLines.push(`Amount due: ${money(due)}`);
  }

  const subject = meta.subject(o);
  const preheader = meta.preheader(o);
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Hind+Siliguri:wght@500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
@media (max-width:620px){
  .email td[style*="padding:0 32px"],.email td[style*="padding:4px 32px"],.email td[style*="padding:8px 32px"],.email td[style*="padding:10px 32px"],.email td[style*="padding:28px 32px"],.email td[style*="padding:36px 32px"]{padding-left:20px!important;padding-right:20px!important}
  .email h1{font-size:25px!important;line-height:32px!important}
  .email .col{max-width:100%!important}
}
</style></head>
<body style="margin:0;padding:0;background:${C.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background:${C.bg};">
<tr><td align="center" style="padding:28px 12px;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${C.bg};">${esc(preheader)}</div>
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="email" style="width:100%;max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;">
<tr><td style="height:5px;line-height:5px;font-size:0;background:${C.maroon};background-image:linear-gradient(90deg,${C.maroon},${C.crimson});">&nbsp;</td></tr>
<tr><td align="center" style="padding:26px 32px 20px;border-bottom:1px solid ${C.line};">
${logo
    ? `<a href="${esc(site.url || "#")}"><img src="${esc(logo)}" width="190" alt="${esc(site.name)}" style="display:block;width:190px;max-width:60%;height:auto;border:0;"></a>`
    : `<div style="font-family:${SERIF};font-size:28px;font-weight:700;color:${C.maroon};">${esc(site.name)}</div>`}
</td></tr>
<tr><td align="center" style="padding:36px 32px 8px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="68" height="68" align="center" valign="middle" bgcolor="${meta.tint}" style="width:68px;height:68px;border-radius:50%;background:${meta.tint};font-size:30px;line-height:68px;color:${meta.color};font-family:${SANS};font-weight:700;">${meta.icon}</td>
</tr></table>
<p style="margin:18px 0 0;"><span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${meta.tint};font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${meta.color};">Order #${esc(o.orderId)} · ${esc(meta.label)}</span></p>
<h1 style="margin:14px 0 0;font-family:${SERIF};font-size:30px;line-height:38px;font-weight:700;color:${C.maroon};">${esc(meta.heading)}</h1>
<p style="margin:12px auto 0;max-width:440px;font-family:${SANS};font-size:15px;line-height:24px;color:${C.muted};">${esc(meta.message(o))}</p>
</td></tr>
<tr><td style="height:28px;line-height:28px;font-size:0;">&nbsp;</td></tr>
${tracker(meta)}
${middle}
${o.items.length ? summary(o, totalNote) : ""}
${addressAndPayment(o, paymentLines)}
${helpBox(site)}
${footer(site, trackHref)}
</table>
</td></tr></table>
</body></html>`;

  return { subject, html };
};

export default { buildOrderStatusEmail, STATUS_EMAILS };
