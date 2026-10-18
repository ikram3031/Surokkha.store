import mongoose from "mongoose";
import { InvestmentModel } from "../../common/models/investment.model.js";
import { InvestorModel } from "../../common/models/investor.model.js";
import { BillingModel } from "../../common/models/billing.model.js";
import { BillTypeModel } from "../../common/models/billType.model.js";
import { logger } from "../../common/config/logger.js";

const { Types } = mongoose;

// Derives the investment status from financial figures if not explicitly provided
const deriveInvestmentStatus = (explicitStatus, takenAmount, returnedAmount) => {
  if (explicitStatus && ["active", "returned", "partial", "pending"].includes(explicitStatus.toLowerCase())) {
    return explicitStatus.toLowerCase();
  }
  const taken = Number(takenAmount || 0);
  const returned = Number(returnedAmount || 0);
  if (returned >= taken && taken > 0) return "returned";
  if (returned > 0) return "partial";
  return "active";
};

// Retrieves a paginated and filtered list of investments
export const listInvestments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const filter = {};

    if (req.query.investorId) {
      const invId = req.query.investorId;
      if (Types.ObjectId.isValid(invId)) {
        filter.investorId = new Types.ObjectId(invId);
      }
    }

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status.toString().trim().toLowerCase();
    }

    const startDate = req.query.startDate || req.query.from;
    const endDate = req.query.endDate || req.query.to;
    if (startDate || endDate) {
      const dateField = req.query.dateField || "takenDate";
      filter[dateField] = {};
      if (startDate) {
        filter[dateField].$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        if (endDate.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        filter[dateField].$lte = end;
      }
    }

    if (req.query.search) {
      const search = req.query.search.toString().trim();
      if (search.length > 0) {
        const searchRegex = { $regex: search, $options: "i" };
        const matchedInvestors = await InvestorModel.find({
          $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
        }).select("_id").lean();
        const matchedInvestorIds = matchedInvestors.map((i) => i._id);

        filter.$or = [
          { notes: searchRegex },
          { did: searchRegex },
          { paymentMethod: searchRegex },
          { investorId: { $in: matchedInvestorIds } },
        ];
      }
    }

    const total = await InvestmentModel.countDocuments(filter);
    const investments = await InvestmentModel.find(filter)
      .populate("investorId", "name email phone did status type")
      .sort({ takenDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const aggregateTotals = await InvestmentModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTakenAmount: { $sum: "$takenAmount" },
          totalReturnedAmount: { $sum: "$returnedAmount" },
        },
      },
    ]);

    const totalTakenAmount = aggregateTotals[0]?.totalTakenAmount || 0;
    const totalReturnedAmount = aggregateTotals[0]?.totalReturnedAmount || 0;
    const netAmount = totalTakenAmount - totalReturnedAmount;

    return res.json({
      status: "success",
      data: investments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalTakenAmount,
        totalReturnedAmount,
        netAmount,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to list investments");
    next(error);
  }
};

// Retrieves a single investment entry by ID
export const getInvestmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = Types.ObjectId.isValid(id) ? { _id: id } : { did: id };
    const investment = await InvestmentModel.findOne(query)
      .populate("investorId", "name email phone did status type")
      .lean();

    if (!investment) {
      return res.status(404).json({ status: "error", message: "Investment not found" });
    }

    return res.json({ status: "success", data: investment });
  } catch (error) {
    logger.error({ error }, "Failed to get investment by ID");
    next(error);
  }
};

