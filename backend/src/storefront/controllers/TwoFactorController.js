import { authenticator } from "otplib";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { UserModel } from "../../common/models/user.model.js";
import { comparePassword } from "../../common/utils/password.js";
import { createAccessToken, createRefreshToken } from "./AuthController.js";
import { env } from "../../common/config/env.js";
import { logger } from "../../common/config/logger.js";
import { buildTwoFactorQrEmailHtml } from "../../common/templates/twoFactorEmailTemplate.js";

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

// Generates/retrieves TOTP secret and emails QR Code to user
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

    // Generate OTPAuth URI for the TOTP app
    const otpauth = authenticator.keyuri(user.email, "Decantre BD", secret);

    // Render QR Code as PNG buffer for inline email attachment
    const qrCodeBuffer = await QRCode.toBuffer(otpauth, { width: 220, margin: 2 });

    // Build SMTP transport and sender address
    const transport = getTransport();
    const fromName = env.SMTP_FROM_NAME || "Decantre BD";
    const fromEmail = env.SMTP_FROM || env.SMTP_USER;
    const fromAddress = `"${fromName}" <${fromEmail}>`;

    // Build branded HTML email from template
    const htmlContent = buildTwoFactorQrEmailHtml({ name: user.name, secret });

    await transport.sendMail({
      from: fromAddress,
      to: user.email,
      subject: "Set Up Two-Factor Authentication — Decantre Dashboard",
      text: `Hello ${user.name},\n\nScan the QR code in your Google Authenticator app to set up 2FA.\nCan't scan? Enter this key manually: ${secret}\n\nIf you did not request this, change your password immediately.`,
      html: htmlContent,
      attachments: [
        {
          filename: "qrcode.png",
          content: qrCodeBuffer,
          cid: "qrcode", // Referenced as src="cid:qrcode" in the HTML template
        },
      ],
    });

    logger.info({ email: user.email }, "Dispatched 2FA QR code email successfully");

    res.json({
      status: "success",
      message: "A QR Code has been sent to your email. Scan it in your Authenticator app to continue.",
    });
  } catch (error) {
    next(error);
  }
};

// Verifies TOTP code, enables 2FA, and completes login by issuing tokens
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
      return res.status(400).json({ status: "error", message: "Invalid or expired 2FA code" });
    }

    // Mark 2FA as fully enabled and activated
    if (!user.twoFactorEnabled) {
      user.twoFactorEnabled = true;
    }

    // Issue tokens and update login stats
    const refreshToken = createRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_MS);
    user.lastLogin = new Date();
    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save();

    const accessToken = createAccessToken(user);

    logger.info({ userId: user.id }, "2FA verified, issued auth tokens successfully");

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
