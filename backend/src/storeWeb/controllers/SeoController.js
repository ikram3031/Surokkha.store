import { ProductModel } from "../../common/models/product.model.js";
import { ItemModel } from "../../common/models/item.model.js";
import { CategoryModel } from "../../common/models/category.model.js";
import { logger } from "../../common/config/logger.js";
import { escapeXml } from "../../common/services/blog.service.js";

// Public origin of the store; every sitemap URL points here
const STORE_SITE_URL = String(process.env.STORE_SITE_URL || "https://surokkhastore.shop").replace(/\/+$/, "");

// Formats one <url> entry for a sitemap
const urlEntry = (path, lastmod) =>
  `  <url>\n    <loc>${escapeXml(`${STORE_SITE_URL}${path}`)}</loc>\n    <lastmod>${new Date(lastmod || Date.now()).toISOString()}</lastmod>\n  </url>`;

// GET /store/v1/seo/sitemap-catalog.xml — active products, items, group offers and categories
export const getCatalogSitemap = async (_req, res) => {
  try {
    const [products, items, categories] = await Promise.all([
      ProductModel.find({ isActive: true }).select("slug type updatedAt").lean(),
      ItemModel.find({ isActive: true }).select("slug type updatedAt").lean(),
      CategoryModel.find({ isActive: { $ne: false } }).select("slug updatedAt").lean(),
    ]);

    const seen = new Set();
    const entries = [];
    const add = (path, lastmod) => {
      if (seen.has(path)) return;
      seen.add(path);
      entries.push(urlEntry(path, lastmod));
    };

    categories.forEach((c) => c.slug && add(`/category/${encodeURIComponent(c.slug)}`, c.updatedAt));
    [...products, ...items].forEach((p) => {
      if (!p.slug) return;
      const base = p.type === "group" ? "/group-offer" : "/product";
      add(`${base}/${encodeURIComponent(p.slug)}`, p.updatedAt);
    });

    res.setHeader("Cache-Control", "public, max-age=3600");
    res
      .type("application/xml")
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`);
  } catch (err) {
    logger.error({ err }, "Failed to build catalog sitemap");
    res.status(500).type("text/plain").send("Unable to build sitemap");
  }
};
