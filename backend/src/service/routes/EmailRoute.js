import { Router } from "express";
import { buildInvoiceEmailHtml } from "../../common/utils/invoiceEmailTemplate.js";
import { env } from "../../common/config/env.js";
import { config } from "../../common/config/index.js";
import { getSmtpTransport } from "../../common/services/smtpConfig.service.js";

const emailRouter = Router();

// Sends an email using active database or environment SMTP configuration
const sendEmail = async ({ toEmail, subject, text, html }) => {
  const { transport, config: smtpConfig } = await getSmtpTransport();
  if (!smtpConfig.isConfigured || !transport) {
    throw new Error("SMTP credentials are not configured in DB or .env");
  }
  const fromName = smtpConfig.fromName || config.brandName || env.SMTP_FROM_NAME || "Surokkha";
  const fromEmail = smtpConfig.fromEmail || smtpConfig.user || env.SMTP_FROM || env.SMTP_USER;
  
  return await transport.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject,
    text,
    html,
  });
};

// Handles test email requests
const handleEmailRequest = async (req, res) => {
  const email = String(req.query?.email || req.body?.email || "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      status: "error",
      message: "Valid email is required",
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
      message: error.message || "Failed to send email",
      details: error.message,
    });
  }
};

// Handles sample invoice email generation and dispatch
const handleInvoiceRequest = async (req, res) => {
  const email = String(req.query?.email || req.body?.email || "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      status: "error",
      message: "Valid email is required",
    });
  }

  const invoiceNumber = req.body.invoiceNumber || req.query.invoiceNumber || `INV-${Date.now()}`;
  const sellerBrand = req.body.sellerName || req.query.sellerName || config.brandName || "Surokkha";
  const sellerAddress = req.body.sellerAddress || req.query.sellerAddress || config.contact?.address || config.address || "Dhaka, Bangladesh";
  const invoiceDomain = config.domain || "surokkha.store";
  const invoiceLogo = req.body.logoUrl || req.query.logoUrl || config.logoUrl || "https://admin.surokkha.store/surokkha_logo.png";

  const invoiceData = {
    invoiceNumber,
    createdDate: req.body.createdDate || req.query.createdDate || new Date().toLocaleDateString(),
    dueDate: req.body.dueDate || req.query.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    sellerName: sellerBrand,
    sellerAddress,
    buyerName: req.body.buyerName || req.query.buyerName || "Valued Customer",
    buyerAddress: req.body.buyerAddress || req.query.buyerAddress || "Customer Address",
    buyerEmail: req.body.buyerEmail || req.query.buyerEmail || email,
    paymentMethod: req.body.paymentMethod || req.query.paymentMethod || "Cash on Delivery",
    paymentReference: req.body.paymentReference || req.query.paymentReference || "N/A",
    items: Array.isArray(req.body.items)
      ? req.body.items
      : Array.isArray(req.query.items)
      ? req.query.items
      : [
          {
            description: "Product Item",
            price: "1000.00",
            total: "1000.00",
          },
        ],
    subtotal: req.body.subtotal || req.query.subtotal || "1000.00",
    taxes: req.body.taxes || req.query.taxes || "0.00",
    discount: req.body.discount || req.query.discount || "0.00",
    total: req.body.total || req.query.total || "1000.00",
    invoiceUrl:
      req.body.invoiceUrl || req.query.invoiceUrl || `https://${invoiceDomain}/invoice/${invoiceNumber}`,
    notes: req.body.notes || req.query.notes || "Thank you for shopping with Surokkha.",
    logoUrl: invoiceLogo,
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