// Creates a new investment record
export const createInvestment = async (req, res, next) => {
  try {
    const {
      investorId,
      takenAmount,
      returnedAmount,
      takenDate,
      returnedDate,
      status,
      paymentMethod,
      notes,
    } = req.body ?? {};

    if (!investorId) {
      return res.status(400).json({ status: "error", message: "investorId is required" });
    }

    let investor = null;
    if (Types.ObjectId.isValid(investorId)) {
      investor = await InvestorModel.findById(investorId).lean();
    }
    if (!investor) {
      investor = await InvestorModel.findOne({ did: investorId }).lean();
    }
    if (!investor) {
      return res.status(404).json({ status: "error", message: "Investor not found. Please select a valid investor." });
    }

    const numTakenAmount = Number(takenAmount);
    if (takenAmount === undefined || takenAmount === null || takenAmount === "" || isNaN(numTakenAmount) || numTakenAmount < 0) {
      return res.status(400).json({ status: "error", message: "Valid takenAmount is required" });
    }

    const numReturnedAmount = returnedAmount !== undefined && returnedAmount !== null && returnedAmount !== "" ? Number(returnedAmount) : 0;
    if (isNaN(numReturnedAmount) || numReturnedAmount < 0) {
      return res.status(400).json({ status: "error", message: "Valid returnedAmount is required" });
    }

    let resolvedTakenDate = new Date();
    if (takenDate) {
      const d = new Date(takenDate);
      if (!isNaN(d.getTime())) {
        resolvedTakenDate = d;
      }
    }

    let resolvedReturnedDate = null;
    if (returnedDate) {
      const d = new Date(returnedDate);
      if (!isNaN(d.getTime())) {
        resolvedReturnedDate = d;
      }
    }

    const resolvedStatus = deriveInvestmentStatus(status, numTakenAmount, numReturnedAmount);

    const investmentData = {
      investorId: investor._id,
      takenAmount: numTakenAmount,
      returnedAmount: numReturnedAmount,
      takenDate: resolvedTakenDate,
      returnedDate: resolvedReturnedDate,
      status: resolvedStatus,
      paymentMethod: paymentMethod ? String(paymentMethod).trim() : "",
      notes: notes ? String(notes).trim() : "",
      createdBy: (req.user?.userId && Types.ObjectId.isValid(req.user.userId)) ? req.user.userId : null,
    };

    const investment = await InvestmentModel.create(investmentData);
    const populated = await InvestmentModel.findById(investment._id)
      .populate("investorId", "name email phone did status type")
      .lean();

    // A tranche recorded with an amount already paid back also books that repayment as a bill
    if (numReturnedAmount > 0) {
      await createInvestmentReturnBill({
        investor,
        investmentId: investment._id,
        amount: numReturnedAmount,
        date: investment.returnedDate || new Date(),
        paymentMethod: investment.paymentMethod,
        userId: req.user?.userId,
      });
    }

    return res.status(201).json({
      status: "success",
      message: "Investment recorded successfully",
      data: populated,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create investment");
    next(error);
  }
};

// Updates an existing investment record
export const updateInvestment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = Types.ObjectId.isValid(id) ? { _id: id } : { did: id };
    const payload = req.body ?? {};
    const allowedUpdates = {};

    if (payload.investorId !== undefined) {
      let investor = null;
      if (Types.ObjectId.isValid(payload.investorId)) {
        investor = await InvestorModel.findById(payload.investorId).lean();
      }
      if (!investor) {
        investor = await InvestorModel.findOne({ did: payload.investorId }).lean();
      }
      if (!investor) {
        return res.status(404).json({ status: "error", message: "Investor not found" });
      }
      allowedUpdates.investorId = investor._id;
    }

    if (payload.takenAmount !== undefined) {
      const numTaken = Number(payload.takenAmount);
      if (payload.takenAmount === null || payload.takenAmount === "" || isNaN(numTaken) || numTaken < 0) {
        return res.status(400).json({ status: "error", message: "Valid takenAmount is required" });
      }
      allowedUpdates.takenAmount = numTaken;
    }

    if (payload.returnedAmount !== undefined) {
      const numReturned = Number(payload.returnedAmount);
      if (payload.returnedAmount === null || payload.returnedAmount === "" || isNaN(numReturned) || numReturned < 0) {
        return res.status(400).json({ status: "error", message: "Valid returnedAmount is required" });
      }
      allowedUpdates.returnedAmount = numReturned;
    }

    if (payload.takenDate !== undefined) {
      if (payload.takenDate) {
        const d = new Date(payload.takenDate);
        allowedUpdates.takenDate = !isNaN(d.getTime()) ? d : new Date();
      } else {
        allowedUpdates.takenDate = new Date();
      }
    }

    if (payload.returnedDate !== undefined) {
      if (payload.returnedDate) {
        const d = new Date(payload.returnedDate);
        allowedUpdates.returnedDate = !isNaN(d.getTime()) ? d : null;
      } else {
        allowedUpdates.returnedDate = null;
      }
    }

    if (payload.paymentMethod !== undefined) {
      allowedUpdates.paymentMethod = payload.paymentMethod ? String(payload.paymentMethod).trim() : "";
    }

    if (payload.notes !== undefined) {
      allowedUpdates.notes = payload.notes ? String(payload.notes).trim() : "";
    }

    if (payload.status !== undefined) {
      allowedUpdates.status = String(payload.status).trim().toLowerCase();
    } else if (payload.takenAmount !== undefined || payload.returnedAmount !== undefined) {
      const existing = await InvestmentModel.findOne(query).lean();
      if (existing) {
        const taken = payload.takenAmount !== undefined ? allowedUpdates.takenAmount : existing.takenAmount;
        const returned = payload.returnedAmount !== undefined ? allowedUpdates.returnedAmount : existing.returnedAmount;
        allowedUpdates.status = deriveInvestmentStatus(null, taken, returned);
      }
    }

    allowedUpdates.updatedBy = (req.user?.userId && Types.ObjectId.isValid(req.user.userId)) ? req.user.userId : null;

    const before = allowedUpdates.returnedAmount !== undefined
      ? await InvestmentModel.findOne(query, { returnedAmount: 1 }).lean()
      : null;

    const updated = await InvestmentModel.findOneAndUpdate(query, allowedUpdates, {
      new: true,
      runValidators: true,
    })
      .populate("investorId", "name email phone did status type")
      .lean();

    if (!updated) {
      return res.status(404).json({ status: "error", message: "Investment not found" });
    }

    // Raising the returned amount from the edit form pays the difference out as a bill, like the Return modal does
    const returnedIncrease = before ? Number(updated.returnedAmount || 0) - Number(before.returnedAmount || 0) : 0;
    if (returnedIncrease > 0 && updated.investorId?._id) {
      await createInvestmentReturnBill({
        investor: updated.investorId,
        investmentId: updated._id,
        amount: returnedIncrease,
        date: updated.returnedDate || new Date(),
        paymentMethod: updated.paymentMethod,
        userId: req.user?.userId,
      });
    }

    return res.json({
      status: "success",
      message: "Investment updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error({ error }, "Failed to update investment");
    next(error);
  }
};

// Deletes an investment entry
export const deleteInvestment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = Types.ObjectId.isValid(id) ? { _id: id } : { did: id };
    const deleted = await InvestmentModel.findOneAndDelete(query).lean();

    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Investment not found" });
    }

    return res.json({
      status: "success",
      message: "Investment deleted successfully",
    });
  } catch (error) {
    logger.error({ error }, "Failed to delete investment");
    next(error);
  }
};

