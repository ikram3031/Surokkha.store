// src/controllers/BrandController.js
import { BrandModel } from "../../common/models/brand.model.js";
import { logger } from "../../common/config/logger.js";

/**
 * GET /api/v1/brands
 * Returns a paginated list of brands.
 * Query parameters:
 *   - skip (default 0): number of documents to skip
 *   - limit (default 10): maximum number of documents to return
 */
// GET /brands - ব্র্যান্ডের তালিকা দেখায়
export const getBrands = async (req, res) => {
  const skip = parseInt(req.query.skip, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 1000; // default large limit to get all brands
  try {
    const brands = await BrandModel.find()
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await BrandModel.countDocuments();
    res.json({ status: "success", data: brands, pagination: { skip, limit, total } });
  } catch (err) {
    logger.error({ err }, "Failed to fetch brands");
    res.status(500).json({ status: "error", message: "Unable to fetch brands" });
  }
}

/**
 * POST /api/v1/brands
 * Create a new brand.
 */
// POST /brands - নতুন ব্র্যান্ড তৈরি করে
export const createBrand = async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ status: "error", message: "Name and slug are required" });
    }

    const exists = await BrandModel.findOne({ $or: [{ name }, { slug }] });
    if (exists) {
      return res.status(400).json({ status: "error", message: "Brand name or slug already exists" });
    }

    const brand = new BrandModel({
      name,
      slug,
      description,
      createdBy: req.body.createdBy || req.user?._id || req.user?.id || null,
    });

    await brand.save();
    res.status(201).json({ status: "success", data: brand });
  } catch (err) {
    logger.error({ err }, "Failed to create brand");
    res.status(500).json({ status: "error", message: "Unable to create brand" });
  }
}

/**
 * PUT /api/v1/brands/:id
 * Update an existing brand by ID or slug/did.
 */
// PUT /brands/:id - ব্র্যান্ড আপডেট করে
export const updateBrand = async (req, res) => {
  const { id } = req.params;
  try {
    const { name, slug, description } = req.body;
    
    const brand = await BrandModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }, { did: id }] });
    if (!brand) {
      return res.status(404).json({ status: "error", message: "Brand not found" });
    }

    if (name) brand.name = name;
    if (slug) brand.slug = slug;
    if (description !== undefined) brand.description = description;

    brand.updatedBy = req.body.updatedBy || req.user?._id || req.user?.id || null;
    await brand.save();

    res.json({ status: "success", data: brand });
  } catch (err) {
    logger.error({ err }, "Failed to update brand");
    res.status(500).json({ status: "error", message: "Unable to update brand" });
  }
}

/**
 * DELETE /api/v1/brands/:id
 * Delete a brand by ID or slug/did.
 */
// DELETE /brands/:id - ব্র্যান্ড ডিলিট করে
export const deleteBrand = async (req, res) => {
  const { id } = req.params;
  try {
    const brand = await BrandModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }, { did: id }] });
    if (!brand) {
      return res.status(404).json({ status: "error", message: "Brand not found" });
    }

    await BrandModel.deleteOne({ _id: brand._id });
    res.json({ status: "success", message: "Brand deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete brand");
    res.status(500).json({ status: "error", message: "Unable to delete brand" });
  }
}
