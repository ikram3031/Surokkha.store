// New-order alert to the owner's WhatsApp through CallMeBot (free, no business account needed).
// Setup, once per phone:
//   1. Save +34 694 29 84 96 in contacts, send it "I allow callmebot to send me messages" on WhatsApp.
//   2. It replies with an API key.
//   3. In backend .env: WHATSAPP_ALERT_TO=8801XXXXXXXXX:APIKEY  (several: comma separated)
// Without that env var nothing is sent. A failed alert never affects the order.

const ENDPOINT = "https://api.callmebot.com/whatsapp.php";

const recipients = () =>
  String(process.env.WHATSAPP_ALERT_TO || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [phone, apikey] = s.split(":").map((x) => x.trim());
      return { phone: phone.replace(/[^\d]/g, ""), apikey };
    })
    .filter((r) => r.phone && r.apikey);

const taka = (n) => `৳${Math.round(Number(n) || 0)}`;

// Bangladeshi mobile (01XXXXXXXXX / +8801… / 8801…) → wa.me link that opens a chat with the customer
const waLink = (phone) => {
  const d = String(phone || "").replace(/\D/g, "");
  const local = d.startsWith("880") ? d.slice(2) : d.startsWith("80") ? d.slice(1) : d;
  return /^01[3-9]\d{8}$/.test(local) ? `https://wa.me/88${local}` : "";
};

export const buildOrderAlertText = (order) => {
  const b = order.billingInfo || {};
  const s = order.shippingInfo || {};
  const items = (order.items || [])
    .map((it) => `• ${it.name} × ${it.quantity} — ${taka(it.unitPrice * it.quantity)}`)
    .join("\n");
  const addr = [b.address, b.thana, b.district || b.city].filter(Boolean).join(", ");
  const shipDiffers = s.address && (s.address !== b.address || s.phone !== b.phone);
  const total = order.totals?.total;
  const fee = order.totals?.shippingFee;
  const site = order.siteKey === "store" || String(order.orderNumber || "").startsWith("ST") ? "Surokkha Store" : "Surokkha Shop";

  return [
    `🛒 নতুন অর্ডার — ${site}`,
    `অর্ডার: ${order.orderNumber || order._id}`,
    "",
    `নাম: ${b.fullName || "-"}`,
    `ফোন: ${b.phone || "-"}`,
    waLink(b.phone) ? `WhatsApp-এ মেসেজ: ${waLink(b.phone)}` : "",
    addr ? `ঠিকানা: ${addr}` : "",
    shipDiffers ? `ডেলিভারি: ${[s.fullName, s.phone, s.address, s.thana, s.district || s.city].filter(Boolean).join(", ")}` : "",
    "—",
    items,
    fee != null ? `ডেলিভারি চার্জ: ${taka(fee)}` : "",
    total != null ? `মোট: ${taka(total)} (COD)` : "",
    order.orderNotes ? `নোট: ${order.orderNotes}` : "",
  ]
    .filter((l) => l !== "")
    .join("\n");
};

export const sendOrderWhatsAppAlert = (order) => {
  const list = recipients();
  if (!list.length || !order) return;
  setImmediate(async () => {
    const text = buildOrderAlertText(order);
    for (const { phone, apikey } of list) {
      try {
        const url = `${ENDPOINT}?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) console.warn(`[WhatsApp Alert] ${phone}: HTTP ${res.status}`);
      } catch (err) {
        console.warn(`[WhatsApp Alert] ${phone}: ${err.message}`);
      }
    }
  });
};
