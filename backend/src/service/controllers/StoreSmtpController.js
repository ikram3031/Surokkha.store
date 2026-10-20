import nodemailer from "nodemailer";
import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import { encryptText, decryptText } from "../../common/utils/crypto.util.js";

// Store (surokkha.store) SMTP settings: kept in their own document, separate from the shop's
export const STORE_SMTP_KEY = "store-smtp";

// Retrieves the store's SMTP settings
export const getStoreSmtpSettings = async (req, res, next) => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: STORE_SMTP_KEY }).lean();
    const dbSmtp = doc?.smtp || {};

    const data = {
      host: dbSmtp.host || "",
      port: dbSmtp.port || 465,
      secure: dbSmtp.secure ?? true,
      user: dbSmtp.user || "",
      password: decryptText(dbSmtp.password || ""),
      senderName: dbSmtp.senderName || "Surokkha Store",
      senderEmail: dbSmtp.senderEmail || "",
      isEnabled: dbSmtp.isEnabled ?? false,
      isPersistedInDb: Boolean(doc?.smtp?.host),
    };

    return res.json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};

// Persists updated store SMTP settings to database
export const updateStoreSmtpSettings = async (req, res, next) => {
  try {
    const {
      host = "",
      port = 465,
      secure = true,
      user = "",
      password = "",
      senderName = "",
      senderEmail = "",
      isEnabled = false,
    } = req.body || {};

    const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
      { key: STORE_SMTP_KEY },
      {
        $set: {
          "smtp.host": String(host).trim(),
          "smtp.port": Number(port),
          "smtp.secure": Boolean(secure),
          "smtp.user": String(user).trim(),
          "smtp.password": password ? encryptText(String(password).trim()) : "",
          "smtp.senderName": String(senderName).trim(),
          "smtp.senderEmail": String(senderEmail).trim(),
          "smtp.isEnabled": Boolean(isEnabled),
          updatedBy: req.user?.userId || null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      status: "success",
      message: "Store SMTP settings saved successfully.",
      data: {
        ...updatedDoc.smtp,
        password: decryptText(updatedDoc.smtp.password || ""),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Executes a live test connection for the store's SMTP config
export const testStoreSmtpConnection = async (req, res, next) => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: STORE_SMTP_KEY }).lean();
    const currentConfig = doc?.smtp || {};

    const targetHost = (req.body?.host || currentConfig.host || "").trim();
    const targetPort = Number(req.body?.port || currentConfig.port || 465);
    const targetSecure = req.body?.secure !== undefined ? Boolean(req.body.secure) : (currentConfig.secure ?? true);
    const targetUser = (req.body?.user || currentConfig.user || "").trim();
    const targetPassword = (req.body?.password || decryptText(currentConfig.password || "")).trim();

    if (!targetHost || !targetUser || !targetPassword) {
      return res.status(400).json({
        status: "error",
        message: "Host, user, and password are required to test the connection.",
      });
    }

    const transporter = nodemailer.createTransport({
      host: targetHost,
      port: targetPort,
      secure: targetSecure,
      auth: {
        user: targetUser,
        pass: targetPassword,
      },
    });

    const senderName = (req.body?.senderName || currentConfig.senderName || "Surokkha Store").trim();
    const senderEmail = (req.body?.senderEmail || currentConfig.senderEmail || targetUser).trim();
    const recipientEmail = (req.body?.recipientEmail || req.body?.to || "").trim();

    try {
      await transporter.verify();

      let emailSent = false;
      if (recipientEmail) {
        const fromAddress = `"${senderName}" <${senderEmail}>`;
        await transporter.sendMail({
          from: fromAddress,
          to: recipientEmail,
          subject: `Test Email from ${senderName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h2 style="color: #4f46e5; margin-top: 0;">SMTP Test Email</h2>
              <p>Congratulations! Your store SMTP email server connection has been successfully verified.</p>
              <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #4f46e5;">
                <p style="margin: 0;"><strong>Sender:</strong> ${fromAddress}</p>
                <p style="margin: 5px 0 0 0;"><strong>Recipient:</strong> ${recipientEmail}</p>
                <p style="margin: 5px 0 0 0;"><strong>Server:</strong> ${targetHost}:${targetPort}</p>
              </div>
              <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">This is an automated test message sent from your Store Admin Dashboard.</p>
            </div>
          `,
        });
        emailSent = true;
      }

      return res.json({
        status: "success",
        message: emailSent
          ? `SMTP connection verified and test email sent to ${recipientEmail}!`
          : "SMTP connection verified successfully.",
        emailSent,
      });
    } catch (err) {
      return res.status(400).json({
        status: "error",
        message: err.message || "Failed to verify SMTP connection.",
        details: err,
      });
    }
  } catch (error) {
    next(error);
  }
};
