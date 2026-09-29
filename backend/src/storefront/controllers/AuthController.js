import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { UserModel } from "../../common/models/user.model.js";
import { env } from "../../common/config/env.js";
import { logger } from "../../common/config/logger.js";
import { comparePassword, hashPassword } from "../../common/utils/password.js";

export const createAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN },
  );
};

export const createRefreshToken = () => {
  return crypto.randomBytes(48).toString("hex");
};

// Resolves wildcard root domain for cross-subdomain SSO cookies
export const getCookieDomain = (req) => {
  if (env.ROOT_DOMAIN) {
    return env.ROOT_DOMAIN.startsWith(".") ? env.ROOT_DOMAIN : `.${env.ROOT_DOMAIN}`;
  }
  const rawHost = req.headers["x-forwarded-host"] || req.headers.host || "";
  const host = rawHost.split(":")[0].toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1" || /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return undefined;
  }
  const parts = host.split(".");
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join(".")}`;
  }
  return undefined;
};

// Sets cross-subdomain SSO cookies for admin and cPanel authentication
export const setAuthCookies = (res, req, accessToken, refreshToken) => {
  const cookieDomain = getCookieDomain(req);
  const isProd = env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    domain: cookieDomain,
    path: "/",
  };

  if (accessToken) {
    res.cookie("access_token", accessToken, {
      ...cookieOptions,
      maxAge: env.ACCESS_TOKEN_EXPIRES_MS || 30 * 24 * 60 * 60 * 1000,
    });
    res.cookie("ops_token", accessToken, {
      ...cookieOptions,
      maxAge: env.ACCESS_TOKEN_EXPIRES_MS || 30 * 24 * 60 * 60 * 1000,
    });
  }

  if (refreshToken) {
    res.cookie("refresh_token", refreshToken, {
      ...cookieOptions,
      httpOnly: true,
      maxAge: env.REFRESH_TOKEN_EXPIRES_MS || 90 * 24 * 60 * 60 * 1000,
    });
  }
};

// Clears cross-subdomain SSO cookies on logout
export const clearAuthCookies = (res, req) => {
  const cookieDomain = getCookieDomain(req);
  const cookieOptions = { domain: cookieDomain, path: "/" };
  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("ops_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
};

// POST /auth/login - Validates credentials and logs in directly or prompts 2FA if enabled
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail || !password) {
      return res.status(400).json({ status: "error", message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!user || !user.passwordHash) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ status: "error", message: "This user account is currently deactivated." });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    if (user.twoFactorEnabled) {
      return res.json({
        status: "success",
        requires2fa: true,
        email: user.email,
      });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_MS);

    user.lastLogin = new Date();
    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save();

    setAuthCookies(res, req, accessToken, refreshToken);
    logger.info({ userId: user.id }, "Successfully logged in directly with SSO cookies");

    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          did: user.did,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
        },
        accessToken,
        accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
        refreshToken,
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/refresh - refresh token দিয়ে নতুন access token দেয়
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) {
      return res.status(400).json({ status: "error", message: "refreshToken is required" });
    }

    const user = await UserModel.findOne({ refreshToken }).select("+refreshToken +refreshTokenExpiresAt");
    if (!user || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
      return res.status(401).json({ status: "error", message: "Invalid or expired refresh token" });
    }

    const newRefreshToken = createRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_MS);
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save();

    if (!newRefreshToken) {
      logger.error({ userId: user.id }, "Failed to generate refresh token on refresh");
      return res.status(500).json({ status: "error", message: "Failed to issue refresh token" });
    }

    const accessToken = createAccessToken(user);

    setAuthCookies(res, req, accessToken, newRefreshToken);
    logger.debug({ userId: user.id }, "Rotated refresh token and issued new access token with SSO cookies");

    res.json({
      status: "success",
      data: {
        accessToken,
        accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/logout - refresh token সরিয়ে লগআউট করে
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {};
    clearAuthCookies(res, req);

    if (!refreshToken) {
      return res.status(200).json({ status: "success", message: "Logged out successfully" });
    }

    const user = await UserModel.findOne({ refreshToken }).select("+refreshToken +refreshTokenExpiresAt");
    if (user) {
      user.refreshToken = undefined;
      user.refreshTokenExpiresAt = undefined;
      await user.save();
    }

    res.json({ status: "success", message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// POST /auth/create-super-admin - সুপার অ্যাডমিন তৈরি বা আপডেট করে
export const createSuperAdmin = async (req, res, next) => {
  try {
    if (!env.ALLOW_SUPER_ADMIN_CREATION) {
      return res.status(403).json({ status: "error", message: "Super admin creation is disabled" });
    }

    const { name, email, password } = req.body ?? {};
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const trimmedPassword = typeof password === "string" ? password : "";

    const errors = [];
    if (!trimmedName) {
      errors.push("name is required");
    }
    if (!trimmedEmail) {
      errors.push("email is required");
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      errors.push("password is required and must be at least 6 characters");
    }

    if (errors.length > 0) {
      return res.status(400).json({ status: "error", message: "Invalid payload", errors });
    }

    let user = await UserModel.findOne({ email: trimmedEmail });
    if (user) {
      user.name = trimmedName;
      user.role = "Super_Admin";
      user.passwordHash = await hashPassword(trimmedPassword);
      user.isActive = true;
      await user.save();
      return res.status(200).json({ status: "success", message: "Super admin updated", data: { id: user.id, email: user.email, role: user.role } });
    }

    user = await UserModel.create({
      name: trimmedName,
      email: trimmedEmail,
      passwordHash: await hashPassword(trimmedPassword),
      role: "Super_Admin",
      isActive: true,
    });

    res.status(201).json({ status: "success", message: "Super admin created", data: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

// POST /auth/google - Google OAuth দিয়ে লগইন করে
export const googleAuth = async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body ?? {};

    if (!code || !redirectUri) {
      return res.status(400).json({ status: "error", message: "Authorization code and redirectUri are required" });
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      logger.error("Google credentials are not configured in the backend environment");
      return res.status(500).json({ status: "error", message: "Google Auth is not configured on this server" });
    }

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorDetail = await tokenResponse.json().catch(() => ({}));
      logger.error({ errorDetail }, "Failed to exchange authorization code for Google token");
      return res.status(400).json({ status: "error", message: "Failed to authenticate with Google" });
    }

    const tokens = await tokenResponse.json();
    const { access_token } = tokens;

    if (!access_token) {
      logger.error("No access token returned from Google");
      return res.status(400).json({ status: "error", message: "Failed to retrieve access token from Google" });
    }

    // 2. Fetch user profile
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      logger.error("Failed to fetch Google user profile");
      return res.status(400).json({ status: "error", message: "Failed to fetch user profile from Google" });
    }

    const googleUser = await userResponse.json();
    const { email } = googleUser;

    if (!email) {
      logger.error("Google profile did not contain an email address");
      return res.status(400).json({ status: "error", message: "Google account does not have an email address" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Search for registered user in database
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      logger.warn({ email: normalizedEmail }, "Google login attempt for unregistered email");
      return res.status(401).json({
        status: "error",
        message: `The email ${normalizedEmail} is not registered in this store administration portal. Please contact your system administrator.`,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ status: "error", message: "This user account is currently deactivated." });
    }

    // 4. Authenticate user by issuing JWTs
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_MS);

    user.lastLogin = new Date();
    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save();

    logger.info({ userId: user.id }, "Successfully logged in via Google Auth");

    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          did: user.did,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
        },
        accessToken,
        accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
        refreshToken,
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/invite/verify - Verify invitation token
export const verifyInviteToken = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ status: "error", message: "Invitation token is required" });
    }

    const cleanToken = token.trim();
    const user = await UserModel.findOne({
      $or: [{ inviteToken: cleanToken }],
    }).select("+passwordHash +inviteToken +inviteTokenExpiresAt");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Invalid or expired invitation link. Please request a new invite from the administrator.",
      });
    }

    // Check if user is already registered and active
    if (user.isActive && user.passwordHash) {
      return res.json({
        status: "already_registered",
        message: "You are already registered with our system.",
        data: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    // Check if invite token has expired
    if (user.inviteTokenExpiresAt && user.inviteTokenExpiresAt < new Date()) {
      return res.status(400).json({
        status: "expired",
        message: "This invitation link has expired. Please ask your administrator to send a new invite.",
      });
    }

    res.json({
      status: "valid",
      message: "Invitation is valid.",
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/invite/accept - Accept invitation and set password
export const acceptInvite = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body ?? {};

    if (!token || typeof token !== "string") {
      return res.status(400).json({ status: "error", message: "Invitation token is required" });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ status: "error", message: "Both password and confirmation password are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ status: "error", message: "Passwords do not match" });
    }

    // Strong password validation: 8+ chars, upper, lower, number, special char
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    const cleanToken = token.trim();
    const user = await UserModel.findOne({ inviteToken: cleanToken }).select("+passwordHash +inviteToken +inviteTokenExpiresAt");

    if (!user) {
      return res.status(404).json({ status: "error", message: "Invalid or expired invitation link" });
    }

    if (user.inviteTokenExpiresAt && user.inviteTokenExpiresAt < new Date()) {
      return res.status(400).json({ status: "error", message: "This invitation link has expired. Please request a new invite." });
    }

    // Hash password and activate user
    user.passwordHash = await hashPassword(password);
    user.isActive = true;
    user.inviteToken = undefined;
    user.inviteTokenExpiresAt = undefined;
    await user.save();

    res.json({
      status: "success",
      message: "Password set and account activated successfully. You may now log in to the dashboard.",
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};


