import { Router } from "express";
import { verifyTelemetryAuth } from "../../common/middlewares/telemetryAuth.middleware.js";
import { logger } from "../../common/config/logger.js";
import { LogModel } from "../../common/models/log.model.js";

const telemetryRouter = Router();

// Receives signed security alerts and heartbeat telemetry from VPS Node Agent
telemetryRouter.post("/events", verifyTelemetryAuth, async (req, res, next) => {
  try {
    const { eventType, details, ip, timestamp, host } = req.body ?? {};

    logger.info(
      { tenantDid: req.tenantDid, eventType, ip, host },
      "Received security telemetry event from Node Agent"
    );

    try {
      await LogModel.create({
        did: req.tenantDid,
        type: eventType || "systemSecurityEvent",
        message: `Node Agent Alert: ${eventType} from ${ip || "remote host"} (${host || "vps"})`,
        meta: { ...req.body, receivedAt: new Date() },
        active: true,
      });
    } catch (_) {}

    res.status(200).json({ status: "success", message: "Telemetry event recorded successfully" });
  } catch (error) {
    next(error);
  }
});

// Telemetry health and connection verification endpoint
telemetryRouter.get("/health", (req, res) => {
  res.json({
    status: "success",
    service: "Node Agent Telemetry Gateway",
    timestamp: new Date().toISOString(),
  });
});

export default telemetryRouter;
