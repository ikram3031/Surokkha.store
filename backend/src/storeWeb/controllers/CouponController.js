import { CouponModel } from "../../common/models/coupon.model.js";

const DEFAULT_FREEOCT = {
  code: "FREEOCT",
  did: "cpn_freeoct_2026",
  discountType: "free_shipping",
  discountValue: 0,
  minOrderAmount: 1000,
  active: true,
  validFrom: null,
  validTo: null,
};

// GET /api/v1/coupons
export const getAllCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await CouponModel.find({
      active: true,
      $or: [{ validTo: null }, { validTo: { $gte: now } }],
    }).lean();

    const hasFreeOct = coupons.some((c) => String(c.code).toUpperCase() === "FREEOCT");
    if (!hasFreeOct) {
      coupons.unshift({ ...DEFAULT_FREEOCT });
    }

    res.json({ status: "success", data: coupons });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to retrieve coupons" });
  }
};

// GET /api/v1/coupons/:id
export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId ? { $or: [{ _id: id }, { code: id.toUpperCase() }, { did: id }] } : { $or: [{ code: id.toUpperCase() }, { did: id }] };
    let coupon = await CouponModel.findOne(filter).lean();

    if (!coupon && typeof id === "string" && id.toUpperCase() === "FREEOCT") {
      coupon = { ...DEFAULT_FREEOCT };
    }

    if (!coupon) {
      return res.status(404).json({ status: "error", message: "Coupon not found" });
    }
    res.json({ status: "success", data: coupon });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to retrieve coupon" });
  }
};
