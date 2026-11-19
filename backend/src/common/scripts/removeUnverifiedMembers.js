// One-time cleanup: removes members whose email was never verified (old forceMembershipFromOrder rows,
// checkout-made accounts never claimed, and abandoned sign-ups). Customers collection is untouched.
// Dry run by default; pass --apply to delete.
import { connectDatabase, closeDatabase } from "../database/index.js";
import { MemberModel } from "../models/member.model.js";

const filter = { $or: [{ isEmailVerified: { $ne: true } }, { registrationPending: true }] };

const run = async () => {
  await connectDatabase();
  const [total, fakeDomain, checkout, pending] = await Promise.all([
    MemberModel.countDocuments(filter),
    MemberModel.countDocuments({ ...filter, email: { $regex: /^(\d+|customer_\d+)@/ } }),
    MemberModel.countDocuments({ ...filter, createdFromCheckout: true }),
    MemberModel.countDocuments({ ...filter, registrationPending: true }),
  ]);
  const verified = await MemberModel.countDocuments({ isEmailVerified: true, registrationPending: { $ne: true } });
  console.log(`Verified members kept: ${verified}`);
  console.log(`Unverified members: ${total} (phone/customer_ emails: ${fakeDomain}, from checkout: ${checkout}, pending sign-up: ${pending})`);
  const sample = await MemberModel.find(filter).select("email createdAt").sort({ createdAt: -1 }).limit(10).lean();
  sample.forEach((m) => console.log(`  - ${m.email}  ${m.createdAt?.toISOString?.().slice(0, 10) || ""}`));

  if (process.argv.includes("--apply") && total > 0) {
    const { deletedCount } = await MemberModel.deleteMany(filter);
    console.log(`Deleted: ${deletedCount}`);
  } else {
    console.log("Dry run only. Re-run with --apply to delete.");
  }
  await closeDatabase();
};

run().catch(async (err) => {
  console.error("Cleanup failed:", err.message);
  await closeDatabase().catch(() => {});
  process.exit(1);
});
