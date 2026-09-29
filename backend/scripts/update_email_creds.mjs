import mongoose from "mongoose";
import { StoreSettingsModel } from "../src/common/models/storeSettings.model.js";
import { encryptText } from "../src/common/utils/crypto.util.js";
import { env } from "../src/common/config/env.js";

async function run() {
  console.log("Connecting to MongoDB:", env.MONGODB_URI);
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const email = "support@surokkha.store";
  const password = "P@ss0265";
  const encryptedPassword = encryptText(password);

  console.log("Encrypting password...");

  const updatePayload = {
    "smtp.host": "smtp.hostinger.com",
    "smtp.port": 465,
    "smtp.secure": true,
    "smtp.user": email,
    "smtp.password": encryptedPassword,
    "smtp.senderName": "Surokkha",
    "smtp.senderEmail": email,
    "smtp.isEnabled": true,

    "imap.host": "imap.hostinger.com",
    "imap.port": 993,
    "imap.secure": true,
    "imap.user": email,
    "imap.password": encryptedPassword,
    "imap.isEnabled": true,
  };

  console.log("Updating StoreSettingsModel in DB...");
  const updatedDoc = await StoreSettingsModel.findOneAndUpdate(
    { key: "default" },
    { $set: updatePayload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  console.log("Store Settings updated successfully.");
  console.log("SMTP configured host:", updatedDoc.smtp.host);
  console.log("IMAP configured host:", updatedDoc.imap.host);
}

run()
  .then(() => {
    mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed to update credentials:", err);
    mongoose.disconnect();
    process.exit(1);
  });
