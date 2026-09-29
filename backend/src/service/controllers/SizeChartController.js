import { SizeChartModel } from "../../common/models/sizeChart.model.js";
import { CategoryModel } from "../../common/models/category.model.js";
import { logger } from "../../common/config/logger.js";

// Fetches and returns all configured category size charts
export const getAllSizeCharts = async (req, res) => {
  try {
    const sizeCharts = await SizeChartModel.find()
      .populate({
        path: "category",
        select: "name slug did imageUrl parent",
      })
      .populate({
        path: "attributeId",
        select: "name slug values",
      })
      .lean();

    res.json({ status: "success", data: sizeCharts });
  } catch (err) {
    logger.error({ err }, "Failed to fetch size charts");
    res.status(500).json({ status: "error", message: "Unable to fetch size charts" });
  }
};

// Fetches and returns a specific size chart by parent category DID, ID, or slug
export const getSizeChartByCategory = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const isObjectId = typeof categoryId === "string" && /^[0-9a-fA-F]{24}$/.test(categoryId);
    const categoryQuery = isObjectId
      ? { $or: [{ _id: categoryId }, { slug: categoryId }, { did: categoryId }] }
      : { $or: [{ slug: categoryId }, { did: categoryId }] };

    const category = await CategoryModel.findOne(categoryQuery).lean();

    const chartFilter = category
      ? {
          $or: [
            { category: category._id },
            ...(category.did ? [{ categoryDid: category.did }] : []),
            ...(category.slug ? [{ categorySlug: category.slug }] : []),
          ],
        }
      : {
          $or: [
            ...(isObjectId ? [{ category: categoryId }] : []),
            { categoryDid: categoryId },
            { categorySlug: categoryId },
          ],
        };

    let sizeChart = await SizeChartModel.findOne(chartFilter)
      .populate({
        path: "category",
        select: "name slug did imageUrl parent",
      })
      .populate({
        path: "attributeId",
        select: "name slug values",
      })
      .lean();

    if (!sizeChart && category?.parent) {
      let currentParentId = category.parent;
      while (currentParentId && !sizeChart) {
        const parentCat = await CategoryModel.findById(currentParentId).lean();
        if (!parentCat) break;
        sizeChart = await SizeChartModel.findOne({
          $or: [
            { category: parentCat._id },
            ...(parentCat.did ? [{ categoryDid: parentCat.did }] : []),
            ...(parentCat.slug ? [{ categorySlug: parentCat.slug }] : []),
          ],
        })
          .populate({
            path: "category",
            select: "name slug did imageUrl parent",
          })
          .populate({
            path: "attributeId",
            select: "name slug values",
          })
          .lean();
        currentParentId = parentCat.parent;
      }
    }

    if (!sizeChart) {
      return res.status(404).json({ status: "error", message: "Size chart not configured for this category" });
    }

    res.json({ status: "success", data: sizeChart });
  } catch (err) {
    logger.error({ err }, "Failed to fetch size chart by category");
    res.status(500).json({ status: "error", message: "Unable to fetch size chart" });
  }
};

// Creates or updates a parent category size chart specification by category DID, ID, or slug
export const upsertSizeChart = async (req, res) => {
  try {
    const {
      categoryId,
      category: rawCategory,
      attributeId,
      attributeName = "Size",
      columns = [],
      rows = [],
      unit = "inches",
    } = req.body;

    const rawTarget = categoryId || rawCategory;
    const targetCatIdentifier =
      typeof rawTarget === "object" && rawTarget !== null
        ? rawTarget.did || rawTarget._id || rawTarget.id || rawTarget.slug
        : rawTarget;

    if (!targetCatIdentifier || typeof targetCatIdentifier !== "string") {
      return res.status(400).json({ status: "error", message: "Category identifier is required" });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetCatIdentifier);
    const categoryQuery = isObjectId
      ? { $or: [{ _id: targetCatIdentifier }, { slug: targetCatIdentifier }, { did: targetCatIdentifier }] }
      : { $or: [{ slug: targetCatIdentifier }, { did: targetCatIdentifier }] };

    const category = await CategoryModel.findOne(categoryQuery);

    if (!category) {
      return res.status(404).json({ status: "error", message: "Target category not found" });
    }

    const cleanedColumns = Array.isArray(columns)
      ? columns.map((col) => (typeof col === "string" ? col.trim() : col?.name || col?.label || "")).filter(Boolean)
      : [];

    const cleanedRows = Array.isArray(rows)
      ? rows.map((row) => ({
          size: typeof row.size === "string" ? row.size.trim() : String(row.size || ""),
          values: row.values && typeof row.values === "object" ? row.values : {},
        }))
      : [];

    const userId = req.user?._id || req.user?.id || null;

    const updatedChart = await SizeChartModel.findOneAndUpdate(
      {
        $or: [
          { category: category._id },
          ...(category.did ? [{ categoryDid: category.did }] : []),
          ...(category.slug ? [{ categorySlug: category.slug }] : []),
        ],
      },
      {
        $set: {
          category: category._id,
          categorySlug: category.slug,
          categoryDid: category.did || null,
          attributeId: attributeId || null,
          attributeName: attributeName || "Size",
          columns: cleanedColumns,
          rows: cleanedRows,
          unit: unit || "inches",
          updatedBy: userId,
        },
        $setOnInsert: {
          createdBy: userId,
        },
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate({
        path: "category",
        select: "name slug did imageUrl parent",
      })
      .populate({
        path: "attributeId",
        select: "name slug values",
      });

    res.status(200).json({ status: "success", data: updatedChart });
  } catch (err) {
    logger.error({ err }, "Failed to save size chart");
    res.status(500).json({ status: "error", message: "Unable to save size chart" });
  }
};

// Deletes a category size chart by its record ID, category DID, or slug
export const deleteSizeChart = async (req, res) => {
  const { id } = req.params;
  try {
    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    const categoryQuery = isObjectId
      ? { $or: [{ _id: id }, { slug: id }, { did: id }] }
      : { $or: [{ slug: id }, { did: id }] };
    const category = await CategoryModel.findOne(categoryQuery).lean();

    const deleteFilter = {
      $or: [
        ...(isObjectId ? [{ _id: id }, { category: id }] : []),
        ...(category ? [{ category: category._id }, { categoryDid: category.did }, { categorySlug: category.slug }] : []),
        { categorySlug: id },
        { categoryDid: id },
      ],
    };

    const deleted = await SizeChartModel.findOneAndDelete(deleteFilter);

    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Size chart not found" });
    }

    res.json({ status: "success", message: "Size chart deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete size chart");
    res.status(500).json({ status: "error", message: "Unable to delete size chart" });
  }
};
