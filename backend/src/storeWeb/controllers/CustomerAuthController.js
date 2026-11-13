import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { MemberModel } from "../../common/models/member.model.js";
import { env } from "../../common/config/env.js";
import { logger } from "../../common/config/logger.js";
import { comparePassword, hashPassword } from "../../common/utils/password.js";
import { allowHit, clearHits } from "../../common/utils/rateLimit.js";
import { sendOtpEmail, sendPasswordChangedEmail } from "../../common/utils/otpDelivery.js";
import { newUserFreeDeliveryFor } from "../../common/utils/promo.js";
import { OrderModel } from "../../common/models/order.model.js";

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

// The logged-in customer from a "Bearer <customer token>" header, or null (never throws)
export const customerFromRequest = async (req) => {
  try {
    const [scheme, token] = String(req.headers.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) return null;
    const payload = jwt.verify(token, CUSTOMER_TOKEN_SECRET);
    if (payload.typ !== "customer" || !payload.customerId) return null;
    const member = await MemberModel.findById(payload.customerId);
    return member && member.isActive !== false ? member : null;
  } catch {
    return null;
  }
};

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
    if (!/^1[3-9]\d{8}$/.test(phone.replace(/\D/g, "").slice(-10))) {
      return res.status(400).json({ status: "error", message: "Please enter a valid mobile number" });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ status: "error", message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const existing = await MemberModel.findOne({ email });
    if (existing && !existing.registrationPending) {
      return res.status(409).json({
        status: "error",
        message: "An account with this email already exists. Log in, or use Forgot password to set a password.",
      });
    }

    // Signing up again before verifying just refreshes the details and sends a new code
    const member = existing || new MemberModel({ email, registrationPending: true, isEmailVerified: false });
    member.name = name;
    member.phone = phone;
    member.passwordHash = await hashPassword(password);
    member.registrationPending = true;
    await member.save();

    const sent = await sendVerificationCode(member);
    if (!sent) return res.status(503).json({ status: "error", message: "We could not send the verification email. Please try again in a moment." });
    res.status(201).json({
      status: "success",
      data: { verificationRequired: true, email },
      message: "We have emailed you a 6-digit code. Enter it to finish creating your account.",
    });
  } catch (error) {
    next(error);
  }
};

// Emails a fresh 6-digit sign-up code; false when the email could not be sent
const sendVerificationCode = async (member) => {
  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  member.emailOtp = otpHash(member.email, otp);
  member.emailOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  await member.save();
  clearHits(`verify:${member.email}`);
  const sent = await sendOtpEmail({ toEmail: member.email, otp, name: member.name, type: "registration", site: "store", log: logger });
  if (!sent.delivered) logger.warn({ email: member.email, reason: sent.reason }, "Customer sign-up code email was not delivered");
  return sent.delivered;
};

// POST /store/v1/customer-auth/verify-email — { email, otp }: finishes sign-up and logs the customer in
export const verifyEmail = async (req, res, next) => {
  try {
    const email = cleanEmail(req.body?.email);
    const otp = cleanText(req.body?.otp, 12);
    if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ status: "error", message: "Enter the 6-digit code from your email" });
    }
    if (!allowHit(`verify:${email}`, { max: MAX_OTP_ATTEMPTS, windowMs: OTP_TTL_MS })) return tooMany(res);

    const member = await MemberModel.findOne({ email }).select("+emailOtp +emailOtpExpiresAt");
    const expected = member?.emailOtp && /^[0-9a-f]{64}$/.test(member.emailOtp) ? Buffer.from(member.emailOtp, "hex") : null;
    const given = Buffer.from(otpHash(email, otp), "hex");
    const matches = !!expected && expected.length === given.length && crypto.timingSafeEqual(expected, given);
    if (!member || member.isActive === false || !matches || !member.emailOtpExpiresAt || member.emailOtpExpiresAt < new Date()) {
      return res.status(400).json({ status: "error", message: "That code is invalid or has expired. Request a new one." });
    }

    member.isEmailVerified = true;
    member.emailVerifiedAt = new Date();
    member.registrationPending = false;
    member.emailOtp = undefined;
    member.emailOtpExpiresAt = undefined;
    await member.save();
    clearHits(`verify:${email}`);
    res.json({ status: "success", data: { customer: publicCustomer(member), accessToken: signToken(member) } });
  } catch (error) {
    next(error);
  }
};

// POST /store/v1/customer-auth/resend-verification — { email }; same answer whether or not a sign-up is pending
export const resendVerification = async (req, res, next) => {
  try {
    const email = cleanEmail(req.body?.email);
    if (!EMAIL_RE.test(email)) return res.status(400).json({ status: "error", message: "Please enter a valid email address" });
    if (!allowHit(`resend:${clientIp(req)}`, { max: 5, windowMs: 15 * 60 * 1000 })) return tooMany(res);
    const member = await MemberModel.findOne({ email });
    if (member?.registrationPending && allowHit(`resend-email:${email}`, { max: 3, windowMs: 15 * 60 * 1000 })) {
      await sendVerificationCode(member);
    }
    res.json({ status: "success", message: "If a sign-up is waiting for that email, we have sent a new code." });
  } catch (error) {
    next(error);
  }
};

// GET /store/v1/customer-auth/promo — which preset offers the logged-in customer can use right now
export const myPromo = async (req, res, next) => {
  try {
    const nufd = await newUserFreeDeliveryFor(req.customer);
    res.json({ status: "success", data: { newUserFreeDelivery: nufd.eligible ? { minOrderAmount: nufd.minOrderAmount } : null } });
  } catch (error) {
    next(error);
  }
};

