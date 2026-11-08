import { CMSContentModel } from "../../common/models/cmsContent.model.js";
import { getStoreMetaPixelConfig } from "../../common/services/facebookCapi.service.js";

// Browser pixel settings saved in the dashboard (Settings > Meta Pixel > Store). Never exposes the CAPI token.
const getPublicStorePixel = async () => {
  try {
    const meta = await getStoreMetaPixelConfig();
    const enabled = meta.isEnabled !== false && meta.enableBrowserPixel !== false;
    return { pixelId: enabled ? meta.pixelId || "" : "", enabled };
  } catch {
    return null;
  }
};

// GET /store/v1/site-config : everything the storefront needs before it first renders (CMS-driven content)
export const getSiteConfig = async (req, res) => {
  try {
    const [sectionBgDoc, metaPixel] = await Promise.all([
      CMSContentModel.findOne({
        type: "section-bg",
        page: "home",
        site: "store",
        isActive: true,
      })
        .sort({ updatedAt: -1 })
        .select("items updatedAt")
        .lean(),
      getPublicStorePixel(),
    ]);

    // { "categories": "/uploads/cms/categories.webp?v=...", "safe-use": "..." }
    const sectionBackgrounds = Object.fromEntries(
      (sectionBgDoc?.items || [])
        .filter((i) => i.isActive !== false && i.badge && i.image)
        .map((i) => [i.badge, i.image]),
    );

    res.set("Cache-Control", "public, max-age=60");
    res.json({ status: "success", data: { cms: { sectionBackgrounds }, metaPixel } });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to load site config" });
  }
};
