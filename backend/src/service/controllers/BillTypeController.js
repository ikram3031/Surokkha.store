import mongoose from "mongoose";
import { BillTypeModel } from "../../common/models/billType.model.js";
import { logger } from "../../common/config/logger.js";

const { Types } = mongoose;

// Ensures the Investment Return bill type exists in the database
export const ensureInvestmentReturnBillType = async (userId = null) => {
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

// Seed standard bill types if collection is empty
const seedDefaultBillTypes = async (userId = null) => {
  const count = await BillTypeModel.countDocuments({});
  if (count === 0) {
    const defaults = [
      { name: "Investment Return", description: "Repayments and capital returns paid back to investors", isDefault: false },
      { name: "Office Rent", description: "Monthly office or warehouse rental expense", isDefault: false },
      { name: "Utility Bills", description: "Electricity, gas, internet, water utilities", isDefault: false },
      { name: "Packaging & Materials", description: "Boxes, tape, flyers, and packing supplies", isDefault: false },
      { name: "Marketing & Advertising", description: "Facebook, Google, TikTok and campaign ads", isDefault: false },
      { name: "Salary & Wages", description: "Staff salaries, bonuses, and contractor payments", isDefault: false },
      { name: "Supplier & Vendor", description: "Wholesale goods, inventory, and supplier purchases", isDefault: false },
      { name: "General Expense", description: "General office and operational expenses", isDefault: true },
    ];
    for (const item of defaults) {
      await BillTypeModel.create({ ...item, status: "active", createdBy: userId });
    }
  }
};

// Retrieves a paginated and filterable list of bill types
export const listBillTypes = async (req, res, next) => {
  try {
    await seedDefaultBillTypes(req.user?.userId);

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const filter = {};

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status.toString().trim().toLowerCase();
    }

    if (req.query.search) {
      const search = req.query.search.toString().trim();
      if (search.length > 0) {
        const searchRegex = { $regex: search, $options: "i" };
        filter.$or = [{ name: searchRegex }, { description: searchRegex }, { did: searchRegex }];
      }
    }

    const total = await BillTypeModel.countDocuments(filter);
    
    // Fetch bill types and aggregate linked bills stats
    const billTypes = await BillTypeModel.aggregate([
      { $match: filter },
      { $sort: { isDefault: -1, createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "billings",
          localField: "_id",
          foreignField: "billTypeId",
          as: "linkedBills"
        }
      },
      {
        $addFields: {
          id: { $toString: "$_id" },
          linkedBillsCount: { $size: "$linkedBills" },
          totalIncurred: { $sum: "$linkedBills.totalAmount" }
        }
      },
      {
        $project: {
          linkedBills: 0
        }
      }
    ]);

    return res.json({
      status: "success",
      data: billTypes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to list bill types");
    next(error);
  }
};

// Retrieves a single bill type by its database ID or did
export const getBillTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = Types.ObjectId.isValid(id) ? { _id: id } : { did: id };
    const billType = await BillTypeModel.findOne(query).lean();

    if (!billType) {
      return res.status(404).json({ status: "error", message: "Bill type not found" });
    }

    return res.json({ status: "success", data: billType });
  } catch (error) {
    next(error);
  }
};

// Creates a new bill type record
export const createBillType = async (req, res, next) => {
  try {
    const { name, description, status, isDefault } = req.body ?? {};

    if (!name || name.trim() === "") {
      return res.status(400).json({ status: "error", message: "name is required" });
    }

    if (isDefault) {
      await BillTypeModel.updateMany({ isDefault: true }, { isDefault: false });
    }

    const billTypeData = {
      name: name.trim(),
      description: description?.trim() || "",
      status: status === "inactive" ? "inactive" : "active",
      isDefault: Boolean(isDefault),
      createdBy: req.user?.userId || null,
    };

    const billType = await BillTypeModel.create(billTypeData);

    return res.status(201).json({
      status: "success",
      message: "Bill type created successfully",
      data: billType,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create bill type");
    next(error);
  }
};

// Updates an existing bill type record
export const updateBillType = async (req, res, next) => {
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

    if (payload.description !== undefined) {
      allowedUpdates.description = payload.description.trim();
    }

    if (payload.status !== undefined) {
      allowedUpdates.status = payload.status === "inactive" ? "inactive" : "active";
    }

    if (payload.isDefault !== undefined) {
      allowedUpdates.isDefault = Boolean(payload.isDefault);
      if (allowedUpdates.isDefault) {
        await BillTypeModel.updateMany({ isDefault: true }, { isDefault: false });
      }
    }

    allowedUpdates.updatedBy = req.user?.userId || null;

    const updated = await BillTypeModel.findOneAndUpdate(query, allowedUpdates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ status: "error", message: "Bill type not found" });
    }

    return res.json({
      status: "success",
      message: "Bill type updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error({ error }, "Failed to update bill type");
    next(error);
  }
};

// Deletes a bill type record
export const deleteBillType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = Types.ObjectId.isValid(id) ? { _id: id } : { did: id };
    const deleted = await BillTypeModel.findOneAndDelete(query).lean();

    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Bill type not found" });
    }

    return res.json({
      status: "success",
      message: "Bill type deleted successfully",
    });
  } catch (error) {
    logger.error({ error }, "Failed to delete bill type");
    next(error);
  }
};

// Batch updates status for multiple bill types
export const bulkUpdateBillTypes = async (req, res, next) => {
  try {
    const { ids, status } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "ids array is required" });
    }

    const objectIds = ids.filter((id) => Types.ObjectId.isValid(id));
    const dids = ids.filter((id) => !Types.ObjectId.isValid(id));

    const query = {
      $or: [
        { _id: { $in: objectIds } },
        { did: { $in: dids } },
      ],
    };

    const update = {
      updatedBy: req.user?.userId || null,
    };
    if (status !== undefined) {
      update.status = status.toLowerCase() === "inactive" ? "inactive" : "active";
    }

    const result = await BillTypeModel.updateMany(query, { $set: update });

    return res.json({
      status: "success",
      message: `Successfully updated ${result.modifiedCount} bill types`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    logger.error({ error }, "Failed to bulk update bill types");
    next(error);
  }
};

// Batch deletes multiple bill types
export const bulkDeleteBillTypes = async (req, res, next) => {
  try {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "ids array is required" });
    }

    const objectIds = ids.filter((id) => Types.ObjectId.isValid(id));
    const dids = ids.filter((id) => !Types.ObjectId.isValid(id));

    const query = {
      $or: [
        { _id: { $in: objectIds } },
        { did: { $in: dids } },
      ],
    };

    const result = await BillTypeModel.deleteMany(query);

    return res.json({
      status: "success",
      message: `Successfully deleted ${result.deletedCount} bill types`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    logger.error({ error }, "Failed to bulk delete bill types");
    next(error);
  }
};
