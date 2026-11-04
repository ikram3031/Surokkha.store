import { Router } from "express";
import { ThanaModel } from "../../common/models/district.model.js";
import { getDeliveryTier } from "../../common/helper/deliveryCharge.helper.js";

const locationsRouter = Router();

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/v1/locations/districts/:district/thanas : Public thana/upazila list for checkout dropdowns
locationsRouter.get("/districts/:district/thanas", async (req, res, next) => {
  try {
    const district = String(req.params.district || "").trim();
    if (!district) {
      return res.status(400).json({ status: "error", message: "District is required" });
    }

    const thanas = await ThanaModel.find(
      { districtName: new RegExp(`^${escapeRegex(district)}$`, "i"), isActive: true },
      "name bnName districtName deliveryZone deliveryCharge -_id"
    )
      .sort({ name: 1 })
      .lean();

    // Docs synced before delivery charges were stored get the charge computed on the fly
    const data = thanas.map(({ districtName, ...t }) => ({
      ...t,
      ...(t.deliveryCharge == null ? getDeliveryTier(districtName, t.name) : {}),
    }));

    res.set("Cache-Control", "public, max-age=3600");
    return res.json({ status: "success", count: data.length, data });
  } catch (error) {
    next(error);
  }
});

export default locationsRouter;
