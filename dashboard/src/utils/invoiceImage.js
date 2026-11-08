import { toBlob } from "html-to-image";

// Injected after the template's own <style> wins via !important.
const COMPACT_STYLE = `<style id="wa-compact">
html,body{background:#fff!important}
.page{width:560px!important;min-height:0!important;margin:0!important;box-shadow:none!important}
.wrap{padding:22px 22px 22px!important}
.logo{height:36px!important}
.inv-meta .no{font-size:17px!important}
.info{margin-top:14px!important;gap:10px!important;grid-template-columns:1.2fr 1fr!important}
.card{padding:10px 12px!important}
table{margin-top:14px!important}
tbody td{padding:8px 0!important}
.bottom{margin-top:12px!important;gap:12px!important;grid-template-columns:1fr 1fr!important}
.pay{padding:12px 14px!important}.pay .amt{font-size:22px!important}
.bottom{background:linear-gradient(135deg,var(--maroon),var(--maroon-2))!important;border-radius:12px!important;padding:12px 14px!important;color:#fff!important}
.bottom .pay{background:none!important;padding:0!important}
.totals .r,.totals .r span:last-child,.totals .grand span{color:#fff!important}
.totals .r{color:rgba(255,255,255,.75)!important}
.totals .r.discount span:last-child{color:#9be7bd!important}
.totals .grand{border-top-color:rgba(255,255,255,.5)!important}
.note,.spacer,.print-btn,.foot{display:none!important}
</style>`;

/**
 * Loads the server-rendered invoice HTML into an off-screen iframe and
 * captures it as a PNG Blob.
 */
export async function captureInvoiceImage(invoiceUrl) {
  const res = await fetch(invoiceUrl, { credentials: "include" });
  if (!res.ok) throw new Error(`Invoice request failed (${res.status})`);
  let html = await res.text();
  // Resolve relative asset paths against the invoice URL.
  // Compact layout used only for the WhatsApp image; the PDF/print invoice is untouched.
  const base = `<base href="${new URL(invoiceUrl).origin}/">${COMPACT_STYLE}`;
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head([^>]*)>/i, `<head$1>${base}`) : base + html;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "820px",
    height: "1200px",
    border: "0",
    background: "#fff",
  });
  document.body.appendChild(iframe);

  try {
    await new Promise((resolve) => {
      iframe.onload = resolve;
      iframe.srcdoc = html;
    });
    const doc = iframe.contentDocument;
    if (doc.fonts?.ready) await doc.fonts.ready.catch(() => {});
    await Promise.all(
      Array.from(doc.images).map((img) =>
        img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }),
      ),
    );
    const target = doc.querySelector(".page") || doc.body;
    iframe.style.height = `${Math.max(target.scrollHeight, doc.documentElement.scrollHeight)}px`;

    const blob = await toBlob(target, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      width: target.offsetWidth,
      height: target.offsetHeight,
      cacheBust: true,
      imagePlaceholder:
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    });
    if (!blob) throw new Error("Could not render invoice image");
    return blob;
  } finally {
    iframe.remove();
  }
}

/** Bangladesh-friendly phone → wa.me digits (e.g. 01712… → 8801712…). */
export function toWhatsAppNumber(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `88${digits}`;
  else if (digits.length === 10 && digits.startsWith("1")) digits = `880${digits}`;
  return digits;
}

/**
 * Shares the invoice image to WhatsApp. On devices with the Web Share API
 * (phones, some desktops) the image is attached directly; otherwise the PNG
 * is downloaded and the customer's WhatsApp chat is opened so it can be
 * attached.
 */
export async function shareInvoiceOnWhatsApp({ invoiceUrl, phone, orderNumber, message }) {
  const blob = await captureInvoiceImage(invoiceUrl);
  const fileName = `Invoice_${orderNumber || "order"}.png`;
  const file = new File([blob], fileName, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: message });
      return "shared";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  const number = toWhatsAppNumber(phone);
  const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(message || "")}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
  return "downloaded";
}
