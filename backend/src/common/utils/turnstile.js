import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

// Cloudflare Turnstile ("I'm human" checkbox) verification, shared by the offer checkout and dashboard login.
// Checks are only enforced once TURNSTILE_SECRET_KEY is set, so a deploy without keys never blocks anyone.
export const isTurnstileConfigured = () => !!env.TURNSTILE_SECRET_KEY;

// Frontend hostnames allowed per surface; TURNSTILE_HOSTNAMES (comma separated) overrides them all
const allowedHostnames = (defaults) => {
  const fromEnv = String(env.TURNSTILE_HOSTNAMES || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return new Set(fromEnv.length ? fromEnv : defaults);
};

/**
 * Canonical siteverify: the token must be valid, issued for the expected widget action
 * and solved on one of the expected hostnames. Any network/API failure counts as not verified.
 */
export const verifyTurnstile = async (token, ip, { action, hostnames }) => {
  if (!token || typeof token !== "string" || token.length > 2048) return false;
  try {
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY || '0x4AAAAAAFgNwrn1AkNRO5',
      response: token,
      idempotency_key: randomUUID(),
    });
    if (ip && ip !== "unknown") body.set("remoteip", String(ip).split(",")[0].trim());
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(10_000),
    });
    const result = await r.json();
    if (result?.success !== true) return false;
    if (action && result.action !== action) return false;
    if (!allowedHostnames(hostnames).has(String(result.hostname || "").toLowerCase())) return false;
    return true;
  } catch (error) {
    console.error("[Turnstile] siteverify failed:", error.message);
    return false;
  }
};
