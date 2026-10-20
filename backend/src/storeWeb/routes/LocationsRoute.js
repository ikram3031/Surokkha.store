import { Router } from "express";
import { ThanaModel } from "../../common/models/district.model.js";

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
      "name bnName -_id"
    )
      .sort({ name: 1 })
      .lean();

    res.set("Cache-Control", "public, max-age=3600");
    return res.json({ status: "success", count: thanas.length, data: thanas });
  } catch (error) {
    next(error);
  }
});

export default locationsRouter;
