import { ItemModel } from "../../common/models/item.model.js";
import {
  normalizeComboPayload,
  resolveComboCategories,
  resolveComboBrands,
  toComboItemFields,
  loadComboPieceRefs,
  serializeCombo,
} from "../../common/utils/combo.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const fail = (res, code, message, errors) => res.status(code).json({ status: "error", message, ...(errors ? { errors } : {}) });

// Finds a combo by Mongo id, did or slug
const findCombo = (id) =>
  ItemModel.findOne({ type: "combo", $or: [...(/^[0-9a-fA-F]{24}$/.test(id) ? [{ _id: id }] : []), { did: id }, { slug: id }] });

// First free slug: "x", "x-2", "x-3"…, ignoring the combo being edited
const freeSlug = async (base, exceptId) => {
  let slug = base;
  for (let n = 2; await ItemModel.exists({ slug, ...(exceptId ? { _id: { $ne: exceptId } } : {}) }); n += 1) slug = `${base}-${n}`;
  return slug;
};

// GET /combos — group products with totals and live piece stock; ?search=, ?status=active|inactive|all
export const listCombos = async (req, res, next) => {
  try {
    const filter = { type: "combo" };
    const status = String(req.query.status || "all");
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;
    const search = String(req.query.search || "").trim();
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: rx }, { slug: rx }, { sku: rx }, { "combo.pieces.name": rx }];
    }
    const docs = await ItemModel.find(filter).sort({ createdAt: -1 }).populate("categories").lean();
    const refs = await loadComboPieceRefs(docs);
    return res.json({ status: "success", data: docs.map((d) => serializeCombo(d, refs)) });
  } catch (error) {
    next(error);
  }
};

// GET /combos/:id
export const getCombo = async (req, res, next) => {
  try {
    const doc = await findCombo(req.params.id).populate("categories").lean();
    if (!doc) return fail(res, 404, "Group product not found.");
    const refs = await loadComboPieceRefs([doc]);
    return res.json({ status: "success", data: serializeCombo(doc, refs) });
  } catch (error) {
    next(error);
  }
};

// Validates the body and builds the Item fields shared by create and update
const buildFields = async (body, exceptId) => {
  const { errors, normalized } = normalizeComboPayload(body);
  if (errors.length) return { errors };
  normalized.slug = await freeSlug(normalized.slug, exceptId);
  const categories = await resolveComboCategories(normalized.categories);
  const brand = await resolveComboBrands(normalized.brand);
  return { fields: toComboItemFields(normalized, categories, brand) };
};

// POST /combos
export const createCombo = async (req, res, next) => {
  try {
    const { errors, fields } = await buildFields(req.body || {});
    if (errors) return fail(res, 400, errors.join(" "), errors);
    const doc = await ItemModel.create(fields);
    const fresh = await ItemModel.findById(doc._id).populate("categories").lean();
    const refs = await loadComboPieceRefs([fresh]);
    return res.status(201).json({ status: "success", data: serializeCombo(fresh, refs) });
  } catch (error) {
    if (error?.code === 11000) return fail(res, 409, "That slug or SKU is already used.");
    next(error);
  }
};

// PUT /combos/:id — replaces the pieces, discount and details
export const updateCombo = async (req, res, next) => {
  try {
    const existing = await findCombo(req.params.id);
    if (!existing) return fail(res, 404, "Group product not found.");
    const { errors, fields } = await buildFields(req.body || {}, existing._id);
    if (errors) return fail(res, 400, errors.join(" "), errors);
    existing.set(fields);
    if (!fields.sku) existing.sku = undefined;
    await existing.save();
    const fresh = await ItemModel.findById(existing._id).populate("categories").lean();
    const refs = await loadComboPieceRefs([fresh]);
    return res.json({ status: "success", data: serializeCombo(fresh, refs) });
  } catch (error) {
    if (error?.code === 11000) return fail(res, 409, "That slug or SKU is already used.");
    next(error);
  }
};

// PATCH /combos/:id/active — quick on/off from the list
export const setComboActive = async (req, res, next) => {
  try {
    const doc = await findCombo(req.params.id);
    if (!doc) return fail(res, 404, "Group product not found.");
    doc.isActive = req.body?.isActive !== false;
    await doc.save();
    return res.json({ status: "success", data: { id: String(doc._id), isActive: doc.isActive } });
  } catch (error) {
    next(error);
  }
};

// DELETE /combos/:id — past orders keep their own copy of the line, so nothing else changes
export const deleteCombo = async (req, res, next) => {
  try {
    const doc = await findCombo(req.params.id);
    if (!doc) return fail(res, 404, "Group product not found.");
    await doc.deleteOne();
    return res.json({ status: "success", message: "Group product deleted." });
  } catch (error) {
    next(error);
  }
};
