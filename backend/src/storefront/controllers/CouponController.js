import { CouponModel } from "../../common/models/coupon.model.js";

// GET /api/v1/coupons
export const getAllCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await CouponModel.find({
      active: true,
      $or: [{ validTo: null }, { validTo: { $gte: now } }],
    }).lean();
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
    const coupon = await CouponModel.findOne(filter).lean();
    if (!coupon) {
      return res.status(404).json({ status: "error", message: "Coupon not found" });
    }
    res.json({ status: "success", data: coupon });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to retrieve coupon" });
  }
};
