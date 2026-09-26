import { AttributeModel } from "../../common/models/attribute.model.js";
import { UserModel } from "../../common/models/user.model.js";
import { logger } from "../../common/config/logger.js";

const DEFAULT_ATTRIBUTES = [
  {
    name: "Size",
    slug: "size",
    values: [
      { name: "XS", slug: "xs" },
      { name: "S", slug: "s" },
      { name: "M", slug: "m" },
      { name: "L", slug: "l" },
      { name: "XL", slug: "xl" },
      { name: "XXL", slug: "xxl" },
      { name: "2XL", slug: "2xl" },
      { name: "3XL", slug: "3xl" },
    ],
  },
  {
    name: "Color",
    slug: "color",
    values: [
      { name: "Black", slug: "black", color: "#000000" },
      { name: "White", slug: "white", color: "#ffffff" },
      { name: "Navy", slug: "navy", color: "#001f3f" },
      { name: "Olive", slug: "olive", color: "#3d9970" },
      { name: "Beige", slug: "beige", color: "#f5f5dc" },
      { name: "Charcoal", slug: "charcoal", color: "#36454f" },
      { name: "Grey", slug: "grey", color: "#aaaaaa" },
      { name: "Red", slug: "red", color: "#ff4136" },
    ],
  },
];

const STANDARD_SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL"];

// Sorts attribute values by standard size order for size attribute, or alphabetically
const sortAttributeValues = (values = [], attrSlug = "") => {
  if (!Array.isArray(values)) return [];
  if (String(attrSlug).toLowerCase() === "size") {
    return [...values].sort((a, b) => {
      const nameA = String(typeof a === "string" ? a : (a?.name || a?.slug || "")).toUpperCase();
      const nameB = String(typeof b === "string" ? b : (b?.name || b?.slug || "")).toUpperCase();
      const idxA = STANDARD_SIZE_ORDER.indexOf(nameA);
      const idxB = STANDARD_SIZE_ORDER.indexOf(nameB);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
    });
  }
  return [...values].sort((a, b) => {
    const valA = typeof a === "string" ? a : (a?.name || a?.size || "");
    const valB = typeof b === "string" ? b : (b?.name || b?.size || "");
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
  });
};

// Returns a list of all attribute groups and auto-seeds standard groups if empty
export const getAttributes = async (req, res) => {
  try {
    let attributes = await AttributeModel.find().lean();
    if (attributes.length === 0) {
      const adminUser = await UserModel.findOne({}).lean();
      const defaultUserId = adminUser?._id || req.user?._id || "66af9b0d9c49d21c988a6d66";
      const seedDocs = DEFAULT_ATTRIBUTES.map((attr) => ({
        ...attr,
        createdBy: defaultUserId,
      }));
      await AttributeModel.insertMany(seedDocs);
      attributes = await AttributeModel.find().lean();
    }
    const sorted = attributes.map((attr) => ({
      ...attr,
      values: sortAttributeValues(attr.values || [], attr.slug),
    }));
    res.json({ status: "success", data: sorted });
  } catch (err) {
    logger.error({ err }, "Failed to fetch attributes");
    res.status(500).json({ status: "error", message: "Unable to fetch attributes" });
  }
};

/**
 * POST /api/v1/dashboard/attributes
 * Creates a new attribute group.
 */
export const createAttribute = async (req, res) => {
  try {
    const { name, slug, values } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ status: "error", message: "Name and slug are required" });
    }

    const exists = await AttributeModel.findOne({ slug });
    if (exists) {
      return res.status(400).json({ status: "error", message: "Attribute slug already exists" });
    }

    const sortedValues = sortAttributeValues(values || []);

    const attribute = new AttributeModel({
      name,
      slug,
      values: sortedValues,
      createdBy: req.body.createdBy || req.user?._id || req.user?.id || "66af9b0d9c49d21c988a6d66",
    });

    await attribute.save();
    res.status(201).json({ status: "success", data: attribute });
  } catch (err) {
    logger.error({ err }, "Failed to create attribute");
    res.status(500).json({ status: "error", message: "Unable to create attribute" });
  }
};

/**
 * PUT /api/v1/dashboard/attributes/:id
 * Updates an existing attribute group.
 */
export const updateAttribute = async (req, res) => {
  const { id } = req.params;
  try {
    const { name, slug, values } = req.body;

    const attribute = await AttributeModel.findById(id);
    if (!attribute) {
      return res.status(404).json({ status: "error", message: "Attribute not found" });
    }

    if (name) attribute.name = name;
    if (slug) attribute.slug = slug;
    if (values !== undefined) {
      attribute.values = sortAttributeValues(values);
    }

    attribute.updatedBy = req.body.updatedBy || req.user?._id || req.user?.id || "66af9b0d9c49d21c988a6d66";
    await attribute.save();

    res.json({ status: "success", data: attribute });
  } catch (err) {
    logger.error({ err }, "Failed to update attribute");
    res.status(500).json({ status: "error", message: "Unable to update attribute" });
  }
};

/**
 * DELETE /api/v1/dashboard/attributes/:id
 * Deletes an attribute group.
 */
export const deleteAttribute = async (req, res) => {
  const { id } = req.params;
  try {
    const attribute = await AttributeModel.findByIdAndDelete(id);
    if (!attribute) {
      return res.status(404).json({ status: "error", message: "Attribute not found" });
    }
    res.json({ status: "success", message: "Attribute deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete attribute");
    res.status(500).json({ status: "error", message: "Unable to delete attribute" });
  }
};
