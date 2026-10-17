import { authenticator } from "otplib";
import QRCode from "qrcode";
import { UserModel } from "../../common/models/user.model.js";
import { comparePassword } from "../../common/utils/password.js";
import { createAccessToken, createRefreshToken, setAuthCookies } from "./AuthController.js";
import { env } from "../../common/config/env.js";
import { logger } from "../../common/config/logger.js";
import { config as clientConfig } from "../../common/config/index.js";
import { buildTwoFactorQrEmailHtml } from "../../common/templates/twoFactorEmailTemplate.js";
import { getSmtpTransport } from "../../common/services/smtpConfig.service.js";

authenticator.options = { window: 1 };

// Dispatches the 2FA Setup QR Code & key exclusively via registered email for maximum security
export const dispatchTwoFactorSetupEmail = async ({ user, secret }) => {
  try {
    const { transport, config: smtpConfig } = await getSmtpTransport();
    if (!smtpConfig.isConfigured) {
      logger.warn({ email: user.email }, "Cannot send 2FA setup email: SMTP is not configured");
      return false;
    }

    const brandName = smtpConfig.fromName || clientConfig?.brandName || env.SMTP_FROM_NAME || "Surokkha";
    const otpauth = authenticator.keyuri(user.email, brandName, secret);
    const qrCodeBuffer = await QRCode.toBuffer(otpauth, {
      width: 240,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    const fromEmail = smtpConfig.fromEmail || smtpConfig.user || env.SMTP_FROM || `noreply@${clientConfig?.domain || "example.com"}`;
    const fromAddress = `"${brandName}" <${fromEmail}>`;

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
    logger.info({ email: user.email }, "Dispatched 2FA setup email with QR code successfully");
    return true;
  } catch (err) {
    logger.error({ email: user.email, error: err.message }, "Failed to send 2FA setup email");
    return false;
  }
};

// Generates/retrieves TOTP secret and emails QR Code strictly to the user's verified inbox
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

    let secret = user.twoFactorSecret;
    if (!secret) {
      secret = authenticator.generateSecret();
      user.twoFactorSecret = secret;
      await user.save();
    }

    Promise.resolve().then(async () => {
      await dispatchTwoFactorSetupEmail({ user, secret });
    });

    res.json({
      status: "success",
      message: "Setup QR code and instructions have been sent to your registered email address.",
      data: {
        email: user.email,
        emailSent: true,
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

    const user = await UserModel.findOne({ email: normalizedEmail }).select("+passwordHash +twoFactorSecret +refreshTokens");
    if (!user || !user.passwordHash) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ status: "error", message: "Invalid credentials" });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ status: "error", message: "2FA has not been set up yet. Please request a setup email first." });
    }

    const isTokenValid = authenticator.verify({
      token: trimmedCode,
      secret: user.twoFactorSecret,
    });

    if (!isTokenValid) {
      return res.status(400).json({ status: "error", message: "Invalid or expired 2FA code. Please check your authenticator app and try again." });
    }

    user.twoFactorEnabled = true;

    const refreshToken = createRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_MS);
    user.lastLogin = new Date();
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens = user.refreshTokens.filter((rt) => rt.expiresAt > new Date());
    user.refreshTokens.push({ token: refreshToken, expiresAt: refreshTokenExpiresAt });
    await user.save();

    const accessToken = createAccessToken(user);

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
    targetUser.twoFactorEnabled = true;
    await targetUser.save();

    logger.info({ adminId: req.user?.userId, targetUserId }, "Admin reset 2FA for user");

    res.json({
      status: "success",
      message: `2FA reset for ${targetUser.name || targetUser.email}. A new setup QR code will be emailed upon their next login.`,
    });
  } catch (error) {
    next(error);
  }
};
