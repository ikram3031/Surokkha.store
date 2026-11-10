import { BRAND, esc, tk, fmtPhone, resolveSite, resolveLogo } from "../surokkhaBrand.js";

const STATUS = { draft: "Draft", ordered: "Ordered", received: "Received", cancelled: "Cancelled" };

// Accepts an ISO string or a Date and prints "20 Oct 2026"
const fmtDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

// Quantity as bought: "20 Packet" with "200 pcs" under it, or "12 pcs"
const qtyCell = (l) =>
  l.unitsPerPack > 1
    ? `${esc(l.packs)} ${esc(l.packLabel || "pack")}<div class="sub">${esc(l.units)} ${esc(l.unit || "pcs")}</div>`
    : `${esc(l.units)} ${esc(l.unit || "pcs")}`;

/**
 * A4 purchase receipt (stock bought from a vendor) in the same Surokkha design as the order invoice.
 * Served to the dashboard, which opens it in a new tab to print or save as PDF.
 */
export const buildSurokkhaPurchaseReceiptHtml = ({ purchase: p, bill, logoUrl }) => {
  const site = resolveSite();
  const logo = resolveLogo(logoUrl, site);
  const total = Number(p.total) || 0;
  const paid = Number(p.paidAmount) || 0;
  const due = Math.max(0, Math.round((total - paid) * 100) / 100);
  const settled = due <= 0 && total > 0;
  const cancelled = p.status === "cancelled";
  const units = (p.lines || []).reduce((s, l) => s + Number(l.units || 0), 0);

  const itemRows = (p.lines || [])
    .map(
      (l, i) => `<tr>
        <td class="idx">${i + 1}</td>
        <td><div class="item-name">${esc(l.shortName)}</div>${l.name ? `<div class="sub">${esc(l.name)}</div>` : ""}</td>
        <td class="qty">${qtyCell(l)}</td>
        <td class="num">${tk(l.packPrice)}${l.unitsPerPack > 1 ? `<div class="sub">${tk(l.unitCost)} / ${esc(l.unit || "pcs")}</div>` : ""}</td>
        <td class="num"><b>${tk(l.total)}</b></td>
      </tr>`
    )
    .join("");

  const paymentRows = (p.payments || [])
    .map(
      (x) => `<div class="r"><span>${esc(fmtDate(x.paidAt))} · ${esc(x.method)}${x.reference ? ` <span class="ref">(${esc(x.reference)})</span>` : ""}</span><span>${tk(x.amount)}</span></div>`
    )
    .join("");

  const payBox = cancelled
    ? `<div class="pay void"><div class="t">Purchase cancelled</div><div class="amt">Void</div><div class="sub">Stock and bill reversed</div></div>`
    : settled
      ? `<div class="pay paid"><div class="t">Fully paid</div><div class="amt">Paid</div><div class="sub">${tk(paid)} paid to the vendor · nothing due</div></div>`
      : `<div class="pay"><div class="t">${paid > 0 ? "Still due to vendor" : "Due to vendor"}</div><div class="amt">${tk(due)}</div><div class="sub">${paid > 0 ? `${tk(paid)} paid of ${tk(total)}` : "Nothing paid yet"}</div></div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.purchaseNumber)}_Purchase_${esc(String(p.vendorName || "").replace(/\s+/g, "_"))}</title>
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
  .brand-name{font-family:Fraunces,serif;font-size:24px;font-weight:600;color:var(--maroon)}
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
  th.qty,td.qty{text-align:center;white-space:nowrap;padding-left:8px;padding-right:8px}
  th.idx,td.idx{width:26px;color:var(--muted)}
  tbody td{padding:12px 0;border-bottom:1px solid var(--line);vertical-align:top}
  td.qty{padding-top:12px}
  .item-name{font-weight:600;font-size:13px}
  .sub{font-size:10.5px;color:var(--muted);font-weight:400}
  .bottom{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:18px;align-items:start}
  .totals .r{display:flex;justify-content:space-between;padding:5px 0;color:var(--muted)}
  .totals .r span:last-child{color:var(--ink);font-weight:500}
  .totals .r.discount span:last-child{color:var(--ok)}
  .totals .grand{display:flex;justify-content:space-between;align-items:baseline;margin-top:6px;padding-top:10px;border-top:1.5px solid var(--maroon)}
  .totals .grand span:first-child{font-weight:700;color:var(--maroon)}
  .totals .grand span:last-child{font-size:20px;font-weight:700;color:var(--maroon)}
  .totals .r.due span{font-weight:700;color:var(--crimson)!important}
  .pay{border-radius:12px;padding:16px 18px;color:#fff;background:linear-gradient(135deg,var(--maroon),var(--maroon-2))}
  .pay .t{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;opacity:.75}
  .pay .amt{font-size:28px;font-weight:700;margin:4px 0 2px;letter-spacing:-.5px}
  .pay .sub{font-size:11px;opacity:.85;color:#fff}
  .pay.paid{background:linear-gradient(135deg,#145a39,var(--ok))}
  .pay.void{background:linear-gradient(135deg,#55474d,#8a7a81)}
  .section{margin-top:20px}
  .section h4{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--crimson);margin-bottom:6px}
  .payments .r{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)}
  .payments .r span:last-child{font-weight:600}
  .ref{color:var(--muted)}
  .note{border:1px dashed var(--line);border-radius:10px;padding:10px 14px;color:var(--ink);font-size:11.5px;white-space:pre-line}
  .spacer{flex:1}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin:40px 16mm 0;text-align:center;color:var(--muted);font-size:11px}
  .sign div{border-top:1px solid var(--muted);padding-top:6px}
  .foot{margin-top:24px;background:var(--blush);padding:14px 16mm;display:flex;justify-content:space-between;align-items:center;gap:20px;border-top:1px solid var(--line)}
  .foot .thanks{font-family:Fraunces,serif;font-size:15px;font-weight:600;color:var(--maroon)}
  .foot .contact{font-size:11px;color:var(--muted);margin-top:2px}
  .foot .contact b{color:var(--ink);font-weight:600}
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
    .sign{margin:32px 16px 0}
  }
</style>
</head>
<body>
<div class="page">
  <div class="wrap">
    <header class="head">
      ${logo ? `<img class="logo" src="${esc(logo)}" alt="${esc(site.name)}">` : `<div class="brand-name">${esc(site.name)}</div>`}
      <div class="inv-meta">
        <div class="label">Purchase receipt</div>
        <div class="no">${esc(p.purchaseNumber)}</div>
        <div class="row">Ordered <b>${esc(fmtDate(p.orderDate))}</b></div>
        <div class="row">Received <b>${esc(fmtDate(p.receivedAt))}</b></div>
      </div>
    </header>

    <section class="info">
      <div class="card">
        <h4>Vendor</h4>
        <div class="name">${esc(p.vendorName)}</div>
        ${p.vendorPhone ? `<div class="muted">${esc(fmtPhone(p.vendorPhone))}</div>` : ""}
        ${p.vendorEmail ? `<div class="muted">${esc(p.vendorEmail)}</div>` : ""}
      </div>
      <div class="card">
        <h4>Purchase details</h4>
        <dl class="kv">
          <dt>Status</dt><dd>${esc(STATUS[p.status] || p.status)}</dd>
          <dt>Items</dt><dd>${(p.lines || []).length} · ${units} units</dd>
          ${bill?.did ? `<dt>Bill</dt><dd>${esc(bill.did)}</dd>` : ""}
        </dl>
      </div>
    </section>

    <table>
      <thead><tr><th class="idx">#</th><th>Item</th><th class="qty">Qty</th><th class="num">Price each</th><th class="num">Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    <section class="bottom">
      ${payBox}
      <div class="totals">
        <div class="r"><span>Items</span><span>${tk(p.subtotal)}</span></div>
        ${Number(p.shipping) > 0 ? `<div class="r"><span>Shipping / carrying</span><span>${tk(p.shipping)}</span></div>` : ""}
        ${Number(p.discount) > 0 ? `<div class="r discount"><span>Discount</span><span>−${tk(p.discount)}</span></div>` : ""}
        <div class="grand"><span>Grand total</span><span>${tk(total)}</span></div>
        <div class="r"><span>Paid</span><span>${tk(paid)}</span></div>
        <div class="r${due > 0 && !cancelled ? " due" : ""}"><span>Due</span><span>${tk(due)}</span></div>
      </div>
    </section>

    ${paymentRows ? `<section class="section payments"><h4>Payments</h4>${paymentRows}</section>` : ""}
    ${p.notes ? `<section class="section"><h4>Notes</h4><div class="note">${esc(p.notes)}</div></section>` : ""}
  </div>

  <div class="spacer"></div>

  <div class="sign"><div>Received by</div><div>Vendor signature</div></div>

  <footer class="foot">
    <div>
      <div class="thanks">${esc(site.name)}</div>
      <div class="contact">${site.helpline ? `WhatsApp <b>${esc(fmtPhone(site.helpline))}</b> · ` : ""}<b>${esc(site.email)}</b> · <b>${esc(site.domain)}</b></div>
    </div>
  </footer>
</div>

<button class="print-btn" onclick="window.print()">Print / Save PDF</button>
</body>
</html>`;
};

export default { buildSurokkhaPurchaseReceiptHtml };
