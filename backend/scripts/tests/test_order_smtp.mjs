import mongoose from "mongoose";
import { getSmtpConfig, getSmtpTransport } from "../../src/common/services/smtpConfig.service.js";
import { sendOrderEmailsAsynchronously } from "../../src/common/utils/orderDelivery.js";
import { env } from "../../src/common/config/env.js";

async function runTest() {
  console.log("=== Testing SMTP Config Resolution ===");
  
  console.log("Connecting to MongoDB for test...");
  await mongoose.connect(env.MONGODB_URI);
  
  const config = await getSmtpConfig();
  console.log("Active SMTP Config:", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    isConfigured: config.isConfigured,
    source: config.source,
  });

  const { transport, isConfigured } = await getSmtpTransport();
  console.log("Transport initialized. Configured:", isConfigured);

  if (isConfigured) {
    try {
      console.log("Verifying connection to SMTP host:", config.host);
      await transport.verify();
      console.log("SUCCESS: Connected to SMTP host successfully!");
    } catch (err) {
      console.error("WARNING: SMTP transport verify failed:", err.message);
    }
  } else {
    console.log("SMTP is not configured with user credentials.");
  }

  console.log("\n=== Testing Order Notification Email Dispatch Logic ===");
  const testOrder = {
    _id: "650000000000000000000999",
    orderNumber: "TEST-9999",
    status: "processing",
    orderType: "online",
    createdAt: new Date(),
    billingInfo: {
      fullName: "Test Customer",
      email: "testcustomer@example.com",
      phone: "01700000000",
      address: "123 Test Street",
      district: "Dhaka",
      thana: "Gulshan",
    },
    items: [
      {
        name: "Test Perfume 100ml",
        quantity: 1,
        unitPrice: 1500,
        subtotal: 1500,
      },
    ],
    totals: {
      subtotal: 1500,
      shippingFee: 60,
      total: 1560,
    },
    paymentMethod: "COD",
  };

  console.log("Triggering sendOrderEmailsAsynchronously for test order...");
  sendOrderEmailsAsynchronously(testOrder);

  // Wait 3 seconds for async setImmediate to complete
  await new Promise((res) => setTimeout(res, 3000));
  console.log("Order email dispatch complete!");
  
  await mongoose.disconnect();
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
