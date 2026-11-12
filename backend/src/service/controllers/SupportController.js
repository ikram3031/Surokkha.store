import express from "express";
import { logger } from "../../common/config/logger.js";
import { getSupportConfig, DEFAULT_PLEXIVIA_API_BASE_URL } from "../../common/services/plexiviaSupport.service.js";

/**
 * Support Desk proxy (outbound to Plexivia).
 *
 * The dashboard never sees the Plexivia support key: it calls these routes with its own staff
 * token, and this controller adds `X-Support-Key` server-side before forwarding.
 * The key and API URL come from Business Settings (stored encrypted in the database).
 */

const UPSTREAM_TIMEOUT_MS = 15000;
const UPLOAD_TIMEOUT_MS = 30000;

// Plexivia stores uploads under this path, relative to its origin
const ATTACHMENT_PATH_PREFIX = "/api/uploads/support/";
export const ATTACHMENT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const CATEGORIES = ["VPS", "DEPLOYMENT", "BUG", "BILLING", "FEATURE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// Loaded per request (cached briefly by the service) so a key saved in settings applies at once
let current = { apiBaseUrl: DEFAULT_PLEXIVIA_API_BASE_URL, key: "" };
const getBaseUrl = () => current.apiBaseUrl;
const getSupportKey = () => current.key;

// Keeps the endpoints closed (503) until the Owner connects the store in Business Settings
export const requireSupportConfigured = async (req, res, next) => {
  try {
    const cfg = await getSupportConfig();
    if (cfg.configured) {
      current = cfg;
      return next();
    }
  } catch (err) {
    logger.warn({ err: err?.message }, "[Support] Could not load the Plexivia support settings");
  }
  return res.status(503).json({
    success: false,
    code: "SUPPORT_NOT_CONNECTED",
    message: "Support Desk is not connected yet. The store Owner can connect it in Settings → Business Settings → Plexivia Support Desk.",
  });
};

// Raw body parser for the attachment route only (global express.json() ignores image/pdf bodies)
export const rawAttachmentBody = express.raw({ type: ATTACHMENT_TYPES, limit: "5mb" });

// Plexivia returns attachment urls relative to its origin; make them absolute for the browser
const toAbsoluteAttachmentUrl = (url) =>
  typeof url === "string" && url.startsWith(ATTACHMENT_PATH_PREFIX) ? `${getBaseUrl()}${url}` : url;

// Accepts absolute urls we handed out earlier, returns the relative form Plexivia stores; null if not an upload path
const toRelativeAttachmentUrl = (url) => {
  if (typeof url !== "string") return null;
  const base = getBaseUrl();
  const relative = url.startsWith(`${base}${ATTACHMENT_PATH_PREFIX}`) ? url.slice(base.length) : url;
  if (!relative.startsWith(ATTACHMENT_PATH_PREFIX)) return null;
  // Single file name only, no traversal
  return /^[A-Za-z0-9._-]+$/.test(relative.slice(ATTACHMENT_PATH_PREFIX.length)) ? relative : null;
};

const rewriteAttachments = (attachments) =>
  Array.isArray(attachments) ? attachments.map((a) => ({ ...a, url: toAbsoluteAttachmentUrl(a?.url) })) : attachments;

const rewriteTicket = (ticket) => {
  if (!ticket || typeof ticket !== "object" || !Array.isArray(ticket.messages)) return ticket;
  return {
    ...ticket,
    messages: ticket.messages.map((m) => ({ ...m, attachments: rewriteAttachments(m.attachments) })),
  };
};

// Whitelists the fields the dashboard may attach to a message and keeps only genuine Plexivia upload urls
const sanitizeAttachments = (list) => {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const a of list.slice(0, 10)) {
    const url = toRelativeAttachmentUrl(a?.url);
    if (!url) continue;
    out.push({
      name: String(a.name || "attachment").slice(0, 120),
      url,
      size: Number(a.size) || 0,
      mimeType: ATTACHMENT_TYPES.includes(a.mimeType) ? a.mimeType : undefined,
    });
  }
  return out;
};

// Maps an upstream failure onto what the dashboard should see, never leaking the key
const sendUpstreamError = (res, status, payload, context) => {
  const message = typeof payload?.message === "string" && payload.message ? payload.message : null;

  // Plexivia rejecting our key is a server configuration problem. Passing 401/403 through would
  // make the dashboard think the staff session expired and log the user out.
  if (status === 401 || status === 403) {
    logger.error({ status, context }, "[Support] Plexivia rejected the support key (invalid, revoked or client inactive)");
    return res.status(502).json({
      success: false,
      message: "Support Desk credentials were rejected by Plexivia. Please contact your administrator.",
    });
  }
  if (status >= 500) {
    logger.warn({ status, context }, "[Support] Plexivia returned a server error");
    return res.status(502).json({ success: false, message: "Plexivia Support Desk is having trouble right now. Please try again shortly." });
  }
  // 4xx the user can act on (validation, 404, "ticket is closed") passes through with the upstream message
  return res.status(status).json({ success: false, message: message || "Request could not be completed" });
};

