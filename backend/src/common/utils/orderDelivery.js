import { resolveAlertRecipients } from "./notificationRecipients.js";
import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { buildOrderInvoiceEmailHtml } from "../templates/orderInvoiceEmailTemplate.js";
import { buildAdminOrderEmailHtml } from "../templates/adminOrderEmailTemplate.js";
import { env } from "../config/env.js";
import { config } from "../config/index.js";
import { getSmtpTransport, getWebmailAddress, copyToWebmailInbox } from "../services/smtpConfig.service.js";

// Validates whether the given email address is deliverable rather than dummy or system-generated
const isValidCustomerEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  if (
    normalized.includes("instore@") ||
    normalized.includes("noemail") ||
    normalized.includes("dummy") ||
    normalized.endsWith("@store.com")
  ) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
};

// Safely send customer and admin order notification emails asynchronously
export const sendOrderEmailsAsynchronously = (order) => {
  setImmediate(async () => {
    try {
      const [{ transport: activeTransport, config: smtpConfig }, webmailAddress] = await Promise.all([
        getSmtpTransport(),
        getWebmailAddress(),
      ]);

      if (!smtpConfig.isConfigured) {
        console.warn(`[Email Notification] SMTP credentials not fully configured (host: ${smtpConfig.host}, user: ${smtpConfig.user || 'none'}). Skipping SMTP dispatch.`);
      }

      const activeClientKey = (order.client || config.clientKey || process.env.CLIENT_NAME || env.CLIENT_NAME || "surokkha").toLowerCase().trim();
      const brandDisplayName = smtpConfig.fromName || config.brandName || "Surokkha";
      const fromEmail = smtpConfig.fromEmail || smtpConfig.user || webmailAddress || `no-reply@${config.domain || 'surokkha.store'}`;
      const fromAddress = { name: brandDisplayName, address: fromEmail };
      const customerReplyTo = webmailAddress ? { name: brandDisplayName, address: webmailAddress } : fromAddress;
      console.log(`[Email Notification] Preparing order emails via SMTP (${smtpConfig.host}:${smtpConfig.port}, user: ${fromEmail})...`);

      const orderId = order.orderNumber || order.did || order._id?.toString()?.slice(-6) || "N/A";
      const isInstoreOrder =
        order.orderType === "instore" ||
        order.orderType === "in-store" ||
        String(orderId).startsWith("IS") ||
        (order.paymentMethod && String(order.paymentMethod).toLowerCase() === "instore") ||
        (order.billingInfo?.email && order.billingInfo.email.includes("instore@"));

      if (isInstoreOrder) {
        return;
      }

      const customerEmail = order.billingInfo?.email || "";
      const customerName = order.billingInfo?.fullName || "Customer";
      const customerPhone = order.billingInfo?.phone || "N/A";
      const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

      const primaryAddrParts = [
        order.billingInfo?.address,
        order.billingInfo?.thana,
        order.billingInfo?.district,
        order.billingInfo?.zip ? `Zip: ${order.billingInfo?.zip}` : ''
      ].filter(Boolean);

      const billingAddress = {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        street: order.billingInfo?.address || "",
        thana: order.billingInfo?.thana || "",
        district: order.billingInfo?.district || "",
        zipCode: order.billingInfo?.zip || "",
        fullAddress: primaryAddrParts.join(', ')
      };

      let shippingAddress = billingAddress;
      if (order.shippingInfo && typeof order.shippingInfo === 'object') {
        const customStreet = order.shippingInfo.address || order.shippingInfo.street;
        if (customStreet && customStreet.trim()) {
          const customAddrParts = [
            customStreet,
            order.shippingInfo.thana,
            order.shippingInfo.district,
            order.shippingInfo.zip ? `Zip: ${order.shippingInfo.zip}` : ''
          ].filter(Boolean);

          shippingAddress = {
            name: order.shippingInfo.fullName || customerName,
            phone: order.shippingInfo.phone || customerPhone,
            street: customStreet,
            thana: order.shippingInfo.thana || "",
            district: order.shippingInfo.district || "",
            zipCode: order.shippingInfo.zip || "",
            fullAddress: customAddrParts.join(', ')
          };
        }
      }

      const items = Array.isArray(order.items) ? order.items.map(item => {
        const quantity = Number(item.quantity || 1);
        const price = Number(item.unitPrice ?? item.price ?? 0);
        const subtotal = Number(item.subtotal ?? item.total ?? (price * quantity) ?? 0);
        const finalPrice = price || (subtotal / quantity) || 0;
        const finalSubtotal = subtotal || (finalPrice * quantity) || 0;

        const variantParts = [item.size, item.concentration, item.variant, item.variantName].filter(Boolean);
        const variantName = [...new Set(variantParts)].join(' • ');

        return {
          productName: item.name || item.productName || "Product",
          variantName,
          quantity,
          price: finalPrice,
          subtotal: finalSubtotal
        };
      }) : [];

      const subtotal = Number(order.totals?.subtotal || order.subtotal || 0);
      const shippingFee = Number(order.totals?.shippingFee || order.shippingFee || order.totals?.shippingTotalAmount || 0);
      const discountAmount = Number(order.discountTotalAmount || order.totals?.discount || 0);
      const calculatedTotal = subtotal + shippingFee - discountAmount;
      const totalAmount = Number(order.totals?.total !== undefined ? order.totals.total : (order.totalAmount !== undefined ? order.totalAmount : calculatedTotal));
      const couponCode = order.couponCode ? String(order.couponCode).trim().toUpperCase() : null;
      const paymentMethod = order.paymentMethod || "Cash on Delivery (COD)";

      const formattedOrderData = {
        orderId,
        status: order.status || "processing",
        orderType: order.orderType || "online",
        createdAt,
        customerName,
        customerEmail,
        customerPhone,
        billingAddress,
        shippingAddress,
        items,
        subtotal,
        shippingFee,
        discountAmount,
        couponCode,
        totalAmount,
        paymentMethod
      };

      const emailLogoUrl = (config.logoUrl && config.logoUrl.startsWith("http"))
        ? config.logoUrl
        : (activeClientKey === "surokkha"
            ? "https://admin.surokkha.store/surokkha_logo.png"
            : (config.domain ? `https://${config.domain}${config.logoUrl || '/uploads/assets/logo.webp'}` : "https://admin.surokkha.store/surokkha_logo.png"));

      let templateConfig = null;
      try {
        const storeSettings = await StoreSettingsModel.findOne({ key: "default" }).lean();
        if (storeSettings?.templates?.isActive) {
          templateConfig = storeSettings.templates;
        }
      } catch (_) {}

      const invoiceHtml = buildOrderInvoiceEmailHtml({
        order: formattedOrderData,
        client: activeClientKey,
        logoUrl: emailLogoUrl,
        templateConfig,
      });

      if (smtpConfig.isConfigured && activeTransport && isValidCustomerEmail(customerEmail)) {
        try {
          await activeTransport.sendMail({
            from: fromAddress,
            to: customerEmail,
            replyTo: customerReplyTo,
            subject: `${brandDisplayName}: Order Confirmation - #${orderId}`,
            html: invoiceHtml
          });
          console.log(`[Email Notification] Customer confirmation email sent to: ${customerEmail}`);
        } catch (custErr) {
          console.error(`[Email Notification] Failed sending customer email to ${customerEmail}:`, custErr.message);
        }
      }

      const isCustomOrder =
        order.orderType === "custom" ||
        String(orderId).startsWith("CO");

      let adminRecipients = [];
      try {
        adminRecipients = await resolveAlertRecipients();
      } catch (dbErr) {
        console.error("[Email Notification] Loading alert email recipients failed:", dbErr.message);
      }
      console.log(`[Email Notification] Admin notification targets (${adminRecipients.length}): ${adminRecipients.join(", ")}`);

      const adminSubject = `🛒 ${brandDisplayName}: New Order Received - #${orderId} (৳${totalAmount})`;
      const adminReplyTo = isValidCustomerEmail(customerEmail)
        ? { name: customerName, address: customerEmail }
        : customerReplyTo;
      const adminEmailHtml = buildAdminOrderEmailHtml({
        order: formattedOrderData,
        logoUrl: emailLogoUrl,
      }) || invoiceHtml;

      if (smtpConfig.isConfigured && activeTransport && adminRecipients.length > 0) {
        try {
          await activeTransport.sendMail({
            from: fromAddress,
            to: adminRecipients,
            replyTo: adminReplyTo,
            subject: adminSubject,
            html: adminEmailHtml
          });
          console.log(`[Email Notification] Admin notification email successfully sent to: ${adminRecipients.join(", ")}`);
        } catch (adminErr) {
          console.error(`[Email Notification] Failed sending admin email to ${adminRecipients.join(", ")}:`, adminErr.message);
        }
      } else if (!smtpConfig.isConfigured) {
        console.warn(`[Email Notification] SMTP is not configured. Admin notification skipped.`);
      }

      // Copy ONLY regular orders into Webmail Inbox; custom orders (CO...) do NOT go to Webmail Inbox
      if (!isCustomOrder) {
        await copyToWebmailInbox({
          from: fromAddress,
          to: webmailAddress || fromEmail,
          replyTo: adminReplyTo,
          subject: adminSubject,
          html: adminEmailHtml,
        });
      }
    } catch (globalErr) {
      console.error("[Email Notification] Unexpected error in async email handler:", globalErr.message);
    }
  });
};
