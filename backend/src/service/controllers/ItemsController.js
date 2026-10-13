import { Types } from "mongoose";
import { ItemModel } from "../../common/models/item.model.js";
import { CategoryModel } from "../../common/models/category.model.js";
import { BrandModel } from "../../common/models/brand.model.js";
import { UserModel } from "../../common/models/user.model.js";
import {
  PLACEHOLDER_IMAGE_URL,
  serializeProduct,
  buildProductFilter,
  buildProductSort,
  parsePagination,
} from "../../common/utils/productUtils.js";

// Creates a new item and returns the populated item document
export const createItem = async (req, res, next) => {
  try {
    const body = req.body || {};

    let userId = req.body.createdBy || req.user?.userId || req.user?.id;
    if (!userId) {
      const fallbackUser = await UserModel.findOne({
        role: { $in: ["Owner", "Admin"] },
      }).lean();
      if (fallbackUser) {
        userId = fallbackUser._id;
      } else {
        const anyUser = await UserModel.findOne().lean();
        if (anyUser) userId = anyUser._id;
      }
    }

    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "User is required to create an item",
      });
      return;
    }

    let categoryIds = [];
    if (body.categories || body.category) {
      const catInput = body.categories || body.category;
      const catArray = Array.isArray(catInput) ? catInput : [catInput];
      for (const cat of catArray) {
        if (!cat) continue;
        const catVal = typeof cat === "object" && cat !== null ? (cat._id || cat.id || cat.did || cat.slug) : cat;
        if (!catVal || typeof catVal !== "string") continue;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(catVal);
        if (isObjectId) {
          categoryIds.push(catVal);
        } else {
          const found = await CategoryModel.findOne({
            $or: [{ slug: catVal }, { did: catVal }],
          }).lean();
          if (found) categoryIds.push(found._id);
        }
      }
    }

    let brandDids = [];
    if (body.brand || body.brands) {
      const brandInput = body.brand || body.brands;
      const brandArray = Array.isArray(brandInput) ? brandInput : [brandInput];
      for (const br of brandArray) {
        if (!br) continue;
        const brVal = typeof br === "object" && br !== null ? (br.did || br.slug || br._id || br.id) : br;
        if (!brVal || typeof brVal !== "string") continue;
        if (/^[0-9a-fA-F]{16}$/.test(brVal)) {
          brandDids.push(brVal);
        } else {
          const isBrandObjectId = /^[0-9a-fA-F]{24}$/.test(brVal);
          const query = isBrandObjectId
            ? { $or: [{ slug: brVal }, { did: brVal }, { _id: brVal }] }
            : { $or: [{ slug: brVal }, { did: brVal }] };
          const found = await BrandModel.findOne(query).lean();
          if (found) brandDids.push(found.did);
        }
      }
    }

    const rawImageUrl = body.imageUrl || body.image_url;
    if (!rawImageUrl || !rawImageUrl.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Item image is required. Please upload an image before saving.",
      });
    }
    const imageUrl = rawImageUrl.trim();
    const thumbnailUrl = (body.thumbnailUrl || body.thumbnail_url || imageUrl).trim();
    const rawGallery = body.gallery || body.images || body.galleryImages || [];
    const gallery = Array.isArray(rawGallery)
      ? rawGallery
          .map((item) => {
            if (typeof item === "string" && item.trim()) return item.trim();
            if (typeof item === "object" && item !== null) {
              const url = item.url || item.imageUrl || item.preview || item.src || "";
              return typeof url === "string" && url.trim() ? url.trim() : null;
            }
            return null;
          })
          .filter(Boolean)
      : [];

    const itemData = {
      name: body.name,
      slug: body.slug,
      description: body.description || body.name,
      longDescription: body.longDescription || "",
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      excludeFromMetaCatalog: body.excludeFromMetaCatalog !== undefined ? Boolean(body.excludeFromMetaCatalog) : false,
      type: body.type || "simple",
      tags: Array.isArray(body.tags)
        ? body.tags
            .flatMap((t) => (typeof t === "string" ? t.split(",") : t))
            .map((t) => String(t).trim())
            .filter(Boolean)
        : typeof body.tags === "string"
        ? body.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      categories: categoryIds,
      brand: brandDids,
      imageUrl,
      thumbnailUrl,
      gallery,
      stockStatus: body.stockStatus || "instock",
      stockAmount:
        body.stockAmount !== undefined &&
        body.stockAmount !== null &&
        body.stockAmount !== ""
          ? Math.max(0, Number(body.stockAmount))
          : 0,
      origin: body.origin || "China Imported",
      expiryDate: body.expiryDate || "2030",
      packSize: body.packSize || "",
      specifications: body.specifications || {},
      benefits: Array.isArray(body.benefits) ? body.benefits : [],
      sections: Array.isArray(body.sections) ? body.sections : [],
      packageContents: body.packageContents || "",
      bn: body.bn || {},
      createdBy: userId,
    };

    if (body.type === "variant") {
      itemData.variants = Array.isArray(body.variants)
        ? body.variants.map((v, i) => ({
            size: v.size,
            price: Number(v.price),
            offerPrice:
              v.offerPrice !== undefined && v.offerPrice !== null
                ? Number(v.offerPrice)
                : null,
            sku: v.sku || "",
            sortOrder: v.sortOrder !== undefined ? Number(v.sortOrder) : i,
            imageUrl: v.imageUrl || null,
            stockStatus: v.stockStatus || "instock",
          }))
        : [];
      if (itemData.variants.length > 0) {
        const anyInStock = itemData.variants.some((v) => v.stockStatus === "instock");
        itemData.stockStatus = anyInStock ? "instock" : "outofstock";
      }
    } else {
      itemData.price = Number(body.price || 0);
      itemData.offerPrice =
        body.offerPrice !== undefined && body.offerPrice !== null
          ? Number(body.offerPrice)
          : null;
      itemData.sku = body.sku || "";
    }

    if (body.metaData) {
      itemData.metaData = {
        metaTitle: body.metaData.metaTitle || "",
        metaDescription: body.metaData.metaDescription || "",
        keywords: Array.isArray(body.metaData.keywords)
          ? body.metaData.keywords
          : [],
        ogImage: body.metaData.ogImage || "",
      };
    }

    const newItem = await ItemModel.create(itemData);
    const populatedItem = await ItemModel.findById(newItem._id)
      .populate("categories")
      .lean();

    res
      .status(201)
      .json({ status: "success", data: serializeProduct(populatedItem || newItem) });
  } catch (err) {
    next(err);
  }
};