// Calls Plexivia and relays the result; `transform` can reshape a successful payload
const forward = async (req, res, next, { method, path, body, headers = {}, timeoutMs = UPSTREAM_TIMEOUT_MS, transform, context }) => {
  try {
    let upstream;
    try {
      upstream = await fetch(`${getBaseUrl()}${path}`, {
        method,
        headers: { Accept: "application/json", "X-Support-Key": getSupportKey(), ...headers },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
      // err.message only: fetch errors never carry request headers, but keep the log minimal anyway
      logger.warn({ context, err: err?.cause?.code || err?.message }, "[Support] Could not reach Plexivia");
      return res.status(timedOut ? 504 : 502).json({
        success: false,
        message: timedOut ? "Plexivia Support Desk timed out. Please try again." : "Could not reach Plexivia Support Desk. Please try again shortly.",
      });
    }

    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) return sendUpstreamError(res, upstream.status, payload, context);
    if (!payload || typeof payload !== "object") {
      logger.warn({ context, status: upstream.status }, "[Support] Plexivia returned a non-JSON success response");
      return res.status(502).json({ success: false, message: "Unexpected response from Plexivia Support Desk." });
    }
    return res.status(upstream.status).json(transform ? transform(payload) : payload);
  } catch (error) {
    return next(error);
  }
};

// Ticket ids are Plexivia dIds or ticket numbers (PX-TKT-2026-00001); anything else is rejected before forwarding
const SAFE_TICKET_ID = /^[A-Za-z0-9_-]{1,64}$/;
const ticketPath = (id) => `/api/support/client/tickets/${encodeURIComponent(id)}`;

const withTicketId = (handler) => (req, res, next) => {
  if (!SAFE_TICKET_ID.test(String(req.params.id || ""))) {
    return res.status(400).json({ success: false, message: "Invalid ticket id" });
  }
  return handler(req, res, next);
};

export const listTickets = (req, res, next) =>
  forward(req, res, next, {
    method: "GET",
    path: "/api/support/client/tickets",
    context: "list",
    transform: (p) => ({ ...p, data: Array.isArray(p.data) ? p.data.map(rewriteTicket) : p.data }),
  });

export const createTicket = (req, res, next) => {
  const subject = String(req.body?.subject || "").trim();
  const description = String(req.body?.description || "").trim();
  if (!subject || !description) {
    return res.status(400).json({ success: false, message: "Subject and description are required" });
  }
  const category = String(req.body?.category || "BUG").toUpperCase();
  const priority = String(req.body?.priority || "MEDIUM").toUpperCase();
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: `Category must be one of ${CATEGORIES.join(", ")}` });
  }
  if (!PRIORITIES.includes(priority)) {
    return res.status(400).json({ success: false, message: `Priority must be one of ${PRIORITIES.join(", ")}` });
  }
  const attachments = sanitizeAttachments(req.body?.attachments);

  return forward(req, res, next, {
    method: "POST",
    path: "/api/support/client/tickets",
    headers: { "Content-Type": "application/json" },
    // Whitelisted: the dashboard cannot set project, client or status fields
    body: JSON.stringify({ subject, description, category, priority, ...(attachments.length ? { attachments } : {}) }),
    context: "create",
    transform: (p) => ({ ...p, data: rewriteTicket(p.data) }),
  });
};

export const getTicket = withTicketId((req, res, next) =>
  forward(req, res, next, {
    method: "GET",
    path: ticketPath(req.params.id),
    context: "get",
    transform: (p) => ({ ...p, data: rewriteTicket(p.data) }),
  })
);

export const replyToTicket = withTicketId((req, res, next) => {
  const message = String(req.body?.message || "").trim();
  if (!message) return res.status(400).json({ success: false, message: "Message cannot be empty" });
  const attachments = sanitizeAttachments(req.body?.attachments);

  return forward(req, res, next, {
    method: "POST",
    path: `${ticketPath(req.params.id)}/messages`,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, ...(attachments.length ? { attachments } : {}) }),
    context: "reply",
    transform: (p) => ({ ...p, data: rewriteTicket(p.data) }),
  });
});

// Raw bytes in, raw bytes out: Content-Type is the file's mime, X-File-Name its original name
export const uploadAttachment = (req, res, next) => {
  const file = req.body;
  if (!Buffer.isBuffer(file) || file.length === 0) {
    return res.status(400).json({ success: false, message: "Send the file as png, jpeg, webp, gif or pdf (max 5 MB)." });
  }
  if (file.length > MAX_ATTACHMENT_BYTES) {
    return res.status(413).json({ success: false, message: "File is too large (max 5 MB)." });
  }
  // Header values must stay latin1-safe; non-ASCII names are percent-encoded and Plexivia stores what it gets
  const rawName = String(req.headers["x-file-name"] || "attachment").slice(0, 120);
  const fileName = /^[\x20-\x7e]*$/.test(rawName) ? rawName : encodeURIComponent(rawName);

  return forward(req, res, next, {
    method: "POST",
    path: "/api/support/attachments",
    headers: { "Content-Type": String(req.headers["content-type"]).split(";")[0], "X-File-Name": fileName },
    body: file,
    timeoutMs: UPLOAD_TIMEOUT_MS,
    context: "upload",
    transform: (p) => ({ ...p, data: p.data ? { ...p.data, url: toAbsoluteAttachmentUrl(p.data.url) } : p.data }),
  });
};
