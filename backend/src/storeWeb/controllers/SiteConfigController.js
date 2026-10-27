import { CMSContentModel } from "../../common/models/cmsContent.model.js";

// GET /store/v1/site-config : everything the storefront needs before it first renders (CMS-driven content)
export const getSiteConfig = async (req, res) => {
  try {
    const sectionBgDoc = await CMSContentModel.findOne({
      type: "section-bg",
      page: "home",
      site: "store",
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .select("items updatedAt")
      .lean();

    // { "categories": "/uploads/cms/categories.webp?v=...", "safe-use": "..." }
    const sectionBackgrounds = Object.fromEntries(
      (sectionBgDoc?.items || [])
        .filter((i) => i.isActive !== false && i.badge && i.image)
        .map((i) => [i.badge, i.image]),
    );

    res.set("Cache-Control", "public, max-age=60");
    res.json({ status: "success", data: { cms: { sectionBackgrounds } } });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to load site config" });
  }
};
