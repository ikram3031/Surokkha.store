// One-time cleanup: removes the "New Order Placed" rows the order flow used to write into the webmail INBOX.
// Those rows never came from IMAP; real mail is untouched. Run with --dry to only count them.
import { connectDatabase, closeDatabase } from "../database/index.js";
import { EmailMessageModel } from "../models/emailMessage.model.js";

const filter = {
  folder: "INBOX",
  messageId: { $regex: /^order-.+-\d+@/ },
  subject: { $regex: /New Order Placed: #/ },
};

const run = async () => {
  await connectDatabase();
  const count = await EmailMessageModel.countDocuments(filter);
  console.log(`Fake order inbox entries found: ${count}`);
  if (!process.argv.includes("--dry") && count > 0) {
    const { deletedCount } = await EmailMessageModel.deleteMany(filter);
    console.log(`Deleted: ${deletedCount}`);
  }
  await closeDatabase();
};

run().catch(async (err) => {
  console.error("Cleanup failed:", err.message);
  await closeDatabase().catch(() => {});
  process.exit(1);
});
