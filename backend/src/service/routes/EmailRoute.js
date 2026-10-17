import { Router } from "express";
import nodemailer from "nodemailer";
import { buildInvoiceEmailHtml } from "../../common/utils/invoiceEmailTemplate.js";
import { env } from "../../common/config/env.js";
import { config } from "../../common/config/index.js";

const emailRouter = Router();

let transporter;

// Dynamically retrieve or initialize SMTP transporter
const getTransporter = () => {
  if (!transporter) {
    const isSecure =
      Number(env.SMTP_PORT) === 465 ||
      String(env.SMTP_ENCRYPTION).toLowerCase() === "ssl";

    transporter = nodemailer.createTransport({
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
  return transporter;
};

const sendEmail = async ({ toEmail, subject, text, html }) => {
  const activeTransporter = getTransporter();
  const fromName = env.SMTP_FROM_NAME || config.brandName || "Customer Support";
  const fromEmail = env.SMTP_FROM || env.SMTP_USER;
  
  await activeTransporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject,
    text,
    html,
  });
};

const handleEmailRequest = async (req, res) => {
  const email = String(req.query?.email || req.body?.email || "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      status: "error",
      message: "Valid email is required",
    });
  }

  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
    return res.status(500).json({
      status: "error",
      message: "SMTP credentials are not configured",
    });
  }

  try {
    await sendEmail({
      toEmail: email,
      subject: "Testing successful",
      text: "Testing successful",
      html: "<p><strong>Testing successful</strong></p>",
    });

    return res.status(200).json({
      status: "success",
      message: "Email sent successfully",
      email,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to send email",
      details: error.message,
    });
  }
};

const handleInvoiceRequest = async (req, res) => {
  const email = String(req.query?.email || req.body?.email || "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      status: "error",
      message: "Valid email is required",
    });
  }

  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
    return res.status(500).json({
      status: "error",
      message: "SMTP credentials are not configured",
    });
  }

  const invoiceNumber = req.body.invoiceNumber || req.query.invoiceNumber || `INV-${Date.now()}`;
  const invoiceData = {
    invoiceNumber,
    createdDate: req.body.createdDate || req.query.createdDate || new Date().toLocaleDateString(),
    dueDate: req.body.dueDate || req.query.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    sellerName: req.body.sellerName || req.query.sellerName || config.brandName || "",
    sellerAddress: req.body.sellerAddress || req.query.sellerAddress || config.address || "Dhaka, Bangladesh",
    buyerName: req.body.buyerName || req.query.buyerName || "Customer",
    buyerAddress: req.body.buyerAddress || req.query.buyerAddress || "Customer Address",
    buyerEmail: req.body.buyerEmail || req.query.buyerEmail || email,
    paymentMethod: req.body.paymentMethod || req.query.paymentMethod || "COD",
    paymentReference: req.body.paymentReference || req.query.paymentReference || "N/A",
    items: Array.isArray(req.body.items)
      ? req.body.items
      : Array.isArray(req.query.items)
      ? req.query.items
      : [
          {
            description: "Product Sample",
            price: "1000.00",
            total: "1000.00",
          }
        ],
    subtotal: req.body.subtotal || req.query.subtotal || "1000.00",
    taxes: req.body.taxes || req.query.taxes || "0.00",
    discount: req.body.discount || req.query.discount || "0.00",
    total: req.body.total || req.query.total || "1000.00",
    invoiceUrl:
      req.body.invoiceUrl || req.query.invoiceUrl || `https://${config.domain || "example.com"}/invoice/${invoiceNumber}`,
    notes: req.body.notes || req.query.notes || "Thank you for your business.",
    logoUrl: req.body.logoUrl || req.query.logoUrl || config.logoUrl || "/uploads/assets/logo.webp",
  };

  try {
    const html = buildInvoiceEmailHtml(invoiceData);

    await sendEmail({
      toEmail: email,
      subject: `Invoice ${invoiceData.invoiceNumber}`,
      text: `Invoice ${invoiceData.invoiceNumber}`,
      html,
    });

    return res.status(200).json({
      status: "success",
      message: "Invoice email sent successfully",
      email,
      invoiceNumber: invoiceData.invoiceNumber,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to send invoice email",
      details: error.message,
    });
  }
};

emailRouter.get("/", handleEmailRequest);
emailRouter.post("/", handleEmailRequest);
emailRouter.post("/invoice", handleInvoiceRequest);

export default emailRouter;
