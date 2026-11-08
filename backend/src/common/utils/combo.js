import mongoose from "mongoose";
import { ProductModel } from "../models/product.model.js";
import { ItemModel } from "../models/item.model.js";
import { CategoryModel } from "../models/category.model.js";
import { BrandModel } from "../models/brand.model.js";
import { StockItemModel } from "../models/stockItem.model.js";

// Group products (combos): fixed pieces sold together with one discount on the whole set

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const DISCOUNT_TYPES = ["none", "percentage", "fixed"];
const isObjectId = (v) => typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);

export const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Pieces total, the discount on it and the price the customer pays
export const comboTotals = (pieces = [], discountType = "none", discountValue = 0) => {
  const total = round2(pieces.reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0), 0));
  const value = Math.max(0, Number(discountValue) || 0);
  let discount = 0;
  if (discountType === "percentage") discount = round2((total * Math.min(value, 100)) / 100);
  else if (discountType === "fixed") discount = round2(Math.min(value, total));
  return { total, discount, price: round2(total - discount), pieceCount: pieces.reduce((s, p) => s + (Number(p.quantity) || 0), 0) };
};

// Validates a dashboard payload; returns { errors, normalized }
export const normalizeComboPayload = (body = {}) => {
  const errors = [];
  const name = String(body.name || "").trim();
  if (!name) errors.push("Name is required.");
  const slug = slugify(body.slug || name);
  if (!slug) errors.push("Slug is required.");

  const pieces = [];
  for (const raw of Array.isArray(body.pieces) ? body.pieces : []) {
    const pieceName = String(raw?.name || "").trim();
    if (!pieceName) continue;
    const source = ["stock", "product", "item"].includes(raw?.source) && isObjectId(String(raw?.refId || "")) ? raw.source : "custom";
    const quantity = Math.round(Number(raw?.quantity));
    const unitPrice = Number(raw?.unitPrice);
    if (!(quantity >= 1)) errors.push(`"${pieceName}" needs at least 1 piece.`);
    if (!(unitPrice >= 0) || raw?.unitPrice === "" || raw?.unitPrice === null || raw?.unitPrice === undefined) errors.push(`Enter a price per piece for "${pieceName}".`);
    pieces.push({
      source,
      refId: source === "custom" ? null : String(raw.refId),
      name: pieceName.slice(0, 160),
      size: String(raw?.size || "").trim().slice(0, 60),
      quantity: quantity >= 1 ? quantity : 1,
      unitPrice: unitPrice >= 0 ? round2(unitPrice) : 0,
      imageUrl: String(raw?.imageUrl || "").trim(),
    });
  }
  if (pieces.length === 0) errors.push("Add at least one piece to the group.");

  const discountType = DISCOUNT_TYPES.includes(body.discountType) ? body.discountType : "none";
  const discountValue = discountType === "none" ? 0 : Math.max(0, Number(body.discountValue) || 0);
  const totals = comboTotals(pieces, discountType, discountValue);
  if (discountType === "percentage" && discountValue > 100) errors.push("Percentage discount cannot be more than 100%.");
  if (discountType === "fixed" && discountValue > totals.total) errors.push(`Discount (৳${discountValue}) is more than the pieces total (৳${totals.total}).`);

  return {
    errors,
    normalized: {
      name,
      slug,
      description: String(body.description || "").trim(),
      imageUrl: String(body.imageUrl || "").trim(),
      isActive: body.isActive !== false,
      sku: String(body.sku || "").trim(),
      categories: body.categories,
      brand: body.brand ?? body.brands,
      pieces,
      discountType,
      discountValue,
      totals,
    },
  };
};

// Category ObjectIds from slugs / dids / ids; an empty list falls back to the "Combo" category (created once)
export const resolveComboCategories = async (input) => {
  const list = (Array.isArray(input) ? input : input ? [input] : []).map((c) => (typeof c === "object" && c ? c._id || c.id || c.did || c.slug : c)).filter(Boolean).map(String);
  const ids = [];
  for (const val of list) {
    if (isObjectId(val)) ids.push(val);
    else {
      const found = await CategoryModel.findOne({ $or: [{ slug: val }, { did: val }] }).select("_id").lean();
      if (found) ids.push(String(found._id));
    }
  }
  if (ids.length) return [...new Set(ids)];
  let combo = await CategoryModel.findOne({ $or: [{ slug: "combo" }, { name: /^combo$/i }] }).select("_id").lean();
  if (!combo) {
    try {
      combo = await CategoryModel.create({ name: "Combo", slug: "combo", description: "Group products sold as a set" });
    } catch (err) {
      combo = await CategoryModel.findOne({ slug: "combo" }).select("_id").lean();
    }
  }
  return combo ? [String(combo._id)] : [];
};

// Brand dids from slugs / dids / ids
export const resolveComboBrands = async (input) => {
  const list = (Array.isArray(input) ? input : input ? [input] : []).map((b) => (typeof b === "object" && b ? b.did || b.slug || b._id || b.id : b)).filter(Boolean).map(String);
  const dids = [];
  for (const val of list) {
    const found = await BrandModel.findOne({ $or: [{ did: val }, { slug: val }, ...(isObjectId(val) ? [{ _id: val }] : [])] }).select("did").lean();
    if (found) dids.push(found.did);
  }
  return [...new Set(dids)];
};

