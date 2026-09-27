import mongoose from "mongoose";
import { InvestorModel } from "../../common/models/investor.model.js";
import { InvestmentModel } from "../../common/models/investment.model.js";
import { UserModel } from "../../common/models/user.model.js";
import { MemberModel } from "../../common/models/member.model.js";
import { logger } from "../../common/config/logger.js";

const { Types } = mongoose;

// Retrieves a paginated list of investors with their financial investment summary
export const listInvestors = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const filter = {};

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status.toString().trim().toLowerCase();
    }

    if (req.query.type && req.query.type !== "all") {
      filter.type = req.query.type.toString().trim().toLowerCase();
    }

    if (req.query.search) {
      const search = req.query.search.toString().trim();
      if (search.length > 0) {
        const searchRegex = { $regex: search, $options: "i" };
        filter.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { notes: searchRegex },
          { did: searchRegex },
        ];
      }
    }

    const total = await InvestorModel.countDocuments(filter);
    const investors = await InvestorModel.find(filter)
      .populate("userId", "name email phone did role username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const investorIds = investors.map((inv) => inv._id);
    const investmentsSummary = await InvestmentModel.aggregate([
      { $match: { investorId: { $in: investorIds } } },
      {
        $group: {
          _id: "$investorId",
          totalInvested: { $sum: "$takenAmount" },
          totalReturned: { $sum: "$returnedAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryMap = new Map();
    investmentsSummary.forEach((item) => {
      summaryMap.set(item._id.toString(), {
        totalInvested: item.totalInvested || 0,
        totalReturned: item.totalReturned || 0,
        netInvested: (item.totalInvested || 0) - (item.totalReturned || 0),
        investmentsCount: item.count || 0,
      });
    });

    const enrichedInvestors = investors.map((inv) => {
      const summary = summaryMap.get(inv._id.toString()) || {
        totalInvested: 0,
        totalReturned: 0,
        netInvested: 0,
        investmentsCount: 0,
      };
      return {
        ...inv,
        ...summary,
        summary,
      };
    });

    return res.json({
      status: "success",
      data: enrichedInvestors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to list investors");
    next(error);
  }
};

// Retrieves a single investor by ID along with their investment history and totals
export const getInvestorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = Types.ObjectId.isValid(id) ? { _id: id } : { did: id };
    const investor = await InvestorModel.findOne(query)
      .populate("userId", "name email phone did role username")
      .lean();

    if (!investor) {
      return res.status(404).json({ status: "error", message: "Investor not found" });
    }

    const investments = await InvestmentModel.find({ investorId: investor._id })
      .sort({ takenDate: -1, createdAt: -1 })
      .lean();

    const totalInvested = investments.reduce((acc, curr) => acc + (curr.takenAmount || 0), 0);
    const totalReturned = investments.reduce((acc, curr) => acc + (curr.returnedAmount || 0), 0);
    const netInvested = totalInvested - totalReturned;

    const summary = {
      totalInvested,
      totalReturned,
      netInvested,
      investmentsCount: investments.length,
    };

    return res.json({
      status: "success",
      data: {
        ...investor,
        investments,
        summary,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to get investor details");
    next(error);
  }
};

// Creates a new investor record or links an existing user
export const createInvestor = async (req, res, next) => {
  try {
    const { name, email, phone, type, userId, notes, status } = req.body ?? {};

    let resolvedName = name?.trim() || "";
    let resolvedEmail = email?.trim().toLowerCase() || "";
    let resolvedPhone = phone?.trim() || "";
    let resolvedUserId = null;

    if (type === "existing_user" && userId) {
      if (!Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ status: "error", message: "Invalid userId" });
      }
      let user = await UserModel.findById(userId).lean();
      if (!user) {
        user = await MemberModel.findById(userId).lean();
      }
      if (user) {
        resolvedUserId = user._id;
        if (!resolvedName) resolvedName = user.name || user.username || "";
        if (!resolvedEmail) resolvedEmail = user.email || "";
        if (!resolvedPhone) resolvedPhone = user.phone || "";
      }
    }

    if (!resolvedName) {
      return res.status(400).json({ status: "error", message: "name is required" });
    }

    const investorData = {
      name: resolvedName,
      email: resolvedEmail,
      phone: resolvedPhone,
      type: type === "existing_user" ? "existing_user" : "manual",
      userId: resolvedUserId,
      notes: notes?.trim() || "",
      status: status === "inactive" ? "inactive" : "active",
      createdBy: req.user?.userId || null,
    };

    const investor = await InvestorModel.create(investorData);

    return res.status(201).json({
      status: "success",
      message: "Investor created successfully",
      data: investor,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create investor");
    next(error);
  }
};

// Updates an existing investor profile
export const updateInvestor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = Types.ObjectId.isValid(id) ? { _id: id } : { did: id };
    const payload = req.body ?? {};
    const allowedUpdates = {};

    if (payload.name !== undefined) {
      if (!payload.name || payload.name.trim() === "") {
        return res.status(400).json({ status: "error", message: "name cannot be empty" });
      }
      allowedUpdates.name = payload.name.trim();
    }

    if (payload.email !== undefined) {
      allowedUpdates.email = payload.email.trim().toLowerCase();
    }

    if (payload.phone !== undefined) {
      allowedUpdates.phone = payload.phone.trim();
    }

    if (payload.type !== undefined) {
      allowedUpdates.type = payload.type === "existing_user" ? "existing_user" : "manual";
    }

    if (payload.userId !== undefined) {
      if (payload.userId && !Types.ObjectId.isValid(payload.userId)) {
        return res.status(400).json({ status: "error", message: "Invalid userId" });
      }
      allowedUpdates.userId = payload.userId || null;
    }

    if (payload.notes !== undefined) {
      allowedUpdates.notes = payload.notes.trim();
    }

    if (payload.status !== undefined) {
      allowedUpdates.status = payload.status === "inactive" ? "inactive" : "active";
    }

    allowedUpdates.updatedBy = req.user?.userId || null;

    const updated = await InvestorModel.findOneAndUpdate(query, allowedUpdates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ status: "error", message: "Investor not found" });
    }

    return res.json({
      status: "success",
      message: "Investor updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error({ error }, "Failed to update investor");
    next(error);
  }
};

// Deletes an investor and cleans up related investments
export const deleteInvestor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = Types.ObjectId.isValid(id) ? { _id: id } : { did: id };
    const investor = await InvestorModel.findOne(query).lean();

    if (!investor) {
      return res.status(404).json({ status: "error", message: "Investor not found" });
    }

    await InvestmentModel.deleteMany({ investorId: investor._id });
    await InvestorModel.findByIdAndDelete(investor._id);

    return res.json({
      status: "success",
      message: "Investor and associated investments deleted successfully",
    });
  } catch (error) {
    logger.error({ error }, "Failed to delete investor");
    next(error);
  }
};
