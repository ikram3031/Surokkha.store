import { ProductEventModel, PRODUCT_EVENT_TYPES } from "../../common/models/productEvent.model.js";
import { extractClientIp } from "../../common/services/facebookCapi.service.js";
import { logger } from "../../common/config/logger.js";

const str = (v, max = 300) => String(v ?? "").trim().slice(0, max);

const BOT_RX = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime/i;

const deviceOf = (ua = "") => {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
};

// Public storefront endpoint. Accepts { events: [...] } (or a single event) and stores one row per product action.
export const recordProductEvents = async (req, res) => {
  try {
    const userAgent = str(req.headers?.["user-agent"], 400);
    // Crawlers and link previews would inflate view counts
    if (BOT_RX.test(userAgent)) return res.json({ status: "success", saved: 0 });

    const body = req.body || {};
    const raw = Array.isArray(body.events) ? body.events : [body];
    const ip = extractClientIp(req) || "";
    const device = deviceOf(userAgent);
    // The StoreWeb route sets this; the shop API leaves it unset
    const site = req.productEventSite === "store" ? "store" : "shop";

    const docs = raw
      .slice(0, 30)
      .map((e) => ({
        site,
        productKey: str(e?.productKey, 160),
        productName: str(e?.productName, 200),
        eventType: str(e?.eventType, 30),
        visitorId: str(e?.visitorId, 100),
        quantity: Math.max(1, Math.min(999, Number(e?.quantity) || 1)),
        value: Math.max(0, Number(e?.value) || 0),
        source: str(e?.source, 80) || "direct",
        referrer: str(e?.referrer, 300),
        pageUrl: str(e?.pageUrl, 400),
        device,
        ipAddress: ip,
      }))
      .filter((d) => d.productKey && PRODUCT_EVENT_TYPES.includes(d.eventType));

    if (docs.length) await ProductEventModel.insertMany(docs, { ordered: false });
    return res.json({ status: "success", saved: docs.length });
  } catch (err) {
    logger?.warn?.(`[ProductEvent] save failed: ${err.message}`);
    // Tracking must never break the storefront
    return res.json({ status: "success", saved: 0 });
  }
};
