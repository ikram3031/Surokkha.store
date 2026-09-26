import { Types } from "mongoose";
import { ProductModel } from "../../common/models/product.model.js";
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

// Creates a new product and returns the populated product document
export const createProduct = async (req, res, next) => {
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
        message: "User is required to create a product",
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
        message: "Product image is required. Please upload an image before saving.",
      });
    }
    const imageUrl = rawImageUrl.trim();
    const thumbnailUrl = (body.thumbnailUrl || body.thumbnail_url || imageUrl).trim();
    const rawGallery = body.images || body.galleryImages || body.gallery || [];
    const images = Array.isArray(rawGallery)
      ? rawGallery
          .map((item) => {
            if (typeof item === "string" && item.trim()) return item.trim();
            if (typeof item === "object" && item !== null) {
              const url = item.url || item.imageUrl || item.preview || "";
              return typeof url === "string" && url.trim() ? url.trim() : null;
            }
            return null;
          })
          .filter(Boolean)
      : [];

    const productData = {
      name: body.name,
      slug: body.slug,
      description: body.description || body.name,
      longDescription: body.longDescription || "",
      chargeTax: Boolean(body.chargeTax),
      taxRate: body.taxRate !== undefined && body.taxRate !== null && body.taxRate !== "" ? Number(body.taxRate) : null,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      type: body.type || "simple",
      season: Array.isArray(body.season)
        ? body.season
        : typeof body.season === "string" && body.season.trim()
        ? body.season.split(",").map((s) => s.trim()).filter(Boolean)
        : ["All-Season"],
      tags: Array.isArray(body.tags)
        ? body.tags
            .flatMap((t) => (typeof t === "string" ? t.split(",") : t))
            .map((t) => String(t).trim())
            .filter(Boolean)
        : typeof body.tags === "string"
        ? body.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      notes: Array.isArray(body.notes) ? body.notes : [],
      categories: categoryIds,
      brand: brandDids,
      imageUrl,
      thumbnailUrl,
      images,
      stockStatus: body.stockStatus || "instock",
      stockAmount:
        body.stockAmount !== undefined &&
        body.stockAmount !== null &&
        body.stockAmount !== ""
          ? Math.max(0, Number(body.stockAmount))
          : 0,
      createdBy: userId,
    };

    if (body.type === "variant") {
      productData.variants = Array.isArray(body.variants)
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
      if (productData.variants.length > 0) {
        const anyInStock = productData.variants.some((v) => v.stockStatus === "instock");
        productData.stockStatus = anyInStock ? "instock" : "outofstock";
      }
    } else {
      productData.price = Number(body.price || 0);
      productData.offerPrice =
        body.offerPrice !== undefined && body.offerPrice !== null
          ? Number(body.offerPrice)
          : null;
      productData.sku = body.sku || "";
    }

    if (body.metaData) {
      productData.metaData = {
        metaTitle: body.metaData.metaTitle || "",
        metaDescription: body.metaData.metaDescription || "",
        keywords: Array.isArray(body.metaData.keywords)
          ? body.metaData.keywords
          : [],
        ogImage: body.metaData.ogImage || "",
      };
    }

    const newProduct = await ProductModel.create(productData);
    const populatedProduct = await ProductModel.findById(newProduct._id)
      .populate("categories")
      .lean();

    res
      .status(201)
      .json({ status: "success", data: serializeProduct(populatedProduct || newProduct) });
  } catch (err) {
    next(err);
  }
};

