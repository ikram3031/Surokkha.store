import { CouponModel } from "../../common/models/coupon.model.js";
import { logger } from "../../common/config/logger.js";
import { validateCouponPayload } from "../../common/utils/couponValidation.js";

const normalizeCouponPayload = (coupon) => {
  if (!coupon || typeof coupon !== "object") return coupon;

  const normalized = { ...coupon };
  if (normalized._id) {
    normalized.id = normalized._id.toString();
    delete normalized._id;
  }

  return normalized;
};

const normalizeCouponList = (coupons) =>
  Array.isArray(coupons) ? coupons.map(normalizeCouponPayload) : normalizeCouponPayload(coupons);

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await CouponModel.find()
      .populate("applicableProducts", "name did slug")
      .populate("applicableCategories", "name did slug")
      .populate("applicableBrands", "name did slug")
      .lean();
    res.json({ status: "success", data: normalizeCouponList(coupons) });
  } catch (err) {
    logger.error({ err }, "Failed to fetch coupons");
    res.status(500).json({ status: "error", message: "Unable to fetch coupons" });
  }
};

export const getCouponById = async (req, res) => {
  const { id } = req.params;

  try {
    const coupon = await CouponModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { did: id }, { code: id.toUpperCase() }],
    })
    .populate("applicableProducts", "name did slug")
    .populate("applicableCategories", "name did slug")
    .populate("applicableBrands", "name did slug")
    .lean();

    if (!coupon) {
      return res.status(404).json({ status: "error", message: "Coupon not found" });
    }

    res.json({ status: "success", data: normalizeCouponPayload(coupon) });
  } catch (err) {
    logger.error({ err }, "Failed to fetch coupon by id");
    res.status(500).json({ status: "error", message: "Unable to fetch coupon" });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const validation = validateCouponPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ status: "error", message: "Invalid coupon payload", errors: validation.errors });
    }

    const existingCoupon = await CouponModel.findOne({ code: validation.normalized.code });
    if (existingCoupon) {
      return res.status(400).json({ status: "error", message: "Coupon code already exists" });
    }

    const coupon = await CouponModel.create({
      ...validation.normalized,
      validFrom: validation.normalized.validFrom ? new Date(validation.normalized.validFrom) : null,
      validTo: validation.normalized.validTo ? new Date(validation.normalized.validTo) : null,
      createdBy: req.body.createdBy || req.user?._id || req.user?.id || null,
      updatedBy: req.body.updatedBy || req.body.createdBy || req.user?._id || req.user?.id || null,
    });

    const populatedCoupon = await CouponModel.findById(coupon._id)
      .populate("applicableProducts", "name did slug")
      .populate("applicableCategories", "name did slug")
      .populate("applicableBrands", "name did slug")
      .lean();

    res.status(201).json({ status: "success", data: normalizeCouponPayload(populatedCoupon) });
  } catch (err) {
    logger.error({ err }, "Failed to create coupon");
    res.status(500).json({ status: "error", message: "Unable to create coupon" });
  }
};

export const updateCoupon = async (req, res) => {
  const { id } = req.params;

  try {
    const coupon = await CouponModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { did: id }, { code: id.toUpperCase() }],
    });

    if (!coupon) {
      return res.status(404).json({ status: "error", message: "Coupon not found" });
    }

    const validation = validateCouponPayload({ ...coupon.toObject(), ...req.body });
    if (!validation.isValid) {
      return res.status(400).json({ status: "error", message: "Invalid coupon payload", errors: validation.errors });
    }

    Object.assign(coupon, {
      ...validation.normalized,
      validFrom: validation.normalized.validFrom ? new Date(validation.normalized.validFrom) : null,
      validTo: validation.normalized.validTo ? new Date(validation.normalized.validTo) : null,
      updatedBy: req.body.updatedBy || req.user?._id || req.user?.id || null,
    });

    await coupon.save();

    const populatedCoupon = await CouponModel.findById(coupon._id)
      .populate("applicableProducts", "name did slug")
      .populate("applicableCategories", "name did slug")
      .populate("applicableBrands", "name did slug")
      .lean();

    res.json({ status: "success", data: normalizeCouponPayload(populatedCoupon) });
  } catch (err) {
    logger.error({ err }, "Failed to update coupon");
    res.status(500).json({ status: "error", message: "Unable to update coupon" });
  }
};

export const deleteCoupon = async (req, res) => {
  const { id } = req.params;

  try {
    const coupon = await CouponModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { did: id }, { code: id.toUpperCase() }],
    });

    if (!coupon) {
      return res.status(404).json({ status: "error", message: "Coupon not found" });
    }

    await CouponModel.deleteOne({ _id: coupon._id });
    res.json({ status: "success", message: "Coupon deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete coupon");
    res.status(500).json({ status: "error", message: "Unable to delete coupon" });
  }
};
