import { MetaCapiEventModel } from "../models/metaCapiEvent.model.js";
import { notifyOwners, buildNotificationHtml, rowsToText, formatWhen } from "./notification.service.js";
import { logger } from "../config/logger.js";
import { config } from "../config/index.js";

const GRAPH_VERSION = "v19.0";
const RETRY_DELAYS_MIN = [1, 5, 15, 60, 180, 360];
const ALERT_THROTTLE_MS = 30 * 60 * 1000;

// Meta error codes that mean the setup itself is broken, with the fix in one line
const describeMetaError = (code, message = "") => {
  if (code === 190) return "The Meta access token is invalid or expired. Generate a new token in Events Manager and save it in Settings → Meta Pixel.";
  if (code === 10 || code === 200) return "The access token has no permission for this pixel. Use a system user token with access to this dataset.";
  if (code === 100 && /pixel|dataset|object/i.test(message)) return "The pixel ID is wrong or the token cannot see it. Check the pixel ID in Settings → Meta Pixel.";
  if (code === 4 || code === 17 || code === 32 || code === 613) return "Meta rate-limited the request. It will retry automatically.";
  return "";
};

// Reads Meta's JSON error into { message, code, hint }
const parseMetaError = (bodyText = "") => {
  try {
    const err = JSON.parse(bodyText)?.error || {};
    const message = [err.message, err.error_user_msg].filter(Boolean).join(" — ") || bodyText.slice(0, 500);
    return { message, code: err.code ?? null, hint: describeMetaError(err.code, message) };
  } catch {
    return { message: String(bodyText).slice(0, 500), code: null, hint: "" };
  }
};

// Bell notification, activity log, Owner email and Webmail inbox copy for a CAPI problem, at most once per 30 minutes per error
const alertCapiProblem = async (record, { title, reason, hint = "" }) => {
  logger.error(
    { eventName: record.eventName, orderNumber: record.orderNumber, site: record.site, pixelId: record.pixelId, reason },
    `[Meta CAPI] ${title}`,
  );
  const since = new Date(Date.now() - ALERT_THROTTLE_MS);
  const recent = await MetaCapiEventModel.exists({
    _id: { $ne: record._id },
    alertedAt: { $gte: since },
    eventName: record.eventName,
    $or: [{ lastError: reason }, { skipReason: reason }],
  }).catch(() => null);
  if (recent) return;
  await MetaCapiEventModel.updateOne({ _id: record._id }, { $set: { alertedAt: new Date() } }).catch(() => null);

  const brand = config.brandName || "Surokkha";
  const rows = [
    ["Event", record.eventName],
    ["Order", record.orderNumber || "—"],
    ["Site", record.site],
    ["Pixel", record.pixelId || "—"],
    ["Attempts", String(record.attempts || 0)],
    ["When", formatWhen(new Date())],
    ...(hint ? [["Fix", hint]] : []),
  ];
  await notifyOwners({
    log: {
      type: "error",
      typeDid: "119",
      description: `Meta CAPI ${record.eventName} failed for order ${record.orderNumber || "—"} (${record.site}): ${hint || reason}`.slice(0, 500),
      createdBy: "meta-capi",
    },
    mail: {
      subject: `⚠️ ${brand}: Meta ${record.eventName} not delivered (${record.orderNumber || record.site})`,
      html: buildNotificationHtml({ heading: title, subheading: `${brand} · Meta Conversions API`, rows, accent: "#dc2626", errorMessage: reason }),
      text: rowsToText(rows, reason),
      fromName: `${brand} Meta CAPI`,
    },
  }).catch((err) => logger.warn({ err: err.message }, "[Meta CAPI] Alert could not be delivered"));
};

// Records an order event that was never sent (config missing or CAPI turned off) and alerts when it is a setup problem
export const recordCapiSkip = async ({ eventName, eventId, orderNumber, site, pixelId = "", reason, alert = false }) => {
  const record = await MetaCapiEventModel.create({ eventName, eventId, orderNumber, site, pixelId, status: "skipped", skipReason: reason }).catch(
    (err) => {
      logger.warn({ err: err.message }, "[Meta CAPI] Could not save the skipped event");
      return null;
    },
  );
  logger.warn({ eventName, orderNumber, site, reason }, "[Meta CAPI] Event skipped");
  if (record && alert) await alertCapiProblem(record, { title: `Meta ${eventName} was not sent`, reason, hint: reason });
};

