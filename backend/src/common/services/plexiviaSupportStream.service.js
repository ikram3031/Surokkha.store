import { logger } from "../config/logger.js";
import { LogModel } from "../models/log.model.js";
import { broadcastLiveNotification, broadcastEvent } from "../websocket.js";
import { getSupportConfig, onSupportConfigChange } from "./plexiviaSupport.service.js";

/**
 * Live link to the Plexivia Support Desk.
 *
 * This server opens and holds GET {plexivia}/api/support/client/events with its support key
 * (Server-Sent Events). Plexivia pushes an event whenever a ticket of this store changes
 * (engineer reply, status change, new ticket). Each event:
 *   - updates every open dashboard at once (WebSocket SUPPORT_TICKET_UPDATED)
 *   - for engineer replies / status changes / new tickets from Plexivia, adds a bell notification
 */

const MIN_RETRY_MS = 3_000;
const MAX_RETRY_MS = 60_000;
// Plexivia sends a heartbeat every 25s; silence longer than this means the link is dead
const IDLE_TIMEOUT_MS = 70_000;

// Events that come from the Plexivia side and deserve a notification for the store team
const NOTIFY_KINDS = new Set(["admin_reply", "status", "created"]);

let controller = null;
let retryTimer = null;
let retryMs = MIN_RETRY_MS;
let started = false;
// Bumped synchronously on every connect(); an older attempt that wakes up later sees it is stale and stops
let generation = 0;
let status = { connected: false, since: null, lastError: "" };

export const supportStreamStatus = () => ({ ...status });

const describe = (e) => {
  if (e.kind === "admin_reply") return `Plexivia replied on ticket ${e.ticket_number}: ${e.preview || e.subject}`;
  if (e.kind === "status") return `Ticket ${e.ticket_number} is now ${String(e.status || "").replace(/_/g, " ").toLowerCase()}`;
  return `Plexivia opened ticket ${e.ticket_number}: ${e.subject}`;
};

const handleTicketEvent = async (e) => {
  if (!e?.dId) return;
  broadcastEvent("SUPPORT_TICKET_UPDATED", e);
  // Only changes made on the Plexivia side; our own new tickets and replies need no bell
  if (e.by !== "ADMIN" || !NOTIFY_KINDS.has(e.kind)) return;
  // Several server processes may hold a stream; the event key check keeps it to one bell notification
  // (the event key sits in updatedBy, which nothing displays; typeDid keeps the usual type code)
  const eventKey = `plexivia:${e.dId}:${e.kind}:${e.at}`.slice(0, 120);
  try {
    if (await LogModel.exists({ type: "supportTicket", updatedBy: eventKey })) return;
    const log = await LogModel.create({
      type: "supportTicket",
      description: describe(e).slice(0, 300),
      readStatus: false,
      active: true,
      createdBy: "PLEXIVIA_SUPPORT",
      updatedBy: eventKey,
    });
    await broadcastLiveNotification(log);
  } catch (err) {
    if (err?.code !== 11000) logger.warn({ err: err?.message }, "[SupportStream] Could not write the notification");
  }
};

// Minimal SSE parser over a fetch body stream
const consume = async (body, signal) => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let idle = setTimeout(() => controller?.abort(new Error("idle timeout")), IDLE_TIMEOUT_MS);
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      clearTimeout(idle);
      idle = setTimeout(() => controller?.abort(new Error("idle timeout")), IDLE_TIMEOUT_MS);
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        let event = "message";
        const data = [];
        for (const line of chunk.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data.push(line.slice(5).trim());
        }
        if (event === "ticket" && data.length) {
          try {
            await handleTicketEvent(JSON.parse(data.join("\n")));
          } catch {
            // ignore a malformed event
          }
        } else if (event === "ready") {
          retryMs = MIN_RETRY_MS;
        }
      }
    }
  } finally {
    clearTimeout(idle);
  }
};

const scheduleRetry = () => {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(connect, retryMs);
  retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
};

const connect = async () => {
  const gen = ++generation;
  clearTimeout(retryTimer);
  controller?.abort();
  const cfg = await getSupportConfig({ fresh: true }).catch(() => null);
  if (!cfg?.configured) {
    status = { connected: false, since: null, lastError: "" };
    return; // waits for the Owner to save a key; onSupportConfigChange reconnects
  }
  if (gen !== generation) return;
  const ctrl = new AbortController();
  controller = ctrl;
  try {
    const res = await fetch(`${cfg.apiBaseUrl}/api/support/client/events`, {
      headers: { Accept: "text/event-stream", "X-Support-Key": cfg.key },
      signal: ctrl.signal,
    });
    if (gen !== generation) return ctrl.abort();
    if (!res.ok || !res.body) {
      status = { connected: false, since: null, lastError: `HTTP ${res.status}` };
      if (res.status === 401 || res.status === 403) {
        logger.error("[SupportStream] Plexivia rejected the support key; check Business Settings");
        retryMs = MAX_RETRY_MS;
      }
      return scheduleRetry();
    }
    status = { connected: true, since: new Date().toISOString(), lastError: "" };
    logger.info("[SupportStream] Live link to Plexivia Support Desk is up");
    // Anything that changed while we were offline shows up on the next dashboard refresh
    broadcastEvent("SUPPORT_TICKET_UPDATED", { kind: "resync" });
    await consume(res.body, ctrl.signal);
  } catch (err) {
    if (gen !== generation) return; // replaced by a newer connection
    status = { connected: false, since: null, lastError: err?.cause?.code || err?.message || "error" };
  }
  if (gen === generation) {
    status.connected = false;
    scheduleRetry();
  }
};

export const startSupportStream = () => {
  if (started) return;
  started = true;
  onSupportConfigChange(() => {
    retryMs = MIN_RETRY_MS;
    connect();
  });
  connect();
};
