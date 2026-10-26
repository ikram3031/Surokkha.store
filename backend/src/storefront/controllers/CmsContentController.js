import { CMSContentModel } from "../../common/models/cmsContent.model.js";

// GET /api/v1/cms-content?type=slider&page=home&site=shop
export const getPublicCmsContent = async (req, res) => {
  try {
    const type = String(req.query.type || "slider").toLowerCase();
    const page = String(req.query.page || "home").toLowerCase();
    const site = req.query.site === "store" ? "store" : "shop";
    const doc = await CMSContentModel.findOne({ type, page, site, isActive: true })
      .sort({ updatedAt: -1 })
      .select("-createdBy -updatedBy")
      .lean();
    if (!doc) return res.json({ status: "success", data: null });
    doc.items = (doc.items || []).filter((i) => i.isActive !== false).sort((a, b) => a.order - b.order);
    res.json({ status: "success", data: doc });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to retrieve content" });
  }
};