// Bulk updates status of multiple investments
export const bulkUpdateInvestments = async (req, res, next) => {
  try {
    const { ids, status } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "ids array is required" });
    }
    const normalizedStatus = status ? String(status).toLowerCase() : "active";
    const objectIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    const dids = ids.filter((id) => typeof id === "string");

    const result = await InvestmentModel.updateMany(
      { $or: [{ _id: { $in: objectIds } }, { did: { $in: dids } }] },
      { $set: { status: normalizedStatus, updatedBy: (req.user?.userId && Types.ObjectId.isValid(req.user.userId)) ? req.user.userId : null } }
    );

    return res.json({
      status: "success",
      message: `Updated ${result.modifiedCount} investment(s)`,
      data: result,
    });
  } catch (error) {
    logger.error({ error }, "Failed to bulk update investments");
    next(error);
  }
};

// Bulk deletes multiple investments
export const bulkDeleteInvestments = async (req, res, next) => {
  try {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "ids array is required" });
    }
    const objectIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    const dids = ids.filter((id) => typeof id === "string");

    const result = await InvestmentModel.deleteMany({
      $or: [{ _id: { $in: objectIds } }, { did: { $in: dids } }],
    });

    return res.json({
      status: "success",
      message: `Deleted ${result.deletedCount} investment(s)`,
      data: result,
    });
  } catch (error) {
    logger.error({ error }, "Failed to bulk delete investments");
    next(error);
  }
};