// Lists products matching filter, pagination, and sorting criteria
export const listProducts = async (req, res, next) => {
  try {
    const method = (req.method || "GET").toUpperCase();

    const queryOptions = method === "POST" ? req.body : req.query;
    const filter = await buildProductFilter(queryOptions);
    const sort = buildProductSort(queryOptions);
    const { limit, skip } = parsePagination(queryOptions);

    const products = await ProductModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("categories")
      .lean();

    const count = await ProductModel.countDocuments(filter);

    res.json({
      status: "success",
      data: products.map(serializeProduct),
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

// Retrieves a single product details by MongoDB ObjectId, DID, or slug
export const getSingleProduct = async (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    const isObjectId = typeof identifier === "string" && /^[0-9a-fA-F]{24}$/.test(identifier);
    const filter = isObjectId
      ? { $or: [{ _id: identifier }, { slug: identifier }, { did: identifier }] }
      : { $or: [{ slug: identifier }, { did: identifier }] };

    const product = await ProductModel.findOne(filter)
      .populate("categories")
      .lean();

    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found" });
      return;
    }

    res.json({ data: serializeProduct(product) });
  } catch (err) {
    next(err);
  }
};

// Updates an existing product details by ID, DID, or slug
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId
      ? { $or: [{ _id: id }, { slug: id }, { did: id }] }
      : { $or: [{ slug: id }, { did: id }] };
    const product = await ProductModel.findOne(filter);
    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found" });
      return;
    }

    let userId = req.body.updatedBy || req.body.createdBy || req.user?.userId || req.user?.id;
    if (!userId) {
      const fallbackUser = await UserModel.findOne({
        role: { $in: ["Owner", "Admin"] },
      }).lean();
      if (fallbackUser) userId = fallbackUser._id;
    }

    const incomingImageUrl = body.imageUrl || body.image_url;
    if (incomingImageUrl !== undefined && incomingImageUrl !== null && !incomingImageUrl.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Product image is required. Please upload an image before saving.",
      });
    }

    if (body.name !== undefined) product.name = body.name;
    if (body.slug !== undefined) product.slug = body.slug;
    if (body.description !== undefined) product.description = body.description;
    if (body.longDescription !== undefined) product.longDescription = body.longDescription;
    if (body.chargeTax !== undefined) product.chargeTax = Boolean(body.chargeTax);
    if (body.taxRate !== undefined) product.taxRate = body.taxRate ? Number(body.taxRate) : null;
    if (body.isActive !== undefined) product.isActive = Boolean(body.isActive);
    if (body.metaData !== undefined) {
      product.metaData = {
        metaTitle: body.metaData.metaTitle || "",
        metaDescription: body.metaData.metaDescription || "",
        keywords: Array.isArray(body.metaData.keywords) ? body.metaData.keywords : [],
        ogImage: body.metaData.ogImage || "",
      };
    }
    if (body.type !== undefined) product.type = body.type;
    if (incomingImageUrl && incomingImageUrl.trim()) product.imageUrl = incomingImageUrl.trim();
    if (body.thumbnailUrl && body.thumbnailUrl.trim())
      product.thumbnailUrl = body.thumbnailUrl.trim();
    if (body.thumbnail_url && body.thumbnail_url.trim())
      product.thumbnailUrl = body.thumbnail_url.trim();
    if (body.season !== undefined) {
      product.season = Array.isArray(body.season)
        ? body.season
        : typeof body.season === "string" && body.season.trim()
        ? body.season.split(",").map((s) => s.trim()).filter(Boolean)
        : ["All-Season"];
    }
    if (body.tags !== undefined) {
      product.tags = Array.isArray(body.tags)
        ? body.tags
            .flatMap((t) => (typeof t === "string" ? t.split(",") : t))
            .map((t) => String(t).trim())
            .filter(Boolean)
        : typeof body.tags === "string"
        ? body.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    }
    if (body.notes !== undefined) product.notes = body.notes;
    if (body.stockStatus !== undefined) product.stockStatus = body.stockStatus;
    if (body.stockAmount !== undefined) {
      product.stockAmount =
        body.stockAmount !== null && body.stockAmount !== ""
          ? Math.max(0, Number(body.stockAmount))
          : 0;
    }

    const rawGallery =
      body.images !== undefined
        ? body.images
        : body.galleryImages !== undefined
        ? body.galleryImages
        : body.gallery;

    if (rawGallery !== undefined) {
      product.images = Array.isArray(rawGallery)
        ? rawGallery
            .map((item) => {
              if (typeof item === "string" && item.trim()) return item.trim();
              if (typeof item === "object" && item !== null) {
                const url = item.url || item.imageUrl || item.preview || "";
                return typeof url === "string" && url.trim() ? url.trim() : null;
              }
              return null;
            })
            .filter(Boolean)
        : [];
    }

    if (userId) {
      product.updatedBy = userId;
      if (!product.createdBy) {
        product.createdBy = userId;
      }
    }

    if (body.categories !== undefined || body.category !== undefined) {
      const catInput =
        body.categories !== undefined ? body.categories : body.category;
      const catArray = Array.isArray(catInput) ? catInput : [catInput];
      let categoryIds = [];
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
      product.categories = categoryIds;
    }

    if (body.brand !== undefined || body.brands !== undefined) {
      const brandInput = body.brand !== undefined ? body.brand : body.brands;
      const brandArray = Array.isArray(brandInput) ? brandInput : [brandInput];
      let brandDids = [];
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
      product.brand = brandDids;
    }

    if (product.type === "variant") {
      if (body.variants !== undefined) {
        product.variants = Array.isArray(body.variants)
          ? body.variants.map((v, i) => {
              const existing = (product.variants || []).find((ev) => ev.size === v.size) || product.variants?.[i] || {};
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
        if (body.stockStatus === undefined && product.variants.length > 0) {
          const anyInStock = product.variants.some((v) => v.stockStatus === "instock");
          product.stockStatus = anyInStock ? "instock" : "outofstock";
        }
      }
      product.price = undefined;
      product.offerPrice = undefined;
      product.sku = undefined;
    } else {
      if (body.price !== undefined) product.price = Number(body.price);
      if (body.offerPrice !== undefined)
        product.offerPrice =
          body.offerPrice !== null ? Number(body.offerPrice) : null;
      if (body.sku !== undefined) product.sku = body.sku;
      product.variants = undefined;
    }

    if (body.metaData !== undefined) {
      product.metaData = {
        metaTitle: body.metaData.metaTitle || "",
        metaDescription: body.metaData.metaDescription || "",
        keywords: Array.isArray(body.metaData.keywords)
          ? body.metaData.keywords
          : [],
        ogImage: body.metaData.ogImage || "",
      };
    }

    await product.save();
    const populatedProduct = await ProductModel.findById(product._id)
      .populate("categories")
      .lean();

    res.json({ status: "success", data: serializeProduct(populatedProduct || product) });
  } catch (err) {
    next(err);
  }
};

// Deletes a product by ID, DID, or slug
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId
      ? { $or: [{ _id: id }, { slug: id }, { did: id }] }
      : { $or: [{ slug: id }, { did: id }] };
    const result = await ProductModel.deleteOne(filter);
    if (result.deletedCount === 0) {
      res.status(404).json({ status: "error", message: "Product not found" });
      return;
    }
    res.json({ status: "success", message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
};
