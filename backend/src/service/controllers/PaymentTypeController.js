import mongoose from "mongoose";
import { PaymentTypeModel } from "../../common/models/paymentType.model.js";
import { logger } from "../../common/config/logger.js";

const { Types } = mongoose;

// Retrieves a paginated and filterable list of payment types / methods
export const listPaymentTypes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const filter = {};

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status.toString().trim().toLowerCase();
    }

    if (req.query.category && req.query.category !== "all") {
      filter.category = req.query.category.toString().trim().toLowerCase();
    }

    if (req.query.search) {
      const search = req.query.search.toString().trim();
      if (search.length > 0) {
        const searchRegex = { $regex: search, $options: "i" };
        filter.$or = [
          { name: searchRegex },
          { provider: searchRegex },
          { accountNumber: searchRegex },
          { accountName: searchRegex },
          { branchName: searchRegex },
          { description: searchRegex },
          { did: searchRegex },
        ];
      }
    }

    const total = await PaymentTypeModel.countDocuments(filter);
    const paymentTypes = await PaymentTypeModel.find(filter)
      .sort({ isDefault: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      status: "success",
      data: paymentTypes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to list payment types");
    next(error);
  }
};

// Retrieves a single payment type by its database ID or did
export const getPaymentTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = Types.ObjectId.isValid(id) ? { _id: id } : { did: id };
    const paymentType = await PaymentTypeModel.findOne(query).lean();

    if (!paymentType) {
      return res.status(404).json({ status: "error", message: "Payment method not found" });
    }

    return res.json({ status: "success", data: paymentType });
  } catch (error) {
    next(error);
  }
};

// Creates a new payment type / method record with details
// Keeps only fee rows with a name, coercing percent/fixed to non-negative numbers
const normalizeFees = (fees) =>
  (Array.isArray(fees) ? fees : [])
    .map((fee) => ({
      name: String(fee?.name || "").trim(),
      percent: Math.max(0, Number(fee?.percent) || 0),
      fixed: Math.max(0, Number(fee?.fixed) || 0),
    }))
    .filter((fee) => fee.name);

export const createPaymentType = async (req, res, next) => {
  try {
    const {
      name,
      category,
      provider,
      accountNumber,
      accountName,
      accountType,
      branchName,
      routingNumber,
      chargePercent,
      chargeFixed,
      fees,
      instructions,
      icon,
      qrCode,
      description,
      status,
      isDefault,
    } = req.body ?? {};

    if (!name || name.trim() === "") {
      return res.status(400).json({ status: "error", message: "name is required" });
    }

    if (isDefault) {
      await PaymentTypeModel.updateMany({ isDefault: true }, { isDefault: false });
    }

    const paymentTypeData = {
      name: name.trim(),
      category: category ? String(category).toLowerCase() : "mfs",
      provider: provider?.trim() || "",
      accountNumber: accountNumber?.trim() || "",
      accountName: accountName?.trim() || "",
      accountType: accountType?.trim() || "Personal",
      branchName: branchName?.trim() || "",
      routingNumber: routingNumber?.trim() || "",
      chargePercent: Number(chargePercent) || 0,
      chargeFixed: Number(chargeFixed) || 0,
      fees: normalizeFees(fees),
      instructions: instructions?.trim() || "",
      icon: icon?.trim() || "",
      qrCode: qrCode?.trim() || "",
      description: description?.trim() || "",
      status: status === "inactive" ? "inactive" : "active",
      isDefault: Boolean(isDefault),
      createdBy: req.user?.userId || null,
    };

    const paymentType = await PaymentTypeModel.create(paymentTypeData);

    return res.status(201).json({
      status: "success",
      message: "Payment method created successfully",
      data: paymentType,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create payment method");
    next(error);
  }
};

// Updates an existing payment type / method record
export const updatePaymentType = async (req, res, next) => {
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

    if (payload.category !== undefined) {
      allowedUpdates.category = String(payload.category).toLowerCase();
    }

    if (payload.provider !== undefined) {
      allowedUpdates.provider = payload.provider.trim();
    }

    if (payload.accountNumber !== undefined) {
      allowedUpdates.accountNumber = payload.accountNumber.trim();
    }

    if (payload.accountName !== undefined) {
      allowedUpdates.accountName = payload.accountName.trim();
    }

    if (payload.accountType !== undefined) {
      allowedUpdates.accountType = payload.accountType.trim();
    }

    if (payload.branchName !== undefined) {
      allowedUpdates.branchName = payload.branchName.trim();
    }

    if (payload.routingNumber !== undefined) {
      allowedUpdates.routingNumber = payload.routingNumber.trim();
    }

    if (payload.chargePercent !== undefined) {
      allowedUpdates.chargePercent = Number(payload.chargePercent) || 0;
    }

    if (payload.fees !== undefined) {
      allowedUpdates.fees = normalizeFees(payload.fees);
    }

    if (payload.chargeFixed !== undefined) {
      allowedUpdates.chargeFixed = Number(payload.chargeFixed) || 0;
    }

    if (payload.instructions !== undefined) {
      allowedUpdates.instructions = payload.instructions.trim();
    }

    if (payload.icon !== undefined) {
      allowedUpdates.icon = payload.icon.trim();
    }

    if (payload.qrCode !== undefined) {
      allowedUpdates.qrCode = payload.qrCode.trim();
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
        await PaymentTypeModel.updateMany({ isDefault: true }, { isDefault: false });
      }
    }

    allowedUpdates.updatedBy = req.user?.userId || null;

    const updated = await PaymentTypeModel.findOneAndUpdate(query, allowedUpdates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ status: "error", message: "Payment method not found" });
    }

    return res.json({
      status: "success",
      message: "Payment method updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error({ error }, "Failed to update payment method");
    next(error);
  }
};

// Deletes a payment type / method record
export const deletePaymentType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = Types.ObjectId.isValid(id) ? { _id: id } : { did: id };
    const deleted = await PaymentTypeModel.findOneAndDelete(query).lean();

    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Payment method not found" });
    }

    return res.json({
      status: "success",
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    logger.error({ error }, "Failed to delete payment method");
    next(error);
  }
};

// Batch updates status for multiple payment methods
export const bulkUpdatePaymentTypes = async (req, res, next) => {
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

    const result = await PaymentTypeModel.updateMany(query, { $set: update });

    return res.json({
      status: "success",
      message: `Successfully updated ${result.modifiedCount} payment methods`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    logger.error({ error }, "Failed to bulk update payment methods");
    next(error);
  }
};

// Batch deletes multiple payment methods
export const bulkDeletePaymentTypes = async (req, res, next) => {
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

    const result = await PaymentTypeModel.deleteMany(query);

    return res.json({
      status: "success",
      message: `Successfully deleted ${result.deletedCount} payment methods`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    logger.error({ error }, "Failed to bulk delete payment methods");
    next(error);
  }
};
