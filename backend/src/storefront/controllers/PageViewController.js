import { PageViewModel } from "../../common/models/pageView.model.js";
import { extractClientIp } from "../../common/services/facebookCapi.service.js";
import { parseUserAgent } from "../../common/helper/visitorTracking.js";
import { logger } from "../../common/config/logger.js";

const str = (v, max = 300) => String(v ?? "").trim().slice(0, max);

const BOT_RX = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime/i;

const SKIPPED_TYPES = ["product", "checkout"];

// Public storefront endpoint: stores one page view for the dashboard's Pages report (never sent to Meta)
export const recordPageView = async (req, res) => {
  try {
    const userAgent = str(req.headers?.["user-agent"], 400);
    if (BOT_RX.test(userAgent)) return res.json({ status: "success", saved: 0 });
    const body = req.body || {};
    const path = str(body.path, 300).split("?")[0].split("#")[0] || "/";
    const pageType = str(body.pageType, 40).toLowerCase() || "other";
    if (SKIPPED_TYPES.includes(pageType)) return res.json({ status: "success", saved: 0 });
    const { device, os, browser } = parseUserAgent(userAgent);
    await PageViewModel.create({
      site: req.pageViewSite === "store" ? "store" : "shop",
      path,
      pageType,
      title: str(body.title, 200),
      visitorId: str(body.visitorId, 100),
      landing: body.landing === true,
      source: str(body.source, 80) || "direct",
      referrer: str(body.referrer, 300),
      device,
      os,
      browser,
      ipAddress: extractClientIp(req) || "",
    });
    return res.json({ status: "success", saved: 1 });
  } catch (err) {
    logger?.warn?.(`[PageView] save failed: ${err.message}`);
    return res.json({ status: "success", saved: 0 });
  }
};