// Ensures the Investment Return bill type exists in the database
const ensureInvestmentReturnBillType = async (userId = null) => {
  let billType = await BillTypeModel.findOne({ name: { $regex: /^investment return$/i } });
  if (!billType) {
    billType = await BillTypeModel.create({
      name: "Investment Return",
      description: "Repayments and capital returns paid back to investors and stakeholders",
      status: "active",
      isDefault: false,
      createdBy: userId || null,
    });
  }
  return billType;
};

// Records money paid back to an investor as a paid "Investment Return" bill, so it leaves the account balance
const createInvestmentReturnBill = async ({ investor, investmentId, amount, date, paymentMethod, notes, userId }) => {
  const billType = await ensureInvestmentReturnBillType(userId);
  const billDate = date || new Date();
  return BillingModel.create({
    billTypeId: billType._id,
    investorId: investor._id,
    investmentId: investmentId || null,
    title: `Investment Return - ${investor.name}`,
    name: investor.name,
    vendor: investor.name,
    billingPhone: investor.phone || "",
    billingEmail: investor.email || "",
    baseAmount: amount,
    totalAmount: amount,
    paidAmount: amount,
    pendingAmount: 0,
    amount,
    status: "paid",
    billingDate: billDate,
    dueDate: billDate,
    billingMethod: paymentMethod ? String(paymentMethod).trim() : "Bank Transfer",
    notes: notes ? `Investment repayment: ${notes}` : `Repayment to investor ${investor.name}`,
    createdBy: (userId && Types.ObjectId.isValid(userId)) ? userId : null,
  });
};

