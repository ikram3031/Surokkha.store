import { config } from "../../common/config/index.js";
import { ItemModel } from "../../common/models/item.model.js";
import {
  serializeProduct,
  buildProductFilter,
  buildProductSort,
  parsePagination,
} from "../../common/utils/productUtils.js";

// Lists items matching filter, pagination, and sorting criteria for storefront customers
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

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({
      status: "success",
      data: items.map((p) => serializeProduct(p, "en", "item")),
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

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({
      status: "success",
      data: serializeProduct(item, "en", "item"),
    });
  } catch (err) {
    next(err);
  }
};

// Dynamically generates and returns a CSV file for Meta Commerce Manager Catalog Feed
export const getMetaCatalogCsv = async (req, res, next) => {
  try {
    const items = await ItemModel.find({
      isActive: true,
      excludeFromMetaCatalog: { $ne: true }
    }).lean();

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="meta_catalog_feed.csv"');

    // Define CSV header matching Facebook/Meta requirements
    const headers = [
      'id', 'title', 'description', 'availability', 'condition',
      'link', 'image_link', 'brand', 'price', 'google_product_category',
      'fb_product_category', 'product_type', 'quantity_to_sell_on_facebook',
      'sale_price', 'sale_price_effective_date', 'item_group_id', 'gender',
      'color', 'size', 'age_group', 'material', 'pattern', 'shipping',
      'shipping_weight', 'custom_label_0', 'custom_label_1', 'custom_label_2',
      'custom_label_3', 'custom_label_4', 'offer_disclaimer', 'offer_disclaimer_url',
      'video[0].url', 'video[0].tag[0]', 'gtin', 'product_tags[0]', 'product_tags[1]', 'style[0]'
    ];

    let csvData = headers.join(',') + '\n';

    // Construct rows
    items.forEach((p) => {
      const id = p.did || String(p._id);
      const title = p.name ? p.name.replace(/"/g, '""') : '';
      const description = p.description ? `"${p.description.replace(/"/g, '""')}"` : '';
      const availability = p.stockStatus === 'outofstock' ? 'out of stock' : 'in stock';
      const condition = 'new';

      const reqSiteKey = String(req.query.site || req.query.siteKey || (req.headers.host?.includes('shop') ? 'shop' : 'store')).toLowerCase();
      const siteConfig = config.sites?.[reqSiteKey];
      const baseSiteUrl = (siteConfig?.url || siteConfig?.storefrontUrl || (siteConfig?.domain ? `https://${siteConfig.domain}` : config.storefrontUrl || 'https://' + (config.domain || 'localhost'))).replace(/\/$/, '');
      const catSlug = (p.category && typeof p.category === 'object' ? (p.category.slug || p.category.name) : (p.category || 'general'))
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-');
      const link = `${baseSiteUrl}/shop/${catSlug || 'general'}/${p.slug}`;
      const imageLink = p.imageUrl ? (p.imageUrl.startsWith('http') ? p.imageUrl : `${config.apiBaseUrl || 'https://api.' + (config.domain || 'localhost')}${p.imageUrl}`) : '';

      const brand = config.brandName || 'Store';
      const price = `${(p.price || 0).toFixed(2)} BDT`;

      const salePrice = p.offerPrice ? `${p.offerPrice.toFixed(2)} BDT` : '';
      const quantity = 150; // default for catalog
      const productType = 'Item';
      const gender = 'unisex';
      const ageGroup = 'adult';

      const row = [
        id,
        `"${title}"`,
        description,
        availability,
        condition,
        link,
        imageLink,
        brand,
        price,
        '', // google_product_category
        '', // fb_product_category
        productType,
        quantity,
        salePrice,
        '', // sale_price_effective_date
        '', // item_group_id
        gender,
        '', // color
        '', // size
        ageGroup,
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
      ];

      csvData += row.join(',') + '\n';
    });

    res.send(csvData);
  } catch (err) {
    next(err);
  }
};