// Posts one saved event to Meta and stores the outcome; failures are queued for retry or alerted when final
export const attemptCapiSend = async (record, { pixelId, accessToken }) => {
  const attempts = (record.attempts || 0) + 1;
  let ok = false;
  let httpStatus = null;
  let failure = null;
  let metaResponse = null;
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record.requestBody),
    });
    httpStatus = res.status;
    const bodyText = await res.text();
    if (res.ok) {
      ok = true;
      metaResponse = (() => {
        try {
          return JSON.parse(bodyText);
        } catch {
          return bodyText.slice(0, 500);
        }
      })();
    } else {
      failure = { ...parseMetaError(bodyText), retryable: res.status >= 500 || res.status === 429 };
      if ([4, 17, 32, 613].includes(failure.code)) failure.retryable = true;
    }
  } catch (err) {
    failure = { message: `Network error: ${err.message}`, code: null, hint: "", retryable: true };
  }

  if (ok) {
    await MetaCapiEventModel.updateOne(
      { _id: record._id },
      { $set: { status: "sent", attempts, httpStatus, pixelId, sentAt: new Date(), lastError: "", nextRetryAt: null, retryable: false, metaResponse } },
    ).catch(() => null);
    logger.info({ eventName: record.eventName, orderNumber: record.orderNumber, pixelId, attempts }, `[Meta CAPI] ${record.eventName} sent`);
    return true;
  }

  const delayMin = RETRY_DELAYS_MIN[attempts - 1];
  const willRetry = failure.retryable && delayMin !== undefined;
  const update = {
    status: "failed",
    attempts,
    httpStatus,
    pixelId,
    lastError: failure.message,
    retryable: willRetry,
    nextRetryAt: willRetry ? new Date(Date.now() + delayMin * 60 * 1000) : null,
  };
  await MetaCapiEventModel.updateOne({ _id: record._id }, { $set: update }).catch(() => null);
  logger.warn(
    { eventName: record.eventName, orderNumber: record.orderNumber, pixelId, attempts, httpStatus, error: failure.message, willRetry },
    `[Meta CAPI] ${record.eventName} failed`,
  );
  if (!willRetry) {
    await alertCapiProblem(
      { ...record, ...update, _id: record._id },
      {
        title: failure.retryable ? `Meta ${record.eventName} failed after ${attempts} attempts` : `Meta ${record.eventName} was rejected`,
        reason: failure.message,
        hint: failure.hint,
      },
    );
  }
  return false;
};

// Saves an order event as pending, then sends it straight away
export const dispatchCapiEvent = async ({ eventName, eventId, orderNumber, site, pixelId, accessToken, requestBody }) => {
  const record = await MetaCapiEventModel.create({ eventName, eventId, orderNumber, site, pixelId, requestBody, status: "pending" }).catch((err) => {
    logger.warn({ err: err.message }, "[Meta CAPI] Could not save the event before sending");
    return null;
  });
  return attemptCapiSend(record || { eventName, eventId, orderNumber, site, requestBody, attempts: 0 }, { pixelId, accessToken });
};

// Failed events whose retry time has come, oldest first
export const findDueCapiRetries = (limit = 50) =>
  MetaCapiEventModel.find({ status: "failed", retryable: true, nextRetryAt: { $lte: new Date() } })
    .sort({ nextRetryAt: 1 })
    .limit(limit)
    .lean();

// Counts for the last 24 hours plus the latest failures, for the dashboard status card
export const getCapiEventSummary = async () => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [counts, recentFailures] = await Promise.all([
    MetaCapiEventModel.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { status: "$status", eventName: "$eventName" }, count: { $sum: 1 } } }]),
    MetaCapiEventModel.find({ status: { $in: ["failed", "skipped"] } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("eventName eventId orderNumber site pixelId status attempts httpStatus lastError skipReason nextRetryAt updatedAt")
      .lean(),
  ]);
  return {
    last24h: counts.map((c) => ({ status: c._id.status, eventName: c._id.eventName, count: c.count })),
    recentFailures,
  };
};
