import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserModel } from "../models/user.model.js";
import { MemberModel } from "../models/member.model.js";

// Staff role groups shared by every dashboard route
export const OWNER_ONLY = ["Owner"];
export const ADMINS = ["Owner", "Admin"];
export const MANAGERS = ["Owner", "Admin", "Manager"];
export const MARKETERS = ["Owner", "Admin", "Marketing Expert"];
export const OPERATORS = ["Owner", "Admin", "Manager", "Marketing Expert"];
export const ALL_STAFF = [...OPERATORS, "Investor"];

const normalizeRole = (role) => (typeof role === "string" ? role.trim().toLowerCase().replace(/-/g, " ") : "");

// Owner may manage anyone; Admin may only manage roles below Admin; nobody else manages users
export const canManageRole = (actorRole, targetRole) => {
  if (actorRole === "Owner") return true;
  return actorRole === "Admin" && !ADMINS.includes(targetRole);
};

const getBearerToken = (req) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  return scheme === "Bearer" ? token : null;
};

// Lets browser-only clients (EventSource, docs tabs) send the access token in the query string
export const acceptQueryToken = (req, res, next) => {
  if (!req.headers.authorization && typeof req.query?.token === "string") {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return next();
};

// Authenticates a dashboard staff access token against the users collection only
export const authenticateToken = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ status: "error", message: "Authorization header or token missing" });
  }

  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    const userId = payload.userId || payload.id || payload.sub;

    if (!userId || (payload.typ && payload.typ !== "staff")) {
      return res.status(401).json({ status: "error", message: "Invalid token payload" });
    }

    const user = await UserModel.findById(userId).lean();

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

// Authenticates a member access token against the members collection only
export const authenticateMember = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ status: "error", message: "Authorization header or token missing" });
  }

  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    const memberId = payload.userId || payload.id || payload.sub;

    if (!memberId || payload.typ === "staff") {
      return res.status(401).json({ status: "error", message: "Invalid token payload" });
    }

    const member = await MemberModel.findById(memberId).lean();

    if (!member || member.isActive === false) {
      return res.status(401).json({ status: "error", message: "User not found or account deactivated" });
    }

    req.user = {
      _id: member._id.toString(),
      id: member._id.toString(),
      userId: member._id.toString(),
      did: member.did,
      name: member.name,
      email: member.email,
      role: "Customer",
    };
    return next();
  } catch (error) {
    return res.status(401).json({ status: "error", message: "Invalid or expired access token" });
  }
};

// Fills req.user when a valid staff Bearer token is sent, but lets requests without one (or with a bad one) through
export const optionalAuthenticate = (req, res, next) => {
  if (!req.headers.authorization) return next();
  const fakeRes = { status: () => ({ json: () => next() }) };
  return authenticateToken(req, fakeRes, next);
};

// Accepts role names or role groups, e.g. authorizeRoles(ADMINS) or authorizeRoles("Owner")
export const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.flat().map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: "error", message: "Authentication required" });
    }

    if (!normalizedAllowedRoles.includes(normalizeRole(req.user.role))) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    return next();
  };
};
