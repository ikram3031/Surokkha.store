import { Types } from "mongoose";
import { ProductModel } from "../../common/models/product.model.js";
import { CategoryModel } from "../../common/models/category.model.js";
import { BrandModel } from "../../common/models/brand.model.js";
import { serializeProduct } from "../../common/utils/productUtils.js";

// Helper: Safely converts string or array of strings into trimmed lowercase array
const normalizeArray = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

// Helper: Safely creates case-insensitive regex pattern
const makeRegex = (str) => {
  if (!str) return null;
  const escaped = String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i");
};

/**
 * Controller: Handles high-performance multi-criteria joining, filtering and search for Dashboard products.
 * Path: POST /api/v1/dash/products
 */
export const searchDashProducts = async (req, res, next) => {
  try {
    const body = req.body || {};

    const page = Math.max(1, parseInt(body.page, 10) || 1);
    const limit = Math.min(150, Math.max(1, parseInt(body.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const sortField = body.sort || body.sortBy || "createdAt";
    const sortOrder = String(body.order).toLowerCase() === "asc" || body.order === 1 ? 1 : -1;

    // 1. Build initial indexed $match filter
    const initialMatch = {};

    // Active status filter — use $ne: false to include products where isActive is missing/null
    if (body.isActive !== undefined && body.isActive !== null && body.isActive !== "") {
      const wantActive = body.isActive === true || body.isActive === "true";
      initialMatch.isActive = wantActive ? { $ne: false } : false;
    }

    // Stock Status filter
    if (body.stockStatus && body.stockStatus !== "all") {
      const stockArr = normalizeArray(body.stockStatus);
      if (stockArr.length === 1) {
        initialMatch.stockStatus = stockArr[0];
      } else if (stockArr.length > 1) {
        initialMatch.stockStatus = { $in: stockArr };
      }
    }

    // Tags filter (exact lowercase match)
    const rawTags = normalizeArray(body.tags || body.tag);
    if (rawTags.length > 0) {
      initialMatch.tags = {
        $in: rawTags.map((t) => new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")),
      };
    }

    // Season filter
    const rawSeasons = normalizeArray(body.season || body.seasons);
    if (rawSeasons.length > 0) {
      initialMatch.season = { $in: rawSeasons };
    }

    // Price range filter
    const minPrice = parseFloat(body.minPrice ?? body.min_price);
    const maxPrice = parseFloat(body.maxPrice ?? body.max_price);
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      const priceFilter = {};
      if (!isNaN(minPrice)) priceFilter.$gte = minPrice;
      if (!isNaN(maxPrice)) priceFilter.$lte = maxPrice;

      initialMatch.$or = [
        { price: priceFilter },
        { "variants.price": priceFilter },
        { offerPrice: priceFilter },
        { "variants.offerPrice": priceFilter },
      ];
    }

    // Direct Category ObjectIds
    const rawCategories = normalizeArray(body.categories || body.category);
    const categoryObjectIds = rawCategories
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (categoryObjectIds.length > 0) {
      initialMatch.categories = { $in: categoryObjectIds };
    }

    // Direct Brand DIDs or ObjectIds
    const rawBrands = normalizeArray(body.brands || body.brand);
    if (rawBrands.length > 0) {
      initialMatch.brand = { $in: rawBrands };
    }

    // 2. Construct Aggregation Pipeline
    const pipeline = [];

    // Step A: Initial Match
    if (Object.keys(initialMatch).length > 0) {
      pipeline.push({ $match: initialMatch });
    }

    // Step B: Lookup Categories
    pipeline.push({
      $lookup: {
        from: "categories",
        localField: "categories",
        foreignField: "_id",
        as: "joinedCategories",
      },
    });

    // Step C: Lookup Brands (Matches either DID or ObjectId)
    pipeline.push({
      $lookup: {
        from: "brands",
        let: { brandRefs: "$brand" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $in: ["$did", "$$brandRefs"] },
                  { $in: [{ $toString: "$_id" }, "$$brandRefs"] },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              did: 1,
              name: 1,
              slug: 1,
              imageUrl: 1,
              parentBrand: 1,
            },
          },
        ],
        as: "joinedBrands",
      },
    });

    // Step D: Deep Secondary Matching (Keyword query, Joined category names/slugs, Joined brand names/slugs, Attributes)
    const secondaryMatches = [];

    // General Keyword Search across multiple fields and joined relations
    const rawQ = typeof body.q === "string" ? body.q.trim() : (typeof body.search === "string" ? body.search.trim() : "");
    if (rawQ) {
      const qRegex = makeRegex(rawQ);
      secondaryMatches.push({
        $or: [
          { name: qRegex },
          { slug: qRegex },
          { sku: qRegex },
          { did: qRegex },
          { description: qRegex },
          { notes: qRegex },
          { tags: qRegex },
          { "joinedCategories.name": qRegex },
          { "joinedCategories.slug": qRegex },
          { "joinedBrands.name": qRegex },
          { "joinedBrands.slug": qRegex },
          { "variants.sku": qRegex },
          { "variants.size": qRegex },
        ],
      });
    }

    // Filter by category names/slugs if non-ObjectId strings were passed
    const nonObjectIdCategories = rawCategories.filter((cat) => !Types.ObjectId.isValid(cat));
    if (nonObjectIdCategories.length > 0) {
      const catRegexes = nonObjectIdCategories.map(makeRegex);
      secondaryMatches.push({
        $or: [
          { "joinedCategories.slug": { $in: nonObjectIdCategories } },
          { "joinedCategories.did": { $in: nonObjectIdCategories } },
          { "joinedCategories.name": { $in: catRegexes } },
        ],
      });
    }

    // Filter by brand names/slugs if non-DID strings were passed
    const brandNameQueries = rawBrands.filter((b) => b.length > 20 || !/^[0-9a-fA-F]+$/.test(b));
    if (brandNameQueries.length > 0) {
      const brandRegexes = brandNameQueries.map(makeRegex);
      secondaryMatches.push({
        $or: [
          { "joinedBrands.slug": { $in: brandNameQueries } },
          { "joinedBrands.name": { $in: brandRegexes } },
        ],
      });
    }

    // Attributes filter (e.g. { attributes: [{ key: "size", value: "100ml" }] } or { sizes: ["100ml"] })
    if (body.attributes && Array.isArray(body.attributes) && body.attributes.length > 0) {
      body.attributes.forEach((attr) => {
        if (attr.key && attr.value) {
          const valRegex = makeRegex(attr.value);
          secondaryMatches.push({
            $or: [
              { "variants.size": valRegex },
              { [`attributes.${attr.key}`]: valRegex },
            ],
          });
        }
      });
    }

    if (body.sizes || body.size) {
      const rawSizes = normalizeArray(body.sizes || body.size);
      if (rawSizes.length > 0) {
        secondaryMatches.push({
          "variants.size": { $in: rawSizes.map(makeRegex) },
        });
      }
    }

    if (secondaryMatches.length > 0) {
      pipeline.push({
        $match: secondaryMatches.length === 1 ? secondaryMatches[0] : { $and: secondaryMatches },
      });
    }

    // Step E: Dynamic Facet for Total Count & Paginated Documents
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { [sortField]: sortOrder, _id: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              id: "$_id",
              name: 1,
              slug: 1,
              did: 1,
              type: 1,
              price: 1,
              offerPrice: 1,
              sku: 1,
              variants: 1,
              season: 1,
              tags: 1,
              notes: 1,
              brand: "$joinedBrands",
              categories: "$joinedCategories",
              imageUrl: 1,
              thumbnailUrl: 1,
              images: 1,
              stockStatus: 1,
              stockAmount: 1,
              isActive: 1,
              chargeTax: 1,
              taxRate: 1,
              metaData: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    });

    const results = await ProductModel.aggregate(pipeline);

    const firstFacet = results[0] || {};
    const total = firstFacet.metadata?.[0]?.total || 0;
    const rawData = firstFacet.data || [];

    const serializedData = rawData.map(serializeProduct);

    return res.json({
      status: "success",
      data: serializedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};
