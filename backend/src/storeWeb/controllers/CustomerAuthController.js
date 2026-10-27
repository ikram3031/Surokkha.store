import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { MemberModel } from "../../common/models/member.model.js";
import { env } from "../../common/config/env.js";
import { logger } from "../../common/config/logger.js";
import { comparePassword, hashPassword } from "../../common/utils/password.js";
import { allowHit, clearHits } from "../../common/utils/rateLimit.js";
import { sendOtpEmail, sendPasswordChangedEmail } from "../../common/utils/otpDelivery.js";

// Customer tokens use a secret derived from the staff one, so a customer token can never
// authenticate against the dashboard/staff APIs (and vice versa).
const CUSTOMER_TOKEN_SECRET = crypto
  .createHmac("sha256", env.ACCESS_TOKEN_SECRET)
  .update("storefront-customer-token")
  .digest("hex");
const CUSTOMER_TOKEN_EXPIRES_IN = "30d";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clientIp = (req) => String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
const cleanEmail = (v) => (typeof v === "string" ? v.toLowerCase().trim() : "");
const cleanText = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const otpHash = (email, otp) => crypto.createHash("sha256").update(`${email}:${otp}`).digest("hex");

const signToken = (member) =>
  jwt.sign({ customerId: member.id, typ: "customer" }, CUSTOMER_TOKEN_SECRET, { expiresIn: CUSTOMER_TOKEN_EXPIRES_IN });

const publicCustomer = (member) => ({
  id: member.id,
  did: member.did,
  name: member.name,
  email: member.email,
  phone: member.phone || "",
});

const tooMany = (res) =>
  res.status(429).json({ status: "error", message: "Too many attempts. Please wait a few minutes and try again." });

// Middleware: resolves the logged-in customer from a "Bearer <customer token>" header
export const authenticateCustomer = async (req, res, next) => {
  try {
    const [scheme, token] = String(req.headers.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ status: "error", message: "Please log in to continue" });
    }
    const payload = jwt.verify(token, CUSTOMER_TOKEN_SECRET);
    if (payload.typ !== "customer" || !payload.customerId) {
      return res.status(401).json({ status: "error", message: "Invalid session" });
    }
    const member = await MemberModel.findById(payload.customerId);
    if (!member || member.isActive === false) {
      return res.status(401).json({ status: "error", message: "Account not found or deactivated" });
    }
    req.customer = member;
    next();
  } catch {
    res.status(401).json({ status: "error", message: "Your session has expired. Please log in again." });
  }
};

// POST /store/v1/customer-auth/register
export const register = async (req, res, next) => {
  try {
    if (!allowHit(`register:${clientIp(req)}`, { max: 10, windowMs: 60 * 60 * 1000 })) return tooMany(res);

    const name = cleanText(req.body?.name, 80);
    const email = cleanEmail(req.body?.email);
    const phone = cleanText(req.body?.phone, 20);
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (name.length < 2) return res.status(400).json({ status: "error", message: "Please enter your name" });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ status: "error", message: "Please enter a valid email address" });
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ status: "error", message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    if (await MemberModel.exists({ email })) {
      return res.status(409).json({
        status: "error",
        message: "An account with this email already exists. Log in, or use Forgot password to set a password.",
      });
    }

    const member = await MemberModel.create({ name, email, phone, passwordHash: await hashPassword(password) });
    res.status(201).json({ status: "success", data: { customer: publicCustomer(member), accessToken: signToken(member) } });
  } catch (error) {
    next(error);
  }
};

// POST /store/v1/customer-auth/login
export const login = async (req, res, next) => {
  try {
    const email = cleanEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) return res.status(400).json({ status: "error", message: "Email and password are required" });

    const limitKey = `login:${clientIp(req)}:${email}`;
    if (!allowHit(limitKey, { max: 10, windowMs: 15 * 60 * 1000 })) return tooMany(res);

    const member = await MemberModel.findOne({ email }).select("+passwordHash");
    const valid = member?.passwordHash ? await comparePassword(password, member.passwordHash) : false;
    if (!member || !valid) return res.status(401).json({ status: "error", message: "Invalid email or password" });
    if (member.isActive === false) return res.status(403).json({ status: "error", message: "This account is deactivated" });

    clearHits(limitKey);
    res.json({ status: "success", data: { customer: publicCustomer(member), accessToken: signToken(member) } });
  } catch (error) {
    next(error);
  }
};

// POST /store/v1/customer-auth/forgot-password — always answers the same, so emails can't be probed
export const forgotPassword = async (req, res, next) => {
  try {
    const email = cleanEmail(req.body?.email);
    if (!EMAIL_RE.test(email)) return res.status(400).json({ status: "error", message: "Please enter a valid email address" });
    if (!allowHit(`forgot:${clientIp(req)}`, { max: 5, windowMs: 15 * 60 * 1000 })) return tooMany(res);

    const member = await MemberModel.findOne({ email });
    if (member && member.isActive !== false && allowHit(`forgot-email:${email}`, { max: 3, windowMs: 15 * 60 * 1000 })) {
      const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
      member.emailOtp = otpHash(email, otp);
      member.emailOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
      await member.save();
      clearHits(`reset:${email}`);
      const sent = await sendOtpEmail({ toEmail: email, otp, name: member.name, type: "forgot-password", log: logger });
      if (!sent.delivered) logger.warn({ email, reason: sent.reason }, "Customer password reset email was not delivered");
    }

    res.json({
      status: "success",
      message: "If an account exists for that email, we have sent a 6-digit reset code. It expires in 10 minutes.",
    });
  } catch (error) {
    next(error);
  }
};

// POST /store/v1/customer-auth/reset-password — { email, otp, password }
export const resetPassword = async (req, res, next) => {
  try {
    const email = cleanEmail(req.body?.email);
    const otp = cleanText(req.body?.otp, 12);
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ status: "error", message: "Enter the 6-digit code from your email" });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ status: "error", message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }
    if (!allowHit(`reset:${email}`, { max: MAX_OTP_ATTEMPTS, windowMs: OTP_TTL_MS })) return tooMany(res);

    const member = await MemberModel.findOne({ email }).select("+passwordHash +emailOtp +emailOtpExpiresAt");
    const expected = member?.emailOtp && /^[0-9a-f]{64}$/.test(member.emailOtp) ? Buffer.from(member.emailOtp, "hex") : null;
    const given = Buffer.from(otpHash(email, otp), "hex");
    const matches = !!expected && expected.length === given.length && crypto.timingSafeEqual(expected, given);

    if (!member || member.isActive === false || !matches || !member.emailOtpExpiresAt || member.emailOtpExpiresAt < new Date()) {
      return res.status(400).json({ status: "error", message: "That code is invalid or has expired. Request a new one." });
    }

    member.passwordHash = await hashPassword(password);
    member.emailOtp = undefined;
    member.emailOtpExpiresAt = undefined;
    await member.save();
    clearHits(`reset:${email}`);
    sendPasswordChangedEmail({ toEmail: email, name: member.name, log: logger });

    res.json({ status: "success", data: { customer: publicCustomer(member), accessToken: signToken(member) } });
  } catch (error) {
    next(error);
  }
};

// GET /store/v1/customer-auth/me
export const me = (req, res) => {
  res.json({ status: "success", data: { customer: publicCustomer(req.customer) } });
};
