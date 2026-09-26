import { BrandModel } from "../../common/models/brand.model.js";

// GET /api/v1/brands
export const getBrands = async (req, res) => {
  try {
    const brands = await BrandModel.find({ active: true }).sort({ name: 1 }).lean();
    res.json({ status: "success", data: brands });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to retrieve brands" });
  }
};
