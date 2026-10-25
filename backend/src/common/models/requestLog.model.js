import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

// Capped (fixed-size, oldest dropped first) so every backend layer can append API request logs cheaply;
// the dashboard process tails it to feed the live System Logs page
const requestLogSchema = new Schema(
  {
    layer: { type: String, default: "unknown" },
    timestamp: String,
    status: Number,
    source: String,
    duration: Number,
    responseTime: Number,
    size: String,
    ip: String,
    userAgent: String,
    method: String,
    url: String,
    path: String,
  },
  { versionKey: false, capped: { size: 5 * 1024 * 1024, max: 2000 }, collection: "request_logs" }
);

export const RequestLogModel = models.RequestLog || model("RequestLog", requestLogSchema);
