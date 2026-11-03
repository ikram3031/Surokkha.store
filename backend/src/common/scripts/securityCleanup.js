// One-time cleanup after the role hardening. Lists problems by default; pass --apply to fix them.
//   node src/common/scripts/securityCleanup.js
//   node src/common/scripts/securityCleanup.js --apply
import mongoose from "mongoose";
import { env } from "../config/env.js";

const apply = process.argv.includes("--apply");

await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
const { db } = mongoose.connection;

// Registration used to accept any role, so these accounts may be attacks
const rogueMembers = await db
  .collection("members")
  .find({ role: { $nin: ["Customer", null] } })
  .project({ email: 1, name: 1, role: 1, createdAt: 1 })
  .toArray();

console.log(`Members with a non-Customer role: ${rogueMembers.length}`);
rogueMembers.forEach((m) => console.log(`  ${m.email} | ${m.name} | role=${m.role} | created=${m.createdAt?.toISOString?.()}`));

const legacyUsers = await db.collection("users").countDocuments({ role: "Marketing-Expert" });
console.log(`Users with legacy role "Marketing-Expert": ${legacyUsers}`);

const owners = await db.collection("users").find({ role: "Owner" }).project({ email: 1, isActive: 1, twoFactorConfirmed: 1 }).toArray();
console.log(`Owners: ${owners.length}`);
owners.forEach((o) => console.log(`  ${o.email} | active=${o.isActive} | 2FA confirmed=${Boolean(o.twoFactorConfirmed)}`));

if (apply) {
  const members = await db.collection("members").updateMany({ role: { $nin: ["Customer", null] } }, { $set: { role: "Customer" } });
  const users = await db.collection("users").updateMany({ role: "Marketing-Expert" }, { $set: { role: "Marketing Expert" } });
  console.log(`Applied: ${members.modifiedCount} member(s) reset to Customer, ${users.modifiedCount} user role(s) renamed.`);
} else {
  console.log("Dry run only. Re-run with --apply to fix the above.");
}

await mongoose.disconnect();
