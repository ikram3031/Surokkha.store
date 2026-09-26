import { CategoryModel } from "../../common/models/category.model.js";
import { ProductModel } from "../../common/models/product.model.js";
import { logger } from "../../common/config/logger.js";
import { PLACEHOLDER_IMAGE_URL } from "../../common/utils/productUtils.js";

// Fetches and returns an array of all categories with live product counts
export const getAllCategories = async (req, res) => {
  try {
    const [categories, counts] = await Promise.all([
      CategoryModel.find()
        .populate({ path: "parent", select: "name slug did imageUrl" })
        .lean(),
      ProductModel.aggregate([
        { $match: { imageUrl: { $ne: PLACEHOLDER_IMAGE_URL } } },
        { $unwind: "$categories" },
        { $group: { _id: "$categories", count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = {};
    for (const c of counts) {
      countMap[c._id.toString()] = c.count;
    }

    const data = categories.map((cat) => ({
      ...cat,
      product_count: countMap[cat._id?.toString()] || 0,
    }));

    res.json({ status: "success", data });
  } catch (err) {
    logger.error({ err }, "Failed to fetch categories");
    res.status(500).json({ status: "error", message: "Unable to fetch categories" });
  }
};

// Fetches and returns a single category by its MongoDB ObjectId, DID, or slug
export const getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { slug: id }, { did: id }] }
      : { $or: [{ slug: id }, { did: id }] };

    const category = await CategoryModel.findOne(query)
      .populate({ path: "parent", select: "name slug did imageUrl" })
      .lean();

    if (!category) {
      return res.status(404).json({ status: "error", message: "Category not found" });
    }

    res.json({ status: "success", data: category });
  } catch (err) {
    logger.error({ err }, "Failed to fetch category by id");
    res.status(500).json({ status: "error", message: "Unable to fetch category" });
  }
};

// Creates a new product category
export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, parent } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ status: "error", message: "Name and slug are required" });
    }

    const exists = await CategoryModel.findOne({ $or: [{ name }, { slug }] });
    if (exists) {
      return res.status(400).json({ status: "error", message: "Category name or slug already exists" });
    }

    let parentId = null;
    if (parent) {
      const isParentObjectId = typeof parent === "string" && /^[0-9a-fA-F]{24}$/.test(parent);
      const parentQuery = isParentObjectId
        ? { $or: [{ _id: parent }, { slug: parent }, { did: parent }] }
        : { $or: [{ slug: parent }, { did: parent }] };
      const parentCat = await CategoryModel.findOne(parentQuery);
      if (parentCat) parentId = parentCat._id;
    }

    const category = new CategoryModel({
      name,
      slug,
      description,
      parent: parentId,
      createdBy: req.body.createdBy || req.user?._id || req.user?.id || null,
    });

    await category.save();
    res.status(201).json({ status: "success", data: category });
  } catch (err) {
    logger.error({ err }, "Failed to create category");
    res.status(500).json({ status: "error", message: "Unable to create category" });
  }
};

// Updates an existing category by ID, DID, or slug
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const { name, slug, description, parent } = req.body;
    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { slug: id }, { did: id }] }
      : { $or: [{ slug: id }, { did: id }] };

    const category = await CategoryModel.findOne(query);
    if (!category) {
      return res.status(404).json({ status: "error", message: "Category not found" });
    }

    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description !== undefined) category.description = description;

    if (parent !== undefined) {
      let parentId = null;
      if (parent) {
        const isParentObjectId = typeof parent === "string" && /^[0-9a-fA-F]{24}$/.test(parent);
        const parentQuery = isParentObjectId
          ? { $or: [{ _id: parent }, { slug: parent }, { did: parent }] }
          : { $or: [{ slug: parent }, { did: parent }] };
        const parentCat = await CategoryModel.findOne(parentQuery);
        if (parentCat) parentId = parentCat._id;
      }
      category.parent = parentId;
    }

    category.updatedBy = req.body.updatedBy || req.user?._id || req.user?.id || null;
    await category.save();

    res.json({ status: "success", data: category });
  } catch (err) {
    logger.error({ err }, "Failed to update category");
    res.status(500).json({ status: "error", message: "Unable to update category" });
  }
};

// Deletes a category by ID, DID, or slug
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { slug: id }, { did: id }] }
      : { $or: [{ slug: id }, { did: id }] };

    const category = await CategoryModel.findOne(query);
    if (!category) {
      return res.status(404).json({ status: "error", message: "Category not found" });
    }

    await CategoryModel.deleteOne({ _id: category._id });
    res.json({ status: "success", message: "Category deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete category");
    res.status(500).json({ status: "error", message: "Unable to delete category" });
  }
};
