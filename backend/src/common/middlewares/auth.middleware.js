import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserModel } from "../models/user.model.js";
import { MemberModel } from "../models/member.model.js";

// Authenticates JWT access token via Bearer header or query token parameter
export const authenticateToken = async (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [scheme, parsedToken] = authHeader.split(" ");
    if (scheme === "Bearer") {
      token = parsedToken;
    }
  } else if (req.query?.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ status: "error", message: "Authorization header or token missing" });
  }

  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    const userId = payload.userId || payload.id || payload.sub;

    if (!userId) {
      return res.status(401).json({ status: "error", message: "Invalid token payload" });
    }

    let user = await UserModel.findById(userId).lean();
    if (!user) {
      user = await MemberModel.findById(userId).lean();
    }

    if (!user || user.isActive === false) {
      return res.status(401).json({ status: "error", message: "User not found or account deactivated" });
    }

    req.user = {
      _id: user._id.toString(),
      id: user._id.toString(),
      userId: user._id.toString(),
      did: user.did,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ status: "error", message: "Invalid or expired access token" });
  }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: "error", message: "Authentication required" });
  }

  const currentRole = typeof req.user.role === "string" ? req.user.role.toLowerCase() : "";
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());

  if (!normalizedAllowedRoles.includes(currentRole)) {
    return res.status(403).json({ status: "error", message: "Forbidden" });
  }

  return next();
};
