import rateLimit from "express-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;

const accountKey = (req) => {
  const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : "";
  return `${req.baseUrl}${req.path}:${email || req.ip}`;
};

const limiter = ({ max, keyGenerator, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs: WINDOW_MS,
    limit: max,
    keyGenerator,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: { status: "error", message: "Too many attempts. Please try again in 15 minutes." },
  });

const perIp = limiter({ max: 100, keyGenerator: (req) => req.ip });

// Password and code guesses: counts only failed attempts, per account and per IP
export const limitCredentialAttempts = [
  perIp,
  limiter({ max: 10, keyGenerator: accountKey, skipSuccessfulRequests: true }),
];

// Endpoints that send an email: counts every request, per account and per IP
export const limitEmailRequests = [perIp, limiter({ max: 5, keyGenerator: accountKey })];

// Public read endpoints (e.g. site config on dashboard load): counts every request per IP
export const limitPublicReads = rateLimit({
  windowMs: WINDOW_MS,
  limit: 300,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { status: "error", message: "Too many requests. Please try again later." },
});