// Records an investment repayment/return to an investor and syncs with billing
export const recordInvestmentReturn = async (req, res, next) => {
  try {
    const targetInvestmentId = req.params.id || req.body.investmentId;
    const {
      investorId,
      amount,
      returnAmount,
      returnDate,
      returnedDate,
      paymentMethod,
      notes,
      createBill = true,
    } = req.body ?? {};

    const numAmount = Number(amount ?? returnAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ status: "error", message: "A valid positive return amount is required" });
    }

    let investor = null;
    let targetInvestment = null;

    if (targetInvestmentId) {
      const invQuery = Types.ObjectId.isValid(targetInvestmentId) ? { _id: targetInvestmentId } : { did: targetInvestmentId };
      targetInvestment = await InvestmentModel.findOne(invQuery);
      if (targetInvestment) {
        investor = await InvestorModel.findById(targetInvestment.investorId);
      }
    }

    if (!investor && investorId) {
      const investorQuery = Types.ObjectId.isValid(investorId) ? { _id: investorId } : { did: investorId };
      investor = await InvestorModel.findOne(investorQuery);
    }

    if (!investor) {
      return res.status(404).json({ status: "error", message: "Investor not found. Please select a valid investor." });
    }

    const rawDate = returnDate || returnedDate;
    const resolvedDate = rawDate ? new Date(rawDate) : new Date();
    const validReturnDate = !isNaN(resolvedDate.getTime()) ? resolvedDate : new Date();
    const updatedInvestments = [];

    if (targetInvestment) {
      const prevReturned = Number(targetInvestment.returnedAmount || 0);
      const newReturned = prevReturned + numAmount;
      const taken = Number(targetInvestment.takenAmount || 0);
      targetInvestment.returnedAmount = newReturned;
      targetInvestment.status = newReturned >= taken && taken > 0 ? "returned" : "partial";
      targetInvestment.returnedDate = validReturnDate;
      if (paymentMethod) targetInvestment.paymentMethod = String(paymentMethod).trim();
      if (notes) {
        targetInvestment.notes = targetInvestment.notes
          ? `${targetInvestment.notes} | Repaid ৳${numAmount}: ${notes}`.trim()
          : `Repaid ৳${numAmount}: ${notes}`;
      }
      targetInvestment.updatedBy = (req.user?.userId && Types.ObjectId.isValid(req.user.userId)) ? req.user.userId : null;
      await targetInvestment.save();
      updatedInvestments.push(targetInvestment);
    } else {
      const activeInvestments = await InvestmentModel.find({
        investorId: investor._id,
        status: { $in: ["active", "partial", "pending"] },
      }).sort({ takenDate: 1, createdAt: 1 });

      let remainingToAllocate = numAmount;

      for (const inv of activeInvestments) {
        if (remainingToAllocate <= 0) break;
        const taken = Number(inv.takenAmount || 0);
        const currReturned = Number(inv.returnedAmount || 0);
        const due = Math.max(0, taken - currReturned);

        if (due > 0) {
          const allocation = Math.min(remainingToAllocate, due);
          inv.returnedAmount = currReturned + allocation;
          inv.status = inv.returnedAmount >= taken ? "returned" : "partial";
          inv.returnedDate = validReturnDate;
          if (notes) {
            inv.notes = inv.notes
              ? `${inv.notes} | Repaid ৳${allocation}: ${notes}`.trim()
              : `Repaid ৳${allocation}: ${notes}`;
          }
          inv.updatedBy = (req.user?.userId && Types.ObjectId.isValid(req.user.userId)) ? req.user.userId : null;
          await inv.save();
          updatedInvestments.push(inv);
          remainingToAllocate -= allocation;
        }
      }

      if (remainingToAllocate > 0) {
        const latestInvestment = await InvestmentModel.findOne({ investorId: investor._id }).sort({ takenDate: -1, createdAt: -1 });
        if (latestInvestment) {
          latestInvestment.returnedAmount = Number(latestInvestment.returnedAmount || 0) + remainingToAllocate;
          latestInvestment.returnedDate = validReturnDate;
          latestInvestment.status = latestInvestment.returnedAmount >= latestInvestment.takenAmount ? "returned" : "partial";
          latestInvestment.updatedBy = (req.user?.userId && Types.ObjectId.isValid(req.user.userId)) ? req.user.userId : null;
          await latestInvestment.save();
          if (!updatedInvestments.some((i) => i._id.toString() === latestInvestment._id.toString())) {
            updatedInvestments.push(latestInvestment);
          }
        }
      }
    }

    let createdBill = null;
    if (createBill !== false) {
      createdBill = await createInvestmentReturnBill({
        investor,
        investmentId: targetInvestment?._id || updatedInvestments[0]?._id || null,
        amount: numAmount,
        date: validReturnDate,
        paymentMethod,
        notes,
        userId: req.user?.userId,
      });
    }

    const allInvestorInvestments = await InvestmentModel.find({ investorId: investor._id }).lean();
    const totalInvested = allInvestorInvestments.reduce((acc, curr) => acc + (curr.takenAmount || 0), 0);
    const totalReturned = allInvestorInvestments.reduce((acc, curr) => acc + (curr.returnedAmount || 0), 0);
    const netInvested = Math.max(0, totalInvested - totalReturned);

    return res.status(200).json({
      status: "success",
      message: `Successfully recorded repayment of ৳${numAmount.toLocaleString()} to ${investor.name}`,
      data: {
        investor: {
          id: investor._id,
          name: investor.name,
          phone: investor.phone,
          email: investor.email,
          totalInvested,
          totalReturned,
          netInvested,
        },
        bill: createdBill,
        investments: updatedInvestments,
        summary: {
          totalInvested,
          totalReturned,
          netInvested,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to record investment return");
    next(error);
  }
};
