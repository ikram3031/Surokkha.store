import { BRAND, esc, tk, fmtPhone, waLink, addressLines, variantChips, isPaidStatus, resolveSite, resolveLogo } from "../surokkhaBrand.js";

const SOURCE_LABELS = { online: "Online order", custom: "Custom order", instore: "In-store order" };

// Accepts "October 20, 2026", an ISO string or a Date and prints "20 Oct 2026"
const fmtDate = (value) => {
  const d = value ? new Date(value) : new Date();
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/**
 * Surokkha A4 invoice page shared by the dashboard, the storefront and the order emails' "view invoice" link.
 * Rendered server-side from formatted order data; only the WhatsApp QR code uses a script.
 */
export const buildSurokkhaOrderInvoiceHtml = ({ order = {}, logoUrl }) => {
  const site = resolveSite({ orderId: order.orderId, clientDomain: order.clientDomain });
  const cleanLogoUrl = resolveLogo(logoUrl, site);
  const {
    orderId = "N/A",
    orderType = "online",
    createdAt,
    customerName = "Valued Customer",
    customerPhone = "",
    billingAddress = {},
    shippingAddress = null,
    items = [],
    subtotal = 0,
    shippingFee = 0,
    discountAmount = 0,
    couponCode = null,
    totalAmount = 0,
    paymentMethod = "Cash on Delivery",
    paymentStatus,
  } = order;

  const deliverTo = shippingAddress && Object.keys(shippingAddress).length ? shippingAddress : billingAddress;
  const name = deliverTo?.fullName || deliverTo?.name || customerName;
  const phone = deliverTo?.phone || customerPhone;
  const address = addressLines(deliverTo);
  const itemCount = items.reduce((s, i) => s + Number(i.quantity || 1), 0);
  const paid = isPaidStatus(paymentStatus);
  const method = /^cod$/i.test(paymentMethod) ? "Cash on Delivery" : paymentMethod;

  const itemRows = items
    .map((i) => {
      const qty = Number(i.quantity || 1);
      const unit = Number(i.price ?? i.unitPrice ?? 0);
      const chips = variantChips(i.variantName);
      return `<tr>
        <td>
          <div class="item-name">${esc(i.productName || i.name || "Product")}</div>
          ${chips.length ? `<div class="variants">${chips.map((v) => `<span class="chip">${esc(v)}</span>`).join("")}</div>` : ""}
        </td>
        <td class="qty">${qty}</td>
        <td class="num">${tk(unit)}</td>
        <td class="num"><b>${tk(i.subtotal || unit * qty)}</b></td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invoice #${esc(orderId)} · ${esc(site.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:${BRAND.ink};--maroon:${BRAND.maroon};--maroon-2:${BRAND.maroon2};--crimson:${BRAND.crimson};
    --blush:${BRAND.blush};--line:${BRAND.line};--muted:${BRAND.muted};--ok:${BRAND.ok};
    --page-w:210mm;--page-h:297mm;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#e9e4e6}
  body{font-family:Inter,system-ui,sans-serif;color:var(--ink);font-size:12.5px;line-height:1.5;
       -webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:var(--page-w);min-height:var(--page-h);margin:24px auto;background:#fff;display:flex;flex-direction:column;
        box-shadow:0 8px 30px rgba(74,13,34,.12);position:relative;overflow:hidden}
  .page::before{content:"";position:absolute;inset:0 0 auto 0;height:6px;background:linear-gradient(90deg,var(--maroon),var(--crimson))}
  .wrap{padding:16mm 16mm 0}
  .head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
  .logo{display:block;height:46px;width:auto;max-width:220px}
  .inv-meta{text-align:right}
  .inv-meta .label{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--crimson);font-weight:700}
  .inv-meta .no{font-size:20px;font-weight:700;color:var(--maroon);margin:2px 0 6px}
  .inv-meta .row{color:var(--muted);font-size:11.5px}
  .inv-meta .row b{color:var(--ink);font-weight:600}
  .info{display:grid;grid-template-columns:1.3fr 1fr;gap:14px;margin-top:22px}
  .card{background:var(--blush);border-radius:10px;padding:14px 16px}
  .card h4{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--crimson);margin-bottom:8px}
  .card .name{font-size:14px;font-weight:700}
  .card .muted{color:var(--muted)}
  .kv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px}
  .kv dt{color:var(--muted)}
  .kv dd{font-weight:600;text-align:right}
  table{width:100%;border-collapse:collapse;margin-top:22px}
  thead th{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:600;
           text-align:left;padding:0 0 8px;border-bottom:1.5px solid var(--maroon)}
  th.num,td.num{text-align:right;white-space:nowrap;padding-left:14px}
  th.qty,td.qty{text-align:center;width:48px}
  tbody td{padding:12px 0;border-bottom:1px solid var(--line);vertical-align:top}
  .item-name{font-weight:600;font-size:13px}
  .variants{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
  .chip{font-size:10.5px;background:var(--blush);color:var(--maroon-2);border:1px solid var(--line);border-radius:999px;padding:1px 8px}
  .bottom{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:18px;align-items:start}
  .totals .r{display:flex;justify-content:space-between;padding:5px 0;color:var(--muted)}
  .totals .r span:last-child{color:var(--ink);font-weight:500}
  .totals .r.discount span:last-child{color:var(--ok)}
  .totals .grand{display:flex;justify-content:space-between;align-items:baseline;margin-top:6px;padding-top:10px;border-top:1.5px solid var(--maroon)}
  .totals .grand span:first-child{font-weight:700;color:var(--maroon)}
  .totals .grand span:last-child{font-size:20px;font-weight:700;color:var(--maroon)}
  .pay{border-radius:12px;padding:16px 18px;color:#fff;background:linear-gradient(135deg,var(--maroon),var(--maroon-2))}
  .pay .t{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;opacity:.75}
  .pay .amt{font-size:28px;font-weight:700;margin:4px 0 2px;letter-spacing:-.5px}
  .pay .sub{font-size:11px;opacity:.85}
  .pay.paid{background:linear-gradient(135deg,#145a39,var(--ok))}
  .note{margin-top:18px;display:flex;gap:10px;align-items:flex-start;border:1px dashed var(--line);border-radius:10px;
        padding:10px 14px;color:var(--muted);font-size:11.5px}
  .note b{color:var(--ink)}
  .spacer{flex:1}
  .foot{margin-top:24px;background:var(--blush);padding:14px 16mm;display:flex;justify-content:space-between;align-items:center;gap:20px;border-top:1px solid var(--line)}
  .foot .thanks{font-family:Fraunces,serif;font-size:15px;font-weight:600;color:var(--maroon)}
  .foot .contact{font-size:11px;color:var(--muted);margin-top:2px}
  .foot .contact b{color:var(--ink);font-weight:600}
  #qr{width:64px;height:64px;flex:none}
  #qr img,#qr canvas{width:64px!important;height:64px!important}
  .qr-cap{font-size:9px;color:var(--muted);text-align:center;margin-top:2px}
  .print-btn{position:fixed;right:20px;bottom:20px;background:var(--maroon);color:#fff;border:0;border-radius:999px;
             padding:10px 18px;font:600 13px Inter,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(74,13,34,.3)}
  @page{size:A4;margin:0}
  @media print{
    html,body{background:#fff}
    .page{margin:0;box-shadow:none}
    .print-btn{display:none}
  }
  @media screen and (max-width:820px){
    .page{width:100%;min-height:auto;margin:0}
    .wrap{padding:24px 16px 0}
    .info,.bottom{grid-template-columns:1fr}
    .foot{padding:14px 16px}
  }
</style>
</head>
<body>
<div class="page">
  <div class="wrap">
    <header class="head">
      <img class="logo" src="${esc(cleanLogoUrl)}" alt="${esc(site.name)}">
      <div class="inv-meta">
        <div class="label">Invoice</div>
        <div class="no">#${esc(orderId)}</div>
        <div class="row">Issued <b>${fmtDate()}</b></div>
        <div class="row">Ordered <b>${esc(fmtDate(createdAt))}</b></div>
      </div>
    </header>

    <section class="info">
      <div class="card">
        <h4>Deliver to</h4>
        <div class="name">${esc(name)}</div>
        ${phone ? `<div class="muted">${esc(fmtPhone(phone))}</div>` : ""}
        ${address.length ? `<div style="margin-top:6px">${address.map(esc).join("<br>")}</div>` : ""}
      </div>
      <div class="card">
        <h4>Order details</h4>
        <dl class="kv">
          <dt>Payment</dt><dd>${esc(method)}</dd>
          <dt>Items</dt><dd>${itemCount} ${itemCount === 1 ? "item" : "items"}</dd>
          <dt>Source</dt><dd>${esc(SOURCE_LABELS[orderType] || "Online order")}</dd>
        </dl>
      </div>
    </section>

    <table>
      <thead><tr><th>Product</th><th class="qty">Qty</th><th class="num">Unit price</th><th class="num">Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    <section class="bottom">
      <div class="pay${paid ? " paid" : ""}">
        <div class="t">${paid ? "Payment received" : "Collect on delivery"}</div>
        <div class="amt">${paid ? "Paid" : tk(totalAmount)}</div>
        <div class="sub">${paid ? `${esc(method)} · nothing to collect` : "Courier: collect this exact amount in cash"}</div>
      </div>
      <div class="totals">
        <div class="r"><span>Subtotal</span><span>${tk(subtotal)}</span></div>
        <div class="r"><span>Delivery fee</span><span>${tk(shippingFee)}</span></div>
        ${Number(discountAmount) > 0 ? `<div class="r discount"><span>Discount${couponCode ? ` (${esc(couponCode)})` : ""}</span><span>−${tk(discountAmount)}</span></div>` : ""}
        <div class="grand"><span>Grand total</span><span>${tk(totalAmount)}</span></div>
      </div>
    </section>

    <div class="note">
      <span>📦</span>
      <div><b>Discreetly packed.</b> Plain outer packaging, no product names on the parcel.</div>
    </div>
  </div>

  <div class="spacer"></div>

  <footer class="foot">
    <div>
      <div class="thanks">Thank you for choosing ${esc(site.name)}</div>
      <div class="contact">${site.helpline ? `WhatsApp <b>${esc(fmtPhone(site.helpline))}</b> · ` : ""}<b>${esc(site.email)}</b> · <b>${esc(site.domain)}</b></div>
    </div>
    <div>
      <div id="qr"></div>
      <div class="qr-cap">Chat with us</div>
    </div>
  </footer>
</div>

<button class="print-btn" onclick="window.print()">Print / Save PDF</button>

<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script>
  try {
    new QRCode(document.getElementById("qr"), { text: "${waLink(site.helpline)}", width: 128, height: 128, colorDark: "${BRAND.maroon}", colorLight: "${BRAND.blush}" });
  } catch (e) {
    document.getElementById("qr").parentElement.style.display = "none";
  }
</script>
</body>
</html>`;
};

export default { buildSurokkhaOrderInvoiceHtml };
