import { config } from "../../common/config/index.js";
import { ProductModel } from "../../common/models/product.model.js";
import {
  serializeProduct,
  attachBrandNames,
  buildProductFilter,
  buildProductSort,
  parsePagination,
} from "../../common/utils/productUtils.js";

// Lists products matching filter, pagination, and sorting criteria for storefront customers
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

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({
      status: "success",
      data: await attachBrandNames(products.map((p) => serializeProduct(p, "en", "product"))),
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

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({
      status: "success",
      data: await attachBrandNames(serializeProduct(product, "en", "product")),
    });
  } catch (err) {
    next(err);
  }
};

// Dynamically generates and returns a CSV file for Meta Commerce Manager Catalog Feed
export const getMetaCatalogCsv = async (req, res, next) => {
  try {
    const products = await ProductModel.find({
      isActive: true,
      excludeFromMetaCatalog: { $ne: true }
    })
      .populate("categories")
      .lean();
    
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
    
    const reqSiteKey = String(req.query.site || req.query.siteKey || (req.headers.host?.includes('shop') ? 'shop' : 'store')).toLowerCase();
    const siteConfig = config.sites?.[reqSiteKey];
    const baseSiteUrl = (siteConfig?.url || siteConfig?.storefrontUrl || (siteConfig?.domain ? `https://${siteConfig.domain}` : config.storefrontUrl || 'https://' + (config.domain || 'localhost'))).replace(/\/$/, '');
    const brandName = config.brandName || 'Surokkha';

    // Construct rows
    products.forEach((p) => {
      const id = p.did || String(p._id);
      const title = p.name ? p.name.replace(/"/g, '""') : '';
      const cleanDesc = (p.description || '').replace(/<[^>]*>/g, '').replace(/"/g, '""');
      const description = cleanDesc ? `"${cleanDesc}"` : '""';
      const isOut = p.stockStatus === 'outofstock' || p.stockStatus === 'out_of_stock' || (p.type === 'simple' && p.stockAmount === 0);
      const availability = isOut ? 'out of stock' : 'in stock';
      const condition = 'new';
      
      // Resolve category slug safely from populated categories or category field
      let rawCatSlug = 'contraceptive';
      if (Array.isArray(p.categories) && p.categories.length > 0 && p.categories[0]) {
        rawCatSlug = p.categories[0].slug || p.categories[0].name || rawCatSlug;
      } else if (p.category && typeof p.category === 'object') {
        rawCatSlug = p.category.slug || p.category.name || rawCatSlug;
      } else if (typeof p.category === 'string') {
        rawCatSlug = p.category;
      }

      const catSlug = String(rawCatSlug || 'contraceptive')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-');

      const link = `${baseSiteUrl}/shop/${catSlug || 'contraceptive'}/${p.slug}`;
      const imageLink = p.imageUrl ? (p.imageUrl.startsWith('http') ? p.imageUrl : `${config.apiBaseUrl || 'https://api.' + (config.domain || 'localhost')}${p.imageUrl}`) : '';
      
      // Price calculation: Simple product or Variant lowest/first variant price
      let numPrice = 0;
      let numOfferPrice = null;

      if (p.type === 'variant' && Array.isArray(p.variants) && p.variants.length > 0) {
        const firstVariant = p.variants[0];
        numPrice = Number(firstVariant.price || 0);
        if (firstVariant.offerPrice != null && Number(firstVariant.offerPrice) > 0 && Number(firstVariant.offerPrice) < numPrice) {
          numOfferPrice = Number(firstVariant.offerPrice);
        }
      } else {
        numPrice = Number(p.price || p.regularPrice || 0);
        if (p.offerPrice != null && Number(p.offerPrice) > 0 && Number(p.offerPrice) < numPrice) {
          numOfferPrice = Number(p.offerPrice);
        }
      }

      const price = `${numPrice.toFixed(2)} BDT`;
      const salePrice = numOfferPrice ? `${numOfferPrice.toFixed(2)} BDT` : '';
      const quantity = p.stockAmount && p.stockAmount > 0 ? p.stockAmount : 150;
      const productType = 'Product';
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
        brandName,
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
