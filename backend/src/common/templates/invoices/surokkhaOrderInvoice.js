/**
 * Surokkha common order invoice template (A4) shared by the dashboard and the storefront.
 * Used as the default when no active DB template (StoreSettings.templates) is configured.
 *
 * Design: maroon/rose ramp sampled from the logo, blush header band, blush table header,
 * single deep-maroon grand total block, discreet footer with support contacts.
 *
 * @param {Object} params
 * @param {Object} params.order - Formatted order data
 * @param {boolean} [params.isPrintView=false] - When true, triggers auto-print for PDF saving
 * @param {string} [params.logoUrl] - Public Surokkha logo URL
 * @returns {string} Standalone HTML string
 */
export const buildSurokkhaOrderInvoiceHtml = ({
  order = {},
  isPrintView = false,
  logoUrl = "https://admin.surokkha.store/invoice_logo.png",
}) => {
  const cleanLogoUrl = (!logoUrl || !logoUrl.startsWith("http"))
    ? "https://admin.surokkha.store/invoice_logo.png"
    : logoUrl;

  const {
    orderId = "N/A",
    status = "processing",
    orderType = "online",
    createdAt = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    customerName = "Valued Customer",
    customerPhone = "N/A",
    billingAddress = {},
    shippingAddress = null,
    items = [],
    subtotal = 0,
    shippingFee = 0,
    discountAmount = 0,
    couponCode = null,
    totalAmount = 0,
    paymentMethod = "Cash on Delivery (COD)",
  } = order;

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const taka = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatAddress = (addr) => {
    if (!addr) return "N/A";
    if (typeof addr === "string") return addr;
    if (addr.fullAddress && addr.fullAddress.trim()) return addr.fullAddress;
    const parts = [
      addr.street || addr.address,
      addr.thana,
      addr.district || addr.city || addr.state,
      addr.zipCode || addr.zip ? `Zip: ${addr.zipCode || addr.zip}` : "",
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  const deliveryAddress = formatAddress(shippingAddress || billingAddress);

  const methodLower = String(paymentMethod).toLowerCase();
  const rawPaymentStatus = String(order.paymentStatus || "").toLowerCase();
  const paidAmount = Number(order.paidAmount || 0);
  const total = Number(totalAmount || 0);
  const isCustom = orderType === "custom" || String(orderId).startsWith("CO");
  const isInstore = !isCustom && (orderType === "instore" || String(orderId).startsWith("IS") || methodLower.includes("instore") || methodLower.includes("office"));
  const isPaid = status === "completed" || methodLower.includes("paid") || rawPaymentStatus === "paid";
  const isPartial = !isPaid && (rawPaymentStatus === "partial" || rawPaymentStatus === "partially_paid" || (paidAmount > 0 && paidAmount < total));
  const due = Math.max(0, total - paidAmount);

  const typeTag = isCustom ? "Custom Order" : isInstore ? "In-store Order" : "Online Order";
  const payPill = isPaid || isInstore
    ? { cls: "paid", text: "Paid" }
    : isPartial
      ? { cls: "partial", text: "Partial Payment" }
      : { cls: "pending", text: "Pending (COD)" };

  const itemRows = items.map((item) => {
    const name = item.productName || item.name || "Product";
    const variantParts = [item.size, item.variant, item.variantName, item.packType].filter(Boolean);
    const variant = [...new Set(variantParts)].join(" • ");
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice || item.price || 0);
    const lineTotal = Number(item.subtotal || unitPrice * qty || 0);
    return `
      <tr>
        <td class="item">${esc(name)}${variant ? `<span class="variant">${esc(variant)}</span>` : ""}</td>
        <td>${qty}</td>
        <td>${taka(unitPrice)}</td>
        <td><b>${taka(lineTotal)}</b></td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice ${esc(orderId)} · Surokkha</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --maroon-900: #3a0d1a; --maroon-700: #4c1222; --maroon-500: #7a2a41; --maroon-300: #b9808f;
      --rose-600: #a82141; --rose-300: #dba0ae; --blush-100: #f6e8ec; --blush-50: #fbf4f6;
      --ink: #2a171e; --muted: #7d6a72; --line: #eddde2; --paper: #ffffff; --desk: #f1ecee;
      --paid: #1b7f45; --partial: #b45309;
      --font-display: "Fraunces", Georgia, serif;
      --font-body: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px 16px; background: var(--desk); color: var(--ink); font-family: var(--font-body); font-size: 14px; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { max-width: 794px; margin: 0 auto; background: var(--paper); overflow: hidden; box-shadow: 0 1px 2px rgba(58,13,26,.06), 0 14px 34px rgba(58,13,26,.10); }
    .bar { height: 8px; background: linear-gradient(90deg, var(--maroon-700) 0%, var(--maroon-700) 62%, var(--rose-600) 100%); }
    header { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 36px 48px 30px; background: linear-gradient(180deg, var(--blush-50), var(--paper)); }
    .logo { display: block; width: 300px; max-width: 80%; height: auto; }
    h1 { margin: 6px 0 0; font-size: 20px; font-weight: 700; letter-spacing: .02em; color: var(--maroon-700); }
    .tag { display: inline-block; padding: 3px 14px; border-radius: 999px; background: var(--blush-100); font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--rose-600); }
    .body { padding: 0 48px 36px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px 40px; padding-block: 24px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
    .meta > div { min-width: 0; }
    .label { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--maroon-300); margin: 0 0 8px; }
    .meta p { margin: 0 0 4px; overflow-wrap: anywhere; }
    .meta b { font-weight: 600; color: var(--maroon-700); }
    .name { font-size: 15px; font-weight: 700; color: var(--ink); }
    .pill { display: inline-block; padding: 1px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .pill.pending { background: var(--blush-100); color: var(--rose-600); }
    .pill.paid { background: #e3f4ea; color: var(--paid); }
    .pill.partial { background: #fef3c7; color: var(--partial); }
    .table-wrap { overflow-x: auto; padding-block: 24px 8px; }
    table { width: 100%; border-collapse: collapse; min-width: 480px; font-variant-numeric: tabular-nums; }
    thead th { text-align: right; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--maroon-500); background: var(--blush-100); padding: 10px 12px; }
    thead th:first-child { text-align: left; border-radius: 8px 0 0 8px; }
    thead th:last-child { border-radius: 0 8px 8px 0; }
    td { text-align: right; padding: 14px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
    td:first-child { text-align: left; }
    td.item { font-weight: 600; color: var(--maroon-700); }
    .variant { display: block; margin-top: 2px; font-size: 12px; font-weight: 500; color: var(--muted); }
    .totals { margin-left: auto; width: min(100%, 340px); padding-top: 12px; font-variant-numeric: tabular-nums; }
    .row { display: flex; justify-content: space-between; gap: 16px; padding: 6px 12px; color: var(--muted); }
    .row.discount { color: var(--rose-600); font-weight: 600; }
    .row.paidrow { color: var(--paid); font-weight: 600; }
    .code { display: inline-block; padding: 0 8px; border: 1px dashed var(--rose-300); border-radius: 6px; background: var(--blush-50); font-size: 12px; font-weight: 700; letter-spacing: .06em; color: var(--rose-600); }
    .grand { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; margin-top: 10px; padding: 14px 16px; border-radius: 10px; color: #fff; background: linear-gradient(100deg, var(--maroon-900), var(--maroon-700) 60%, var(--maroon-500)); }
    .grand .k { font-size: 13px; font-weight: 600; letter-spacing: .02em; color: var(--rose-300); }
    .grand .v { font-family: var(--font-display); font-size: 28px; font-weight: 700; }
    .cod { margin: 10px 0 0; text-align: right; font-size: 12px; color: var(--rose-600); font-weight: 600; }
    footer { margin-top: 36px; padding: 18px 48px 22px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 24px; font-size: 12px; color: var(--muted); background: var(--blush-50); border-top: 1px solid var(--line); }
    footer .thanks { font-family: var(--font-display); font-size: 16px; color: var(--maroon-700); }
    footer .heart { color: var(--rose-600); }
    footer .slogan { font-size: 10.5px; font-weight: 700; letter-spacing: .28em; text-transform: uppercase; color: var(--maroon-500); }
    footer a { color: var(--maroon-700); }
    .actions-bar { max-width: 794px; margin: 16px auto 0; text-align: center; }
    .btn-print { padding: 10px 20px; border: 0; border-radius: 8px; background: var(--maroon-700); color: #fff; font: 600 13px var(--font-body); cursor: pointer; }
    @media (max-width: 560px) {
      header { padding: 28px 20px 24px; }
      .body { padding: 0 20px 28px; }
      footer { padding-inline: 20px; }
      .meta { grid-template-columns: 1fr; }
    }
    @page { size: A4; margin: 8mm; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; max-width: none; }
      .actions-bar { display: none; }
    }
  </style>
</head>
<body ${isPrintView ? 'onload="setTimeout(function(){ window.print(); }, 400)"' : ""}>
  <main class="sheet">
    <div class="bar"></div>
    <header>
      <img class="logo" src="${esc(cleanLogoUrl)}" alt="Surokkha — Safe today, tomorrow">
      <h1>INVOICE #${esc(orderId)}</h1>
      <span class="tag">${esc(typeTag)}</span>
    </header>

    <div class="body">
      <section class="meta">
        <div>
          <p class="label">Customer &amp; Delivery</p>
          <p class="name">${esc(customerName)}</p>
          <p>${esc(customerPhone)}</p>
          <p style="margin-top:10px"><b>Shipping address</b><br>${esc(deliveryAddress)}</p>
        </div>
        <div>
          <p class="label">Order &amp; Payment</p>
          <p><b>Order date:</b> ${esc(createdAt)}</p>
          <p><b>Payment method:</b> ${esc(paymentMethod)}</p>
          <p><b>Payment status:</b> <span class="pill ${payPill.cls}">${payPill.text}</span></p>
          <p style="margin-top:10px"><b>Helpline:</b> 01600905774 (WhatsApp)</p>
        </div>
      </section>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>

      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${taka(subtotal)}</span></div>
        ${Number(discountAmount) > 0 ? `<div class="row discount"><span>Discount${couponCode ? ` <span class="code">${esc(couponCode)}</span>` : ""}</span><span>−${taka(discountAmount)}</span></div>` : ""}
        <div class="row"><span>Delivery fee</span><span>${Number(shippingFee) > 0 ? taka(shippingFee) : "Free"}</span></div>
        <div class="grand"><span class="k">Grand total (BDT)</span><span class="v">${taka(total)}</span></div>
        ${isPartial && paidAmount > 0 ? `
        <div class="row paidrow" style="margin-top:8px"><span>Paid / Advance</span><span>${taka(paidAmount)}</span></div>
        <p class="cod">Collect on delivery: ${taka(due)}</p>` : isPaid || isInstore ? "" : `<p class="cod">Collect on delivery: ${taka(total)}</p>`}
      </div>
    </div>

    <footer>
      <span class="thanks">Thank you for choosing Surokkha <span class="heart">♥</span></span>
      <span class="slogan">Safe today • Tomorrow</span>
      <span style="flex-basis:100%">Questions? WhatsApp <a href="https://wa.me/8801600905774">01600905774</a> or <a href="mailto:support@surokkha.store">support@surokkha.store</a></span>
    </footer>
  </main>

  <div class="actions-bar">
    <button onclick="window.print()" class="btn-print">🖨️ Print / Save as PDF</button>
  </div>
</body>
</html>
`;
};