// Normalized payload -> Item fields; combos stay off the website and the Meta catalog for now
export const toComboItemFields = (n, categories, brand) => ({
  name: n.name,
  slug: n.slug,
  description: n.description,
  imageUrl: n.imageUrl || n.pieces.find((p) => p.imageUrl)?.imageUrl || "",
  isActive: n.isActive,
  sku: n.sku || undefined,
  type: "combo",
  excludeFromMetaCatalog: true,
  stockStatus: "instock",
  price: n.totals.total,
  offerPrice: n.totals.discount > 0 ? n.totals.price : null,
  categories,
  brand,
  combo: { pieces: n.pieces, discountType: n.discountType, discountValue: n.discountValue },
});

// Live state of every catalog piece (name, stock, active), keyed by "source:refId"
export const loadComboPieceRefs = async (combos = []) => {
  const productIds = new Set();
  const itemIds = new Set();
  const stockIds = new Set();
  combos.forEach((c) => (c?.combo?.pieces || []).forEach((p) => {
    if (!p.refId) return;
    if (p.source === "product") productIds.add(String(p.refId));
    if (p.source === "item") itemIds.add(String(p.refId));
    if (p.source === "stock") stockIds.add(String(p.refId));
  }));
  const fields = "name type stockStatus stockAmount isActive variants.size variants.stockStatus";
  const [products, items, stock] = await Promise.all([
    productIds.size ? ProductModel.find({ _id: { $in: [...productIds] } }).select(fields).lean() : [],
    itemIds.size ? ItemModel.find({ _id: { $in: [...itemIds] } }).select(fields).lean() : [],
    stockIds.size ? StockItemModel.find({ _id: { $in: [...stockIds] } }).select("shortName name unit quantity isActive").lean() : [],
  ]);
  const map = new Map();
  products.forEach((d) => map.set(`product:${d._id}`, d));
  items.forEach((d) => map.set(`item:${d._id}`, d));
  stock.forEach((d) => map.set(`stock:${d._id}`, d));
  return map;
};

// Why a catalog piece can't be sold right now, or null when it can
export const pieceProblem = (piece, ref) => {
  if (piece.source === "custom" || !piece.refId) return null;
  if (piece.source === "stock") {
    if (!ref) return "removed from inventory";
    if (ref.isActive === false) return "not active";
    return Number(ref.quantity) <= 0 ? "out of stock" : null;
  }
  if (!ref) return "removed from the catalog";
  if (ref.isActive === false) return "not active";
  if (ref.type === "variant" && piece.size) {
    const v = (ref.variants || []).find((x) => String(x.size).toLowerCase() === String(piece.size).toLowerCase());
    if (!v) return `size ${piece.size} no longer exists`;
    if (v.stockStatus === "outofstock") return "out of stock";
    return null;
  }
  if (ref.stockStatus === "outofstock") return "out of stock";
  return null;
};

// Soft warning when fewer pieces are left than one combo needs
export const pieceWarning = (piece, ref) => {
  if (piece.source !== "stock" || !ref) return null;
  const left = Number(ref.quantity) || 0;
  return left > 0 && left < Number(piece.quantity) ? `only ${left} left` : null;
};

// Combo item -> dashboard shape with totals and the live state of each piece
export const serializeCombo = (doc, refs = new Map()) => {
  const o = doc?.toObject ? doc.toObject() : doc;
  const c = o.combo || {};
  const pieces = (c.pieces || []).map((p) => {
    const ref = p.refId ? refs.get(`${p.source}:${p.refId}`) : null;
    return {
      source: p.source,
      refId: p.refId ? String(p.refId) : null,
      name: p.name,
      size: p.size || "",
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      imageUrl: p.imageUrl || "",
      lineTotal: round2(p.quantity * p.unitPrice),
      stockAmount: p.source === "stock" && ref ? Number(ref.quantity) || 0 : null,
      problem: pieceProblem(p, ref),
      warning: pieceWarning(p, ref),
    };
  });
  const totals = comboTotals(pieces, c.discountType, c.discountValue);
  const categories = (o.categories || []).map((cat) => (cat && typeof cat === "object" ? { id: String(cat._id || cat.id), name: cat.name, slug: cat.slug, did: cat.did } : { id: String(cat) }));
  return {
    id: String(o._id || o.id),
    did: o.did,
    name: o.name,
    slug: o.slug,
    sku: o.sku || "",
    description: o.description || "",
    imageUrl: o.imageUrl || "",
    isActive: o.isActive !== false,
    categories,
    brand: o.brand || [],
    discountType: c.discountType || "none",
    discountValue: c.discountValue || 0,
    pieces,
    ...totals,
    available: pieces.every((p) => !p.problem),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
};

// Pieces a combo order line takes out of stock: inventory and catalog pieces (not custom), quantity × lines ordered
export const comboStockPieces = (comboDoc, linesOrdered) =>
  (comboDoc?.combo?.pieces || [])
    .filter((p) => p.source !== "custom" && p.refId && mongoose.Types.ObjectId.isValid(String(p.refId)))
    .map((p) => ({ entity: p.source === "stock" ? "stockItem" : p.source === "item" ? "item" : "product", refId: p.refId, name: p.name, size: p.size || "", quantity: (Number(p.quantity) || 0) * (Number(linesOrdered) || 0) }));
