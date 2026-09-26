import dotenv from "dotenv";
dotenv.config();

import { sendOtpEmail } from "../../src/common/utils/otpDelivery.js";

async function run() {
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_USER:", process.env.SMTP_USER);
  
  const result = await sendOtpEmail({
    toEmail: "mdikram3031@gmail.com",
    otp: "123456",
    name: "Test User",
    type: "registration"
  });
  
  console.log("Result:", result);
}

run().catch(console.error);