// Lists items matching filter, pagination, and sorting criteria
export const listItems = async (req, res, next) => {
  try {
    const method = (req.method || "GET").toUpperCase();

    const queryOptions = method === "POST" ? req.body : req.query;
    const filter = await buildProductFilter(queryOptions);
    const sort = buildProductSort(queryOptions);
    const { limit, skip } = parsePagination(queryOptions);

    const items = await ItemModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("categories")
      .lean();

    const count = await ItemModel.countDocuments(filter);

    res.json({
      status: "success",
      data: items.map(serializeProduct),
      pagination: {
        total: count,
        limit,
        skip,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Retrieves a single item details by MongoDB ObjectId, DID, or slug
export const getSingleItem = async (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    const isObjectId = typeof identifier === "string" && /^[0-9a-fA-F]{24}$/.test(identifier);
    const filter = isObjectId
      ? { $or: [{ _id: identifier }, { slug: identifier }, { did: identifier }] }
      : { $or: [{ slug: identifier }, { did: identifier }] };

    const item = await ItemModel.findOne(filter)
      .populate("categories")
      .lean();

    if (!item) {
      res.status(404).json({ status: "error", message: "Item not found" });
      return;
    }

    res.json({ status: "success", data: serializeProduct(item) });
  } catch (err) {
    next(err);
  }
};

// Updates details of an existing item
export const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId
      ? { $or: [{ _id: id }, { slug: id }, { did: id }] }
      : { $or: [{ slug: id }, { did: id }] };

    const item = await ItemModel.findOne(filter);
    if (!item) {
      res.status(404).json({ status: "error", message: "Item not found" });
      return;
    }

    if (body.name !== undefined) item.name = body.name;
    if (body.slug !== undefined) item.slug = body.slug;
    if (body.description !== undefined) item.description = body.description;
    if (body.longDescription !== undefined) item.longDescription = body.longDescription;
    if (body.isActive !== undefined) item.isActive = Boolean(body.isActive);
    if (body.excludeFromMetaCatalog !== undefined)
      item.excludeFromMetaCatalog = Boolean(body.excludeFromMetaCatalog);
    if (body.type !== undefined) item.type = body.type;

    if (body.tags !== undefined) {
      item.tags = Array.isArray(body.tags)
        ? body.tags
            .flatMap((t) => (typeof t === "string" ? t.split(",") : t))
            .map((t) => String(t).trim())
            .filter(Boolean)
        : typeof body.tags === "string"
        ? body.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    }

    if (body.imageUrl !== undefined || body.image_url !== undefined) {
      item.imageUrl = (body.imageUrl || body.image_url || "").trim();
    }
    if (body.thumbnailUrl !== undefined || body.thumbnail_url !== undefined) {
      item.thumbnailUrl = (body.thumbnailUrl || body.thumbnail_url || item.imageUrl || "").trim();
    }

    if (body.stockStatus !== undefined) item.stockStatus = body.stockStatus;
    if (body.stockAmount !== undefined && body.stockAmount !== null && body.stockAmount !== "") {
      item.stockAmount = Math.max(0, Number(body.stockAmount));
    }

    if (body.origin !== undefined) item.origin = body.origin;
    if (body.expiryDate !== undefined) item.expiryDate = body.expiryDate;
    if (body.packSize !== undefined) item.packSize = body.packSize;
    if (body.specifications !== undefined) item.specifications = body.specifications;
    if (body.benefits !== undefined) item.benefits = body.benefits;
    if (body.sections !== undefined) item.sections = body.sections;
    if (body.packageContents !== undefined) item.packageContents = body.packageContents;
    if (body.bn !== undefined) item.bn = body.bn;

    const rawGallery =
      body.gallery !== undefined
        ? body.gallery
        : body.images !== undefined
        ? body.images
        : body.galleryImages !== undefined
        ? body.galleryImages
        : undefined;

    if (rawGallery !== undefined) {
      item.gallery = Array.isArray(rawGallery)
        ? rawGallery
            .map((g) => {
              if (typeof g === "string" && g.trim()) return g.trim();
              if (typeof g === "object" && g !== null) {
                const url = g.url || g.imageUrl || g.preview || g.src || "";
                return typeof url === "string" && url.trim() ? url.trim() : null;
              }
              return null;
            })
            .filter(Boolean)
        : [];
    }

    if (body.categories !== undefined || body.category !== undefined) {
      const catInput = body.categories || body.category;
      const catArray = Array.isArray(catInput) ? catInput : [catInput];
      const categoryIds = [];
      for (const cat of catArray) {
        if (!cat) continue;
        const catVal = typeof cat === "object" && cat !== null ? (cat._id || cat.id || cat.did || cat.slug) : cat;
        if (!catVal || typeof catVal !== "string") continue;
        const isCatObjectId = /^[0-9a-fA-F]{24}$/.test(catVal);
        if (isCatObjectId) {
          categoryIds.push(catVal);
        } else {
          const found = await CategoryModel.findOne({
            $or: [{ slug: catVal }, { did: catVal }],
          }).lean();
          if (found) categoryIds.push(found._id);
        }
      }
      item.categories = categoryIds;
    }

    if (body.brand !== undefined || body.brands !== undefined) {
      const brandInput = body.brand || body.brands;
      const brandArray = Array.isArray(brandInput) ? brandInput : [brandInput];
      const brandDids = [];
      for (const br of brandArray) {
        if (!br) continue;
        const brVal = typeof br === "object" && br !== null ? (br.did || br.slug || br._id || br.id) : br;
        if (!brVal || typeof brVal !== "string") continue;
        if (/^[0-9a-fA-F]{16}$/.test(brVal)) {
          brandDids.push(brVal);
        } else {
          const isBrandObjectId = /^[0-9a-fA-F]{24}$/.test(brVal);
          const query = isBrandObjectId
            ? { $or: [{ slug: brVal }, { did: brVal }, { _id: brVal }] }
            : { $or: [{ slug: brVal }, { did: brVal }] };
          const found = await BrandModel.findOne(query).lean();
          if (found) brandDids.push(found.did);
        }
      }
      item.brand = brandDids;
    }

    if (item.type === "variant") {
      if (body.variants !== undefined) {
        item.variants = Array.isArray(body.variants)
          ? body.variants.map((v, i) => {
              const existing = (item.variants || []).find((ev) => ev.size === v.size) || item.variants?.[i] || {};
              return {
                size: v.size || existing.size,
                price: v.price !== undefined ? Number(v.price) : (existing.price ?? 0),
                offerPrice:
                  v.offerPrice !== undefined
                    ? (v.offerPrice !== null ? Number(v.offerPrice) : null)
                    : (existing.offerPrice ?? null),
                sku: v.sku !== undefined ? (v.sku || "") : (existing.sku || ""),
                sortOrder: v.sortOrder !== undefined ? Number(v.sortOrder) : (existing.sortOrder ?? i),
                imageUrl: v.imageUrl !== undefined ? (v.imageUrl || null) : (existing.imageUrl ?? null),
                stockStatus: v.stockStatus || existing.stockStatus || "instock",
              };
            })
          : [];
        if (body.stockStatus === undefined && item.variants.length > 0) {
          const anyInStock = item.variants.some((v) => v.stockStatus === "instock");
          item.stockStatus = anyInStock ? "instock" : "outofstock";
        }
      }
      item.price = undefined;
      item.offerPrice = undefined;
      item.sku = undefined;
    } else {
      if (body.price !== undefined) item.price = Number(body.price);
      if (body.offerPrice !== undefined)
        item.offerPrice =
          body.offerPrice !== null ? Number(body.offerPrice) : null;
      if (body.sku !== undefined) item.sku = body.sku;
      item.variants = undefined;
    }

    if (body.metaData !== undefined) {
      item.metaData = {
        metaTitle: body.metaData.metaTitle || "",
        metaDescription: body.metaData.metaDescription || "",
        keywords: Array.isArray(body.metaData.keywords)
          ? body.metaData.keywords
          : [],
        ogImage: body.metaData.ogImage || "",
      };
    }

    if (req.user?.userId || req.user?.id) {
      item.updatedBy = req.user.userId || req.user.id;
    }

    await item.save();
    const populatedItem = await ItemModel.findById(item._id)
      .populate("categories")
      .lean();

    res.json({ status: "success", data: serializeProduct(populatedItem || item) });
  } catch (err) {
    next(err);
  }
};

// Deletes an item by ID, DID, or slug
export const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId
      ? { $or: [{ _id: id }, { slug: id }, { did: id }] }
      : { $or: [{ slug: id }, { did: id }] };
    const result = await ItemModel.deleteOne(filter);
    if (result.deletedCount === 0) {
      res.status(404).json({ status: "error", message: "Item not found" });
      return;
    }
    res.json({ status: "success", message: "Item deleted successfully" });
  } catch (err) {
    next(err);
  }
};
