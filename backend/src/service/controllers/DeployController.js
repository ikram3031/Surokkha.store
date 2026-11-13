import crypto from "node:crypto";
import { DeployVersionModel, MINOR_MAX, formatVersion } from "../../common/models/deployVersion.model.js";
import { notifyDeploy } from "../../common/utils/deployNotification.js";
import { logger } from "../../common/config/logger.js";

const HISTORY_LIMIT = 50;
const clean = (v, max = 120) => String(v ?? "").trim().slice(0, max);

// `make deploy` authenticates with DEPLOY_HOOK_TOKEN (kept in the server's backend .env, never in git)
const validDeployToken = (req) => {
  const expected = process.env.DEPLOY_HOOK_TOKEN || "";
  const given = String(req.headers["x-deploy-token"] || "");
  if (!expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// First deploy starts from the repo's root package.json version (e.g. 1.1.11 → 1.1.12)
const seedFrom = (raw) => {
  const [main = 1, major = 0, minor = 0] = String(raw || "").split(".").map((p) => parseInt(p, 10) || 0);
  return { main, major, minor: Math.min(minor, MINOR_MAX) };
};

// POST /deploy/bump — called at the end of `make deploy`; adds 1 to minor (99 rolls into major),
// then posts a dashboard notification and a deploy report into the Webmail inbox
export const bumpDeployVersion = async (req, res, next) => {
  if (!validDeployToken(req)) return res.status(401).json({ status: "error", message: "Invalid deploy token" });
  try {
    const body = req.body || {};
    const target = clean(body.target || "SUROKKHA", 40).toUpperCase();
    const doc = (await DeployVersionModel.findOne({ target })) || new DeployVersionModel({ target, ...seedFrom(body.seedVersion) });

    if (doc.minor >= MINOR_MAX) {
      doc.major += 1;
      doc.minor = 0;
    } else {
      doc.minor += 1;
    }
    const now = new Date();
    doc.version = formatVersion(doc.main, doc.major, doc.minor);
    doc.lastDeployedAt = now;
    const entry = { version: doc.version, commit: clean(body.commit, 200), branch: clean(body.branch, 60), host: clean(body.host, 80), at: now };
    doc.history = [entry, ...doc.history].slice(0, HISTORY_LIMIT);
    await doc.save();

    // Reply first; the notification (IMAP, SMTP) must never hold up or fail the deploy
    res.json({ status: "success", message: `Deploy version ${doc.version}`, data: { target: doc.target, version: doc.version } });
    notifyDeploy({ ...entry, target: doc.target, status: clean(body.status, 20) || "SUCCESS" }).catch((err) =>
      logger.warn({ err: err.message }, "[Deploy] Notification failed")
    );
  } catch (error) {
    next(error);
  }
};

// GET /deploy/versions — running version and recent deploy history
export const listDeployVersions = async (_req, res, next) => {
  try {
    const data = await DeployVersionModel.find({}).sort({ lastDeployedAt: -1 }).lean();
    res.json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};
