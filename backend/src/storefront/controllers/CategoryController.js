import { CategoryModel } from "../../common/models/category.model.js";

// GET /api/v1/categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
    res.json({ status: "success", data: categories });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to retrieve categories" });
  }
};

// GET /api/v1/categories/:id
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId ? { $or: [{ _id: id }, { slug: id }, { did: id }] } : { $or: [{ slug: id }, { did: id }] };
    const category = await CategoryModel.findOne(filter).lean();
    if (!category) {
      return res.status(404).json({ status: "error", message: "Category not found" });
    }
    res.json({ status: "success", data: category });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to retrieve category" });
  }
};
