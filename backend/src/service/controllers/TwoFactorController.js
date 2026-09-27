import { authenticator } from "otplib";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { UserModel } from "../../common/models/user.model.js";
import { comparePassword } from "../../common/utils/password.js";
import { createAccessToken, createRefreshToken, setAuthCookies } from "./AuthController.js";
import { env } from "../../common/config/env.js";
import { logger } from "../../common/config/logger.js";
import { config as clientConfig } from "../../common/config/index.js";
import { buildTwoFactorQrEmailHtml } from "../../common/templates/twoFactorEmailTemplate.js";

// Configure authenticator with a 1-step window to accommodate minor time drift
authenticator.options = { window: 1 };

let defaultTransport;

// Helper to initialize or retrieve SMTP transport
const getTransport = () => {
  if (!defaultTransport) {
    const isSecure =
      Number(env.SMTP_PORT) === 465 ||
      String(env.SMTP_ENCRYPTION).toLowerCase() === "ssl";

    defaultTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: isSecure,
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return defaultTransport;
};

// Generates/retrieves TOTP secret, generates QR Code, and emails it to user
export const sendQrCodeEmail = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail || !password) {
      return res.status(400).json({ status: "error", message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email: normalizedEmail }).select("+passwordHash +twoFactorSecret");
    if (!user || !user.passwordHash) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    // Generate secret if not already set
    let secret = user.twoFactorSecret;
    if (!secret) {
      secret = authenticator.generateSecret();
      user.twoFactorSecret = secret;
      await user.save();
    }

    const brandName = clientConfig?.brandName || env.SMTP_FROM_NAME || "Surokkha";

    // Generate OTPAuth URI for the TOTP app (e.g. Google Authenticator)
    const otpauth = authenticator.keyuri(user.email, brandName, secret);

    // Generate DataURL for instant on-screen rendering
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth, {
      width: 240,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // Render QR Code as PNG buffer for inline email attachment
    const qrCodeBuffer = await QRCode.toBuffer(otpauth, { width: 220, margin: 2 });

    let emailSent = false;
    // Attempt sending email if SMTP is configured
    if (env.SMTP_HOST && env.SMTP_USER) {
      try {
        const transport = getTransport();
        const fromName = env.SMTP_FROM_NAME || brandName;
        const fromEmail = env.SMTP_FROM || env.SMTP_USER;
        const fromAddress = `"${fromName}" <${fromEmail}>`;

        const htmlContent = buildTwoFactorQrEmailHtml({
          name: user.name,
          secret,
          brandName,
        });

        await transport.sendMail({
          from: fromAddress,
          to: user.email,
          subject: `Set Up Two-Factor Authentication — ${brandName} Dashboard`,
          text: `Hello ${user.name},\n\nScan the QR code in your Google Authenticator app to set up 2FA.\nCan't scan? Enter this key manually: ${secret}\n\nIf you did not request this, change your password immediately.`,
          html: htmlContent,
          attachments: [
            {
              filename: "qrcode.png",
              content: qrCodeBuffer,
              cid: "qrcode",
            },
          ],
        });
        emailSent = true;
        logger.info({ email: user.email }, "Dispatched 2FA QR code email successfully");
      } catch (mailErr) {
        logger.warn({ error: mailErr.message }, "Could not send 2FA email, providing on-screen QR Code fallback");
      }
    }

    res.json({
      status: "success",
      message: emailSent
        ? "A QR Code has been sent to your email and is ready below. Scan it in Google Authenticator."
        : "QR Code generated successfully. Scan it in your Google Authenticator app to continue.",
      data: {
        qrCodeDataUrl,
        secret,
        email: user.email,
        brandName,
        emailSent,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verifies TOTP code, enables 2FA, sets SSO cookies, and completes login by issuing tokens
export const verify2fa = async (req, res, next) => {
  try {
    const { email, password, code } = req.body ?? {};
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const trimmedCode = typeof code === "string" ? code.trim() : "";

    if (!normalizedEmail || !password || !trimmedCode) {
      return res.status(400).json({ status: "error", message: "Email, password, and 2FA code are required" });
    }

    const user = await UserModel.findOne({ email: normalizedEmail }).select("+passwordHash +twoFactorSecret");
    if (!user || !user.passwordHash) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ status: "error", message: "2FA has not been set up yet. Please request a QR Code first." });
    }

    // Verify TOTP code
    const isTokenValid = authenticator.verify({
      token: trimmedCode,
      secret: user.twoFactorSecret,
    });

    if (!isTokenValid) {
      return res.status(400).json({ status: "error", message: "Invalid or expired 2FA code. Please check your authenticator app and try again." });
    }

    // Mark 2FA as fully enabled and activated
    user.twoFactorEnabled = true;

    // Issue tokens and update login stats
    const refreshToken = createRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_MS);
    user.lastLogin = new Date();
    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save();

    const accessToken = createAccessToken(user);

    // Set SSO cookies
    setAuthCookies(res, req, accessToken, refreshToken);

    logger.info({ userId: user.id }, "2FA verified, issued auth tokens and SSO cookies successfully");

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

// Admin reset 2FA secret for a user if they lost their device
export const resetUser2fa = async (req, res, next) => {
  try {
    const { targetUserId } = req.body ?? {};
    if (!targetUserId) {
      return res.status(400).json({ status: "error", message: "targetUserId is required" });
    }

    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ status: "error", message: "Target user not found" });
    }

    targetUser.twoFactorSecret = undefined;
    targetUser.twoFactorEnabled = true; // Still keep 2FA enforced, but prompt new QR scan on next login
    await targetUser.save();

    logger.info({ adminId: req.user?.userId, targetUserId }, "Admin reset 2FA for user");

    res.json({
      status: "success",
      message: `2FA reset for ${targetUser.name || targetUser.email}. They will be prompted to scan a new QR code on their next login.`,
    });
  } catch (error) {
    next(error);
  }
};
