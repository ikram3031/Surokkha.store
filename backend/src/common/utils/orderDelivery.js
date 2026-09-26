import nodemailer from "nodemailer";
import { UserModel } from "../models/user.model.js";
import { EmailMessageModel } from "../models/emailMessage.model.js";
import { getClientInvoiceHtml } from "../templates/invoices/index.js";
import { buildAdminOrderEmailHtml } from "../templates/adminOrderEmailTemplate.js";
import { env } from "../config/env.js";
import { config } from "../config/index.js";

let defaultTransport;

// Dynamically retrieve or initialize SMTP transport
const getTransport = () => {
  if (!defaultTransport) {
    const isSecure =
      Number(env.SMTP_PORT) === 465 ||
      String(env.SMTP_ENCRYPTION).toLowerCase() === "ssl";

    const isLocalhost = env.SMTP_HOST === "127.0.0.1" || env.SMTP_HOST === "localhost";
    const hasAuth = !isLocalhost && env.SMTP_PASSWORD && env.SMTP_PASSWORD !== "none" && env.SMTP_USER;

    const transportConfig = {
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: isSecure,
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    };

    if (hasAuth) {
      transportConfig.auth = {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      };
    }

    defaultTransport = nodemailer.createTransport(transportConfig);
  }
  return defaultTransport;
};

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
      if (!env.SMTP_USER) {
        console.warn("[Email Notification] SMTP credentials not configured. Skipping email dispatch.");
        return;
      }

      const activeTransport = getTransport();
      const activeClientKey = (order.client || config.clientKey || process.env.CLIENT_NAME || env.CLIENT_NAME || "surokkha").toLowerCase().trim();
      const brandDisplayName = env.SMTP_FROM_NAME || config.brandName || (activeClientKey === "surokkha" ? "Surokkha" : "Decantre BD");
      const fromEmail = env.SMTP_FROM || env.SMTP_USER;
      const fromAddress = { name: brandDisplayName, address: fromEmail };

      // Extract order details with complete alignment to OrderModel schema
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

      // Build primary customer address (Billing Address) from OrderModel billingInfo schema
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

      // Resolve Shipping Address (Use custom shippingInfo if provided; otherwise fallback to billingAddress)
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

        // Combine size and concentration for complete variant display
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

      const invoiceHtml = getClientInvoiceHtml({
        order: formattedOrderData,
        client: activeClientKey,
        logoUrl: config.logoUrl || undefined,
      });

      // 1. Send Customer Order Confirmation Email (to customer email)
      if (isValidCustomerEmail(customerEmail)) {
        try {
          await activeTransport.sendMail({
            from: fromAddress,
            to: customerEmail,
            replyTo: { name: brandDisplayName, address: fromEmail },
            subject: `${brandDisplayName}: Order Confirmation - #${orderId}`,
            html: invoiceHtml
          });
          console.log(`[Email Notification] Customer confirmation email sent to: ${customerEmail}`);
        } catch (custErr) {
          console.error(`[Email Notification] Failed sending customer email to ${customerEmail}:`, custErr.message);
        }
      }

      // 2. Resolve Admin Recipients
      const adminRecipientsSet = new Set();
      if (activeClientKey === "decantre") {
        adminRecipientsSet.add("decantre.store@gmail.com");
      }

      try {
        const superAdmins = await UserModel.find({
          role: { $in: ["Owner", "Admin", "Super Admin", "Manager"] },
          $or: [{ isActive: true }, { active: true }, { isActive: { $exists: false } }],
          receiveEmailNotifications: { $ne: false },
        }).select("email receiveEmailNotifications").lean();

        for (const adminUser of superAdmins) {
          if (adminUser.email && adminUser.receiveEmailNotifications !== false) {
            adminRecipientsSet.add(adminUser.email.toLowerCase().trim());
          }
        }
      } catch (dbErr) {
        console.error("[Email Notification] Database query for super admin emails failed, falling back to default admins:", dbErr.message);
      }

      // Explicitly EXCLUDE emails that should not receive admin notifications
      adminRecipientsSet.delete("ikramul.web@gmail.com");
      adminRecipientsSet.delete("md.ikr4m@gmail.com");

      // For demo / plexivia environment, ensure info@plexivia.online receives notifications
      if (activeClientKey === "demo" || (env.SMTP_USER && env.SMTP_USER.includes("plexivia"))) {
        adminRecipientsSet.add("info@plexivia.online");
      }

      const adminRecipients = Array.from(adminRecipientsSet);
      console.log(`[Email Notification] Admin notification targets: ${adminRecipients.join(", ")}`);

      // Send Admin New Order Notification Email to all resolved admin emails
      if (adminRecipients.length > 0) {
        try {
          await activeTransport.sendMail({
            from: fromAddress,
            to: adminRecipients,
            replyTo: isValidCustomerEmail(customerEmail)
              ? { name: customerName, address: customerEmail }
              : { name: brandDisplayName, address: fromEmail },
            subject: `${brandDisplayName}: You have got a new order - #${orderId}`,
            html: invoiceHtml
          });
          console.log(`[Email Notification] Admin notification email successfully sent to: ${adminRecipients.join(", ")}`);
        } catch (adminErr) {
          console.error(`[Email Notification] Failed sending admin email to ${adminRecipients.join(", ")}:`, adminErr.message);
        }
      }

      // 3. Ingest New Order directly into Dashboard Webmail INBOX
      try {
        const existingOrderEmail = await EmailMessageModel.findOne({
          subject: { $regex: `#${orderId}`, $options: "i" },
          folder: "INBOX",
        });

        if (!existingOrderEmail) {
          const customerSenderAddress = isValidCustomerEmail(customerEmail)
            ? customerEmail
            : `orders@${config.domain || "surokkha.store"}`;

          await EmailMessageModel.create({
            messageId: `order-${orderId}-${Date.now()}@${config.domain || "surokkha.store"}`,
            folder: "INBOX",
            from: {
              name: customerName || "Online Store Customer",
              address: customerSenderAddress,
            },
            to: [{
              name: brandDisplayName,
              address: fromEmail,
            }],
            replyTo: [{
              name: customerName || "Online Store Customer",
              address: customerSenderAddress,
            }],
            subject: `🛒 New Order Placed: #${orderId} (${customerName}) - ৳${totalAmount}`,
            snippet: `New order #${orderId} placed by ${customerName}. Total: ৳${totalAmount}. Phone: ${customerPhone}. Payment: ${paymentMethod}`,
            bodyHtml: invoiceHtml,
            bodyText: `New order #${orderId} placed by ${customerName}.\nTotal: ৳${totalAmount}\nPhone: ${customerPhone}\nAddress: ${billingAddress?.fullAddress || ""}\nPayment: ${paymentMethod}`,
            date: new Date(),
            isRead: false,
            isStarred: true,
            active: true,
          });
          console.log(`[Email Notification] Successfully ingested order #${orderId} into Dashboard Webmail INBOX.`);
        }
      } catch (inboxErr) {
        console.error(`[Email Notification] Failed to ingest order #${orderId} into Dashboard INBOX:`, inboxErr.message);
      }

    } catch (globalErr) {
      console.error("[Email Notification] Unexpected error in async email handler:", globalErr.message);
    }
  });
}
