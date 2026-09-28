import mongoose from "mongoose";
import { PaymentTypeModel } from "../../common/models/paymentType.model.js";
import { logger } from "../../common/config/logger.js";

const { Types } = mongoose;

// Retrieves a paginated and filterable list of payment types
export const listPaymentTypes = async (req, res, next) => {
  try {
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
      return res.status(404).json({ status: "error", message: "Payment type not found" });
    }

    return res.json({ status: "success", data: paymentType });
  } catch (error) {
    next(error);
  }
};

// Creates a new payment type record
export const createPaymentType = async (req, res, next) => {
  try {
    const { name, description, status, isDefault } = req.body ?? {};

    if (!name || name.trim() === "") {
      return res.status(400).json({ status: "error", message: "name is required" });
    }

    if (isDefault) {
      await PaymentTypeModel.updateMany({ isDefault: true }, { isDefault: false });
    }

    const paymentTypeData = {
      name: name.trim(),
      description: description?.trim() || "",
      status: status === "inactive" ? "inactive" : "active",
      isDefault: Boolean(isDefault),
      createdBy: req.user?.userId || null,
    };

    const paymentType = await PaymentTypeModel.create(paymentTypeData);

    return res.status(201).json({
      status: "success",
      message: "Payment type created successfully",
      data: paymentType,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create payment type");
    next(error);
  }
};

// Updates an existing payment type record
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
      return res.status(404).json({ status: "error", message: "Payment type not found" });
    }

    return res.json({
      status: "success",
      message: "Payment type updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error({ error }, "Failed to update payment type");
    next(error);
  }
};

// Deletes a payment type record
export const deletePaymentType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = Types.ObjectId.isValid(id) ? { _id: id } : { did: id };
    const deleted = await PaymentTypeModel.findOneAndDelete(query).lean();

    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Payment type not found" });
    }

    return res.json({
      status: "success",
      message: "Payment type deleted successfully",
    });
  } catch (error) {
    logger.error({ error }, "Failed to delete payment type");
    next(error);
  }
};