// GET /store/v1/customer-auth/checkout-details
// Contact and address from this customer's latest order, to pre-fill checkout. Matched on the verified
// account email only (the phone is not verified, so it could point at someone else's orders).
export const checkoutDetails = async (req, res, next) => {
  try {
    const member = req.customer;
    const pick = (o) => (o ? { fullName: o.fullName || "", phone: o.phone || "", address: o.address || "", district: o.district || "", thana: o.thana || "" } : null);
    const order = member?.email
      ? await OrderModel.findOne({ "billingInfo.email": member.email }).sort({ createdAt: -1 }).select("billingInfo shippingInfo").lean()
      : null;
    res.json({
      status: "success",
      data: {
        billing: order ? { ...pick(order.billingInfo), email: order.billingInfo?.email || member.email } : { fullName: member?.name || "", phone: member?.phone || "", email: member?.email || "", address: "", district: "", thana: "" },
        shipping: order ? pick(order.shippingInfo) : null,
      },
    });
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
    if (member.registrationPending) {
      if (allowHit(`resend-email:${email}`, { max: 3, windowMs: 15 * 60 * 1000 })) await sendVerificationCode(member);
      return res.status(403).json({
        status: "error",
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email first. We have sent a 6-digit code to your inbox.",
      });
    }

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
      const sent = await sendOtpEmail({ toEmail: email, otp, name: member.name, type: "forgot-password", site: "store", log: logger });
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

// ---------- Customer dashboard: my orders + saved addresses ----------

const phoneVariants = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length < 10) return [];
  const local = "0" + digits.slice(-10);
  return [local, "88" + local, "+88" + local];
};

const customerStatus = (o) => {
  const slug = String(o.courier?.orderStatusSlug || o.courier?.orderStatus || "").toLowerCase();
  switch (o.status) {
    case "processing":
    case "hold":
      return "confirmed";
    case "shipped":
      return /out|assigned.?for.?delivery|on.?the.?way/.test(slug) ? "out" : "shipped";
    case "completed":
      return "delivered";
    case "cancelled":
    case "fake":
      return "cancelled";
    case "return":
      return "returned";
    default:
      return "pending";
  }
};

const toCustomerOrder = (o) => ({
  id: o.orderNumber,
  status: customerStatus(o),
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
  total: o.totals?.total || 0,
  subtotal: o.totals?.subtotal || 0,
  shipping: o.totals?.shippingFee ?? o.shippingTotalAmount ?? 0,
  discount: o.discountTotalAmount || 0,
  paymentMethod: o.paymentMethod,
  paymentStatus: o.paymentStatus,
  items: (o.items || []).map((i) => ({ name: i.name, qty: i.quantity, price: i.unitPrice, image: i.image || "", size: i.size || "" })),
  courier: {
    provider: o.courier?.consignmentId ? o.courier?.provider || "" : "",
    consignmentId: o.courier?.consignmentId || "",
    trackingCode: o.courier?.trackingCode || "",
    status: o.courier?.orderStatus || "",
    dispatchedAt: o.courier?.dispatchedAt || null,
    deliveredAt: o.courier?.deliveredAt || null,
    lastEventAt: o.courier?.lastEventAt || null,
  },
  shippingInfo: o.shippingInfo?.address ? o.shippingInfo : o.billingInfo,
});

// GET /store/v1/customer-auth/orders — every order placed with this account's email or phone
export const myOrders = async (req, res, next) => {
  try {
    const member = req.customer;
    const phones = [member.phone, ...(member.phones || [])].flatMap(phoneVariants);
    const or = [];
    if (member.email) or.push({ "billingInfo.email": member.email });
    if (phones.length) or.push({ "billingInfo.phone": { $in: phones } });
    if (!or.length) return res.json({ status: "success", data: [] });
    const orders = await OrderModel.find({ $or: or, active: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(200)
      .select("orderNumber status createdAt updatedAt totals shippingTotalAmount discountTotalAmount paymentMethod paymentStatus items courier billingInfo shippingInfo")
      .lean();
    res.json({ status: "success", data: orders.map(toCustomerOrder) });
  } catch (error) {
    next(error);
  }
};

const ADDRESS_LABELS = ["Home", "Office", "Other"];
const cleanStr = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// GET /store/v1/customer-auth/addresses
export const getAddresses = async (req, res) => {
  res.json({ status: "success", data: req.customer.addresses || [] });
};

// PUT /store/v1/customer-auth/addresses — replaces the whole saved list
export const saveAddresses = async (req, res, next) => {
  try {
    const list = Array.isArray(req.body?.addresses) ? req.body.addresses.slice(0, 10) : null;
    if (!list) return res.status(400).json({ status: "error", message: "addresses must be a list" });
    const clean = list
      .map((a) => ({
        id: Number(a?.id) || Date.now(),
        label: ADDRESS_LABELS.includes(a?.label) ? a.label : "Other",
        name: cleanStr(a?.name, 100),
        phone: cleanStr(a?.phone, 20),
        division: cleanStr(a?.division, 50),
        district: cleanStr(a?.district, 50),
        area: cleanStr(a?.area, 100),
        address: cleanStr(a?.address, 300),
        isDefault: a?.isDefault === true,
      }))
      .filter((a) => a.name && a.phone && a.address);
    if (clean.length && !clean.some((a) => a.isDefault)) clean[0].isDefault = true;
    req.customer.addresses = clean;
    req.customer.markModified("addresses");
    await req.customer.save();
    res.json({ status: "success", data: clean });
  } catch (error) {
    next(error);
  }
};
