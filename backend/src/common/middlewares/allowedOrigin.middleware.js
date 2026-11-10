import { createOriginChecker } from "../config/corsOrigins.js";
import { env } from "../config/env.js";

const isAllowedOrigin = createOriginChecker(env.ALLOWED_ORIGINS);

// Answers only browser calls from our own sites; CORS alone still lets curl or scripts read the response
export const requireAllowedOrigin = (req, res, next) => {
  const origin = req.get("origin");
  if (!origin && process.env.NODE_ENV !== "production") return next();
  if (origin && isAllowedOrigin(origin)) return next();
  return res.status(403).json({ status: "error", message: "Origin not allowed." });
};
