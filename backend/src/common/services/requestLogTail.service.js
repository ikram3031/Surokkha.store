import mongoose from "mongoose";
import { RequestLogModel } from "../models/requestLog.model.js";
import { recentLogsBuffer, broadcastLogToClients } from "../../service/routes/DeveloperRoute.js";
import { logger } from "../config/logger.js";

const POLL_MS = 1000;
const BACKLOG = 300;

const toEntry = ({ _id, ...entry }) => entry;

let started = false;

// Forwards request logs written by every backend layer (storefront, storeWeb, dashboard) to the live logs stream
export const startRequestLogTail = () => {
  if (started) return;
  started = true;

  let lastId = null;
  let busy = false;

  const tick = async () => {
    if (busy || mongoose.connection.readyState !== 1) return;
    busy = true;
    try {
      if (!lastId) {
        // First run: preload recent history without re-broadcasting it
        const recent = await RequestLogModel.find({}).sort({ _id: -1 }).limit(BACKLOG).lean();
        recent.reverse().forEach((doc) => recentLogsBuffer.push(toEntry(doc)));
        while (recentLogsBuffer.length > BACKLOG) recentLogsBuffer.shift();
        lastId = recent.length ? recent[recent.length - 1]._id : mongoose.Types.ObjectId.createFromTime(0);
        return;
      }
      const fresh = await RequestLogModel.find({ _id: { $gt: lastId } }).sort({ _id: 1 }).limit(500).lean();
      for (const doc of fresh) {
        lastId = doc._id;
        broadcastLogToClients(toEntry(doc));
      }
    } catch (err) {
      logger.warn({ err: err.message }, "Request log tail failed");
    } finally {
      busy = false;
    }
  };

  setInterval(tick, POLL_MS).unref();
};
