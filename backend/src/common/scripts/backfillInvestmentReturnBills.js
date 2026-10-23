// Creates the missing "Investment Return" bills for money already paid back to investors.
// Returns entered through the investment edit form never made a bill, so they never left the account balance.
//
// Usage (dry run is the default and changes nothing):
//   node src/common/scripts/backfillInvestmentReturnBills.js --uri mongodb://127.0.0.1:27019/surokkha-db
//   node src/common/scripts/backfillInvestmentReturnBills.js --uri ... --apply
import mongoose from "mongoose";
import { InvestmentModel } from "../models/investment.model.js";
import { InvestorModel } from "../models/investor.model.js";
import { BillingModel } from "../models/billing.model.js";
import { BillTypeModel } from "../models/billType.model.js";

const args = process.argv.slice(2);
const argValue = (name) => {
  const index = args.indexOf(name);
  return index !== -1 ? args[index + 1] : undefined;
};

const MONGO_URI = argValue("--uri") || process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/surokkha";
const APPLY = args.includes("--apply");

const money = (n) => `৳${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const findReturnBillType = async () =>
  BillTypeModel.findOne({ name: { $regex: /^investment return$/i } });

const ensureReturnBillType = async () =>
  (await findReturnBillType()) ||
  BillTypeModel.create({
    name: "Investment Return",
    description: "Repayments and capital returns paid back to investors and stakeholders",
    status: "active",
    isDefault: false,
  });

async function run() {
  console.log(`Connecting to ${MONGO_URI.replace(/\/\/[^@]*@/, "//***@")}`);
  await mongoose.connect(MONGO_URI);
  console.log(APPLY ? "Mode: APPLY (bills will be created)\n" : "Mode: DRY RUN (nothing is written; add --apply to create bills)\n");

  const billType = await findReturnBillType();
  const investments = await InvestmentModel.find({ returnedAmount: { $gt: 0 } }).sort({ takenDate: 1, createdAt: 1 }).lean();
  const existingBills = billType
    ? await BillingModel.find({ billTypeId: billType._id }).lean()
    : [];

  // Group by investor: the Return modal's "all tranches" mode links one bill to just the first tranche,
  // so billed totals are compared per investor first, then spread over that investor's tranches.
  const byInvestor = new Map();
  for (const inv of investments) {
    const key = String(inv.investorId);
    if (!byInvestor.has(key)) byInvestor.set(key, []);
    byInvestor.get(key).push(inv);
  }

  const plan = [];
  for (const [investorId, tranches] of byInvestor) {
    const investorBills = existingBills.filter((b) => String(b.investorId) === investorId);
    const totalReturned = tranches.reduce((sum, inv) => sum + Number(inv.returnedAmount || 0), 0);
    const totalBilled = investorBills.reduce((sum, b) => sum + Number(b.paidAmount || b.amount || 0), 0);
    let missing = Math.round((totalReturned - totalBilled) * 100) / 100;
    if (missing <= 0) continue;

    for (const inv of tranches) {
      if (missing <= 0) break;
      const billedForTranche = investorBills
        .filter((b) => b.investmentId && String(b.investmentId) === String(inv._id))
        .reduce((sum, b) => sum + Number(b.paidAmount || b.amount || 0), 0);
      const unbilled = Math.max(0, Number(inv.returnedAmount || 0) - billedForTranche);
      const amount = Math.min(unbilled, missing);
      if (amount <= 0) continue;
      plan.push({ investorId, investment: inv, amount });
      missing = Math.round((missing - amount) * 100) / 100;
    }
  }

  if (plan.length === 0) {
    console.log("Every investment return already has a bill. Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  const investors = await InvestorModel.find({ _id: { $in: [...new Set(plan.map((p) => p.investorId))] } }).lean();
  const investorById = new Map(investors.map((i) => [String(i._id), i]));

  let total = 0;
  for (const item of plan) {
    const investor = investorById.get(item.investorId);
    const name = investor?.name || `(missing investor ${item.investorId})`;
    const date = item.investment.returnedDate || item.investment.updatedAt || new Date();
    console.log(
      `${APPLY ? "CREATE" : "WOULD CREATE"}  ${name.padEnd(24)} tranche ${String(item.investment.did || item.investment._id).padEnd(18)} ${money(item.amount).padStart(12)}  dated ${new Date(date).toISOString().slice(0, 10)}`
    );
    total += item.amount;

    if (APPLY && investor) {
      const type = billType || (await ensureReturnBillType());
      await BillingModel.create({
        billTypeId: type._id,
        investorId: investor._id,
        investmentId: item.investment._id,
        title: `Investment Return - ${investor.name}`,
        name: investor.name,
        billingPhone: investor.phone || "",
        billingEmail: investor.email || "",
        baseAmount: item.amount,
        totalAmount: item.amount,
        paidAmount: item.amount,
        pendingAmount: 0,
        amount: item.amount,
        status: "paid",
        billingDate: date,
        dueDate: date,
        billingMethod: item.investment.paymentMethod || "Bank Transfer",
        notes: `Backfilled repayment to investor ${investor.name}`,
      });
    }
  }

  console.log(`\n${plan.length} bill(s), ${money(total)} in total ${APPLY ? "created" : "would be created"}.`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Backfill failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
