import { extractClientIp } from "../services/facebookCapi.service.js";

const str = (v, max = 300) => String(v ?? "").trim().slice(0, max);

const OS_RULES = [
  [/windows nt 10/i, "Windows 10/11"],
  [/windows/i, "Windows"],
  [/iphone|ipad|ipod/i, "iOS"],
  [/android/i, "Android"],
  [/mac os x|macintosh/i, "macOS"],
  [/cros/i, "ChromeOS"],
  [/linux/i, "Linux"],
];

const BROWSER_RULES = [
  [/FBAN|FBAV|FB_IAB/i, "Facebook app"],
  [/Instagram/i, "Instagram app"],
  [/Messenger|MessengerForiOS/i, "Messenger"],
  [/WhatsApp/i, "WhatsApp"],
  [/TikTok|musical_ly|BytedanceWebview/i, "TikTok app"],
  [/SamsungBrowser/i, "Samsung Internet"],
  [/OPR\/|Opera/i, "Opera"],
  [/UCBrowser/i, "UC Browser"],
  [/Edg\//i, "Edge"],
  [/Firefox|FxiOS/i, "Firefox"],
  [/CriOS|Chrome\//i, "Chrome"],
  [/Safari\//i, "Safari"],
];

// Mobile / tablet / desktop from a User-Agent string
export const deviceOf = (ua = "") => {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
};

// Device type, OS (with version when known), browser and phone model from a User-Agent string
export const parseUserAgent = (ua = "") => {
  const os = OS_RULES.find(([rx]) => rx.test(ua))?.[1] || "";
  const androidVer = ua.match(/Android (\d+(?:\.\d+)?)/i)?.[1];
  const iosVer = ua.match(/OS (\d+(?:_\d+)?) like Mac OS X/i)?.[1]?.replace("_", ".");
  const osVersion = os === "Android" ? androidVer : os === "iOS" ? iosVer : "";
  const browser = BROWSER_RULES.find(([rx]) => rx.test(ua))?.[1] || "";
  const model = ua.match(/Android [^;)]*;\s*(?:[a-z]{2}[-_][a-z]{2};\s*)?([^;)]+?)(?:\sBuild\/[^;)]*)?[;)]/i)?.[1]?.trim() || "";
  return {
    device: deviceOf(ua),
    os: osVersion ? `${os} ${osVersion}` : os,
    browser,
    deviceModel: model && !/^(K|wv|Linux|U)$/i.test(model) ? model.slice(0, 80) : "",
  };
};

// Who placed a storefront order: browser visitor id, IP, device details and Meta click ids
export const buildOrderTracking = (req, payload = {}) => {
  const userAgent = str(req?.headers?.["user-agent"], 500);
  return {
    visitorId: str(payload.externalId || payload.visitorId, 100) || null,
    ipAddress: extractClientIp(req) || null,
    userAgent,
    ...parseUserAgent(userAgent),
    language: str(req?.headers?.["accept-language"]?.split(",")?.[0], 20),
    fbp: str(payload.fbp, 200),
    fbc: str(payload.fbc, 300),
    pageUrl: str(payload.eventSourceUrl || payload.pageUrl || req?.headers?.referer, 400),
  };
};
