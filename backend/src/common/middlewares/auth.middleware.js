import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserModel } from "../models/user.model.js";
import { MemberModel } from "../models/member.model.js";
import { FULL_ACCESS_ROLES, grantedGroupsFor } from "../config/accessGroups.js";

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
      extraMenus: user.extraMenus || [],
      dataAccessFrom: user.dataAccessFrom || null,
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

// What a menu grant unlocks inside its area:
//  read     - only endpoints every staff member may read (role groups that include Investor)
//  operator - endpoints open to any non-admin role (Manager / Marketing Expert level)
//  admin    - everything except Owner-only endpoints
const ADMIN_ROLES = ADMINS.map(normalizeRole);
const levelAllows = (level, allowed) => {
  if (allowed.length === 1 && allowed[0] === "owner") return false;
  if (level === "admin") return true;
  if (level === "operator") return allowed.some((role) => !ADMIN_ROLES.includes(role));
  return allowed.includes("investor");
};

/**
 * Tags the routes mounted after it with the dashboard menus that unlock them, e.g.
 * accessArea({ accounts: "admin" }). A user granted one of those menus (by role default or
 * a per-user extra) passes that area's authorizeRoles checks up to the given level.
 */
export const accessArea = (areas) => (req, res, next) => {
  req.accessArea = areas;
  return next();
};

// Clears the tag when a request falls through a router, so it never carries into the next one
export const clearAccessArea = (req, res, next) => {
  req.accessArea = null;
  return next();
};

const hasAreaGrant = (req, allowed) => {
  const areas = req.accessArea;
  if (!areas) return false;
  const granted = grantedGroupsFor(req.user);
  return Object.entries(areas).some(([group, level]) => granted.has(group) && levelAllows(level, allowed));
};

// Accepts role names or role groups, e.g. authorizeRoles(ADMINS) or authorizeRoles("Owner")
export const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.flat().map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: "error", message: "Authentication required" });
    }

    if (normalizedAllowedRoles.includes(normalizeRole(req.user.role))) return next();
    if (hasAreaGrant(req, normalizedAllowedRoles)) return next();

    return res.status(403).json({ status: "error", message: "Forbidden" });
  };
};

// Earliest record date this user may see in Accounts (null = no limit, e.g. Owner/Admin)
export const accountsDataFloor = (user) => {
  if (!user || FULL_ACCESS_ROLES.includes(user.role) || !user.dataAccessFrom) return null;
  const floor = new Date(user.dataAccessFrom);
  return Number.isNaN(floor.getTime()) ? null : floor;
};
