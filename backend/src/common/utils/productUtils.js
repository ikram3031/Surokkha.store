import { Types } from "mongoose";
import { CategoryModel } from "../models/category.model.js";
import { BrandModel } from "../models/brand.model.js";

const DEFAULT_LIMIT = 10;
const SORT_FIELD_MAP = {
  name: "name",
  price: "price",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  stockStatus: "stockStatus",
};

export const PLACEHOLDER_IMAGE_URL = "/uploads/product_placeholder.webp";

// Normalizes input value by trimming if it is a string
export const normalizeValue = (value) => {
  if (typeof value === "string") {
    return value.trim();
  }

  return value;
};

// Checks if the image URL matches the placeholder image
export const isPlaceholderImageUrl = (value) => typeof value === "string" && value.trim() === PLACEHOLDER_IMAGE_URL;

// Serializes a Mongoose product document into a clean API response format with category did support
export const serializeProduct = (product) => {
  const source = product?.toObject ? product.toObject() : product;
  const { _id, __v, ...rest } = source || {};
  const id = source?._id?.toString?.() ?? source?.id ?? null;

  const rawCategories = Array.isArray(source?.categories) ? source.categories : [];
  const populatedCategories = rawCategories
    .filter((c) => c && typeof c === "object" && (c.name || c.slug || c.did || c._id))
    .map((c) => ({
      id: c._id?.toString?.() ?? c.id ?? null,
      _id: c._id?.toString?.() ?? c.id ?? null,
      did: c.did ?? null,
      name: c.name ?? "",
      slug: c.slug ?? "",
      imageUrl: c.imageUrl ?? "",
      parent: c.parent ?? null,
    }));

  const primaryCategory = populatedCategories.length > 0 ? populatedCategories[0] : null;

  const rawVariants = Array.isArray(source?.variants)
    ? source.variants.map((v) => ({
        size: v.size ?? "",
        price: Number(v.price ?? 0),
        offerPrice: v.offerPrice != null ? Number(v.offerPrice) : null,
        sku: v.sku ?? "",
        sortOrder: Number(v.sortOrder ?? 0),
        imageUrl: v.imageUrl ?? null,
        stockStatus: v.stockStatus || "instock",
      }))
    : undefined;

  return {
    ...rest,
    ...(rawVariants !== undefined ? { variants: rawVariants } : {}),
    id,
    category: primaryCategory,
    categories: populatedCategories.length > 0 ? populatedCategories : rawCategories,
    _populatedCategories: populatedCategories,
    stockStatus: source?.stockStatus ?? "instock",
    stockAmount: typeof source?.stockAmount === "number" ? source.stockAmount : Number(source?.stockAmount || 0),
    created_at: source?.createdAt ?? null,
    updated_at: source?.updatedAt ?? null,
    image_url: source?.imageUrl ?? null,
    thumbnail_url: source?.thumbnailUrl ?? null,
  };
};

