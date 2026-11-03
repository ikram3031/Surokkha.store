// Resets an Owner's 2FA and ends their sessions. Server access is required on purpose.
//   node src/common/scripts/resetOwner2fa.js owner@example.com
import mongoose from "mongoose";
import { env } from "../config/env.js";

const email = process.argv[2]?.toLowerCase().trim();
if (!email) {
  console.error("Usage: node src/common/scripts/resetOwner2fa.js <owner-email>");
  process.exit(1);
}

await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });

const result = await mongoose.connection.db.collection("users").updateOne(
  { email, role: "Owner" },
  { $unset: { twoFactorSecret: "" }, $set: { twoFactorConfirmed: false, twoFactorEnabled: true, refreshTokens: [] } },
);

console.log(
  result.matchedCount
    ? `2FA reset for ${email}. A new setup QR code is emailed on their next login.`
    : `No Owner found with email ${email}.`,
);

await mongoose.disconnect();