// Builds a Mongoose filter query object based on the provided request parameters
export const buildProductFilter = async (input = {}) => {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const explicitFilter = source.filter && typeof source.filter === "object" && !Array.isArray(source.filter)
    ? source.filter
    : {};

  const filter = {};

  Object.entries(explicitFilter).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) {
      return;
    }

    if (key !== "q") {
      filter[key] = value;
    }
  });

  Object.entries(source).forEach(([key, value]) => {
    if (["q", "search", "keyword", "page", "skip", "offset", "limit", "sort", "sortBy", "sortby", "order", "filter", "category", "categories", "brand", "brands", "minPrice", "maxPrice", "min_price", "max_price", "rating"].includes(key)) {
      return;
    }

    if (key === "isActive") {
      filter.isActive = value === "false" || value === false ? false : true;
      return;
    }

    filter[key] = value;
  });

  const rawQ = normalizeValue(source.q ?? source.search ?? source.keyword);
  const q = (typeof rawQ === "string" && (rawQ === "undefined" || rawQ === "null" || rawQ.trim() === "")) ? "" : rawQ;
  if (q) {
    const searchClause = [
      { name: { $regex: q, $options: "i" } },
      { slug: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];

    if (filter.$or) {
      filter.$or = [...filter.$or, ...searchClause];
    } else {
      filter.$or = searchClause;
    }
  }

  const stockStatus = normalizeValue(source.stockStatus ?? source.status);
  if (stockStatus) {
    filter.stockStatus = stockStatus;
  }

  const rawCategoryInput = source.category ?? source.categories ?? source['category[]'] ?? source['categories[]'];
  if (rawCategoryInput) {
    const rawValues = Array.isArray(rawCategoryInput) ? rawCategoryInput : [rawCategoryInput];
    const categoryValues = [];
    rawValues.forEach((val) => {
      if (typeof val === "string" && val.includes(",")) {
        categoryValues.push(...val.split(",").map((s) => s.trim()).filter(Boolean));
      } else if (val !== "" && val !== null && val !== undefined) {
        categoryValues.push(val);
      }
    });

    const resolved = [];
    const resolvedSet = new Set();

    const addResolved = (id) => {
      if (!id) return;
      const idStr = id.toString();
      if (!resolvedSet.has(idStr)) {
        resolvedSet.add(idStr);
        resolved.push(id);
      }
    };

    for (const categoryValue of categoryValues) {
      if (Types.ObjectId.isValid(categoryValue)) {
        addResolved(categoryValue);
        let currentParentIds = [categoryValue];
        while (currentParentIds.length > 0) {
          const children = await CategoryModel.find({ parent: { $in: currentParentIds } }).select('_id').lean();
          const nextParentIds = [];
          for (const child of children) {
            if (child?._id && !resolvedSet.has(child._id.toString())) {
              addResolved(child._id);
              nextParentIds.push(child._id);
            }
          }
          currentParentIds = nextParentIds;
        }
        continue;
      }

      const normalizedCategory = normalizeValue(categoryValue);
      if (!normalizedCategory) continue;

      const isDidFormat = /^[0-9a-fA-F]{16}$/.test(normalizedCategory);
      const categoryQuery = isDidFormat
        ? { $or: [{ did: normalizedCategory }, { slug: normalizedCategory }] }
        : {
            $or: [
              { did: normalizedCategory },
              { slug: normalizedCategory },
              { slug: { $regex: `^${normalizedCategory}$`, $options: "i" } },
              { name: normalizedCategory },
              { name: { $regex: `^${normalizedCategory}$`, $options: "i" } },
            ],
          };

      const categoryDocs = await CategoryModel.find(categoryQuery).lean();
      let currentParentIds = [];
      for (const categoryDoc of categoryDocs) {
        if (categoryDoc?._id && !resolvedSet.has(categoryDoc._id.toString())) {
          addResolved(categoryDoc._id);
          currentParentIds.push(categoryDoc._id);
        }
      }

      while (currentParentIds.length > 0) {
        const children = await CategoryModel.find({ parent: { $in: currentParentIds } }).select('_id').lean();
        const nextParentIds = [];
        for (const child of children) {
          if (child?._id && !resolvedSet.has(child._id.toString())) {
            addResolved(child._id);
            nextParentIds.push(child._id);
          }
        }
        currentParentIds = nextParentIds;
      }
    }

    if (resolved.length > 0) {
      filter.categories = { $in: resolved };
    } else {
      filter.categories = { $in: [] };
    }
  }

  const brandInput = source.brand ?? source.brands;
  if (brandInput) {
    const rawValues = Array.isArray(brandInput) ? brandInput : [brandInput];
    const brandValues = [];
    rawValues.forEach(val => {
      if (typeof val === 'string' && val.includes(',')) {
        brandValues.push(...val.split(','));
      } else {
        brandValues.push(val);
      }
    });

    const resolved = [];

    for (const brandValue of brandValues) {
      if (brandValue === "" || brandValue === null || brandValue === undefined) {
        continue;
      }

      const normalizedBrand = normalizeValue(brandValue);
      if (!normalizedBrand) continue;

      let brandDocs = [];
      if (/^[0-9a-fA-F]{16}$/.test(normalizedBrand)) {
        brandDocs = await BrandModel.find({ did: normalizedBrand }).lean();
      } else {
        const brandQuery = /^[0-9a-fA-F]{24}$/.test(normalizedBrand)
          ? { _id: normalizedBrand }
          : {
              $or: [
                { slug: normalizedBrand },
                { slug: { $regex: normalizedBrand, $options: "i" } }
              ]
            };
        brandDocs = await BrandModel.find(brandQuery).lean();
      }

      for (const brandDoc of brandDocs) {
        if (brandDoc.did) {
          resolved.push(brandDoc.did);
        }
        const subBrands = await BrandModel.find({ parent: brandDoc._id }).lean();
        subBrands.forEach(sub => {
          if (sub.did) {
            resolved.push(sub.did);
          }
        });
      }
    }

    filter.brand = { $in: resolved };
  }

  const type = normalizeValue(source.type);
  if (type) {
    filter.type = type;
  }

  const slug = normalizeValue(source.slug);
  if (slug) {
    filter.slug = slug;
  }

  const did = normalizeValue(source.did);
  if (did) {
    filter.did = did;
  }

  const minPrice = Number(source.minPrice ?? source.min_price);
  const maxPrice = Number(source.maxPrice ?? source.max_price);

  if (!isNaN(minPrice) || !isNaN(maxPrice)) {
    const minVal = !isNaN(minPrice) ? minPrice : 0;
    const maxVal = !isNaN(maxPrice) ? maxPrice : Infinity;

    const priceConditions = [];

    const simpleOfferPriceCond = { $gt: 0, $ne: null, $gte: minVal };
    const simplePriceCond = { $gte: minVal };
    if (maxVal !== Infinity) {
      simpleOfferPriceCond.$lte = maxVal;
      simplePriceCond.$lte = maxVal;
    }

    const simpleCond = {
      type: "simple",
      $or: [
        { offerPrice: simpleOfferPriceCond },
        { $or: [{ offerPrice: null }, { offerPrice: 0 }], price: simplePriceCond }
      ]
    };
    priceConditions.push(simpleCond);

    const variantOfferPriceCond = { $gt: 0, $ne: null, $gte: minVal };
    const variantPriceCond = { $gte: minVal };
    if (maxVal !== Infinity) {
      variantOfferPriceCond.$lte = maxVal;
      variantPriceCond.$lte = maxVal;
    }

    const variantCond = {
      type: "variant",
      variants: {
        $elemMatch: {
          $or: [
            { offerPrice: variantOfferPriceCond },
            { $or: [{ offerPrice: null }, { offerPrice: 0 }], price: variantPriceCond }
          ]
        }
      }
    };
    priceConditions.push(variantCond);

    if (filter.$or) {
      filter.$and = [
        { $or: filter.$or },
        { $or: priceConditions }
      ];
      delete filter.$or;
    } else {
      filter.$or = priceConditions;
    }
  }

  if (source.onSale === true || source.onSale === "true" || source.on_sale === true || source.on_sale === "true") {
    const onSaleConditions = [
      { offerPrice: { $gt: 0, $ne: null } },
      { "variants.offerPrice": { $gt: 0, $ne: null } },
      { tags: { $in: ["sale", "on-sale", "Sale", "On-Sale"] } }
    ];
    if (filter.$and) {
      filter.$and.push({ $or: onSaleConditions });
    } else if (filter.$or) {
      filter.$and = [
        { $or: filter.$or },
        { $or: onSaleConditions }
      ];
      delete filter.$or;
    } else {
      filter.$or = onSaleConditions;
    }
  }

  return filter;
};

// Builds a Mongoose sort options object for product listings
export const buildProductSort = (sortByOrInput = "createdAt", order = "desc") => {
  let sortBy = "createdAt";
  let sortOrder = "desc";

  if (typeof sortByOrInput === "object" && sortByOrInput !== null) {
    const input = sortByOrInput;

    if (typeof input.sort === "string") {
      const s = input.sort.toLowerCase().trim();
      if (s === "newest") {
        return { createdAt: -1 };
      } else if (s === "oldest") {
        return { createdAt: 1 };
      } else if (s === "price-asc" || s === "price_asc" || s === "price-low-to-high") {
        return { price: 1 };
      } else if (s === "price-desc" || s === "price_desc" || s === "price-high-to-low") {
        return { price: -1 };
      } else if (s === "name-asc" || s === "name_asc") {
        return { name: 1 };
      } else if (s === "name-desc" || s === "name_desc") {
        return { name: -1 };
      }
    }

    sortBy = input.sortBy || input.sort_by || "createdAt";
    sortOrder = input.order || input.sortOrder || input.sort_order || "desc";
  } else if (typeof sortByOrInput === "string") {
    sortBy = sortByOrInput;
    sortOrder = order || "desc";
  }

  const cleanSortBy = typeof sortBy === "string" ? sortBy.trim() : "createdAt";
  const field = SORT_FIELD_MAP[cleanSortBy] || "createdAt";
  const direction = String(sortOrder).toLowerCase().trim() === "asc" ? 1 : -1;

  return { [field]: direction };
};

// Parses and validates offset (skip) and limit pagination parameters
export const parsePagination = (input = {}) => {
  const skip = Math.max(0, parseInt(normalizeValue(input.skip ?? input.offset ?? 0), 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(normalizeValue(input.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

  return { skip, limit };
};
