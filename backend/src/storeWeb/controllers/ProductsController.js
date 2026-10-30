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
    const lang = queryOptions?.lang || (req.headers["accept-language"]?.includes("bn") ? "bn" : "en");
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
      data: await attachBrandNames(products.map((p) => serializeProduct(p, lang, "product"))),
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
    const lang = req.query.lang || (req.headers["accept-language"]?.includes("bn") ? "bn" : "en");
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
      data: await attachBrandNames(serializeProduct(product, lang, "product")),
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
    res.setHeader('Content-Disposition', 'inline; filename="meta_catalog_feed.csv"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

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
    
    const pathLower = (req.path || '').toLowerCase();
    const querySite = (req.query?.site || '').toLowerCase().trim();
    let targetSite = 'shop';
    if (querySite === 'store' || pathLower.includes('-store') || pathLower.includes('store')) {
      targetSite = 'store';
    } else if (querySite === 'shop' || pathLower.includes('-shop')) {
      targetSite = 'shop';
    }

    const siteConfig = config.sites?.[targetSite] || (targetSite === 'store' ? config.sites?.store : config.sites?.shop);
    const defaultSiteUrl = targetSite === 'store' ? 'https://surokkha.store' : 'https://surokkha.shop';
    const defaultBrandName = targetSite === 'store' ? 'Surokkha Store' : 'Surokkha Shop';
    const baseSiteUrl = (siteConfig?.url || siteConfig?.storefrontUrl || (siteConfig?.domain ? `https://${siteConfig.domain}` : defaultSiteUrl)).replace(/\/$/, '');
    const brandName = siteConfig?.name || defaultBrandName;

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

      const link = targetSite === 'store'
        ? `${baseSiteUrl}/product/${p.slug}`
        : `${baseSiteUrl}/shop/${catSlug || 'contraceptive'}/${p.slug}`;
      const resolveImage = (url) => (url ? (url.startsWith('http') ? url : `${config.apiBaseUrl || 'https://api.' + (config.domain || 'localhost')}${url}`) : '');
      const imageLink = resolveImage(p.imageUrl);
      const productType = 'Product';
      const gender = 'unisex';
      const ageGroup = 'adult';

      const buildRow = ({ rowId, rowTitle, rowAvailability, rowImage, numPrice, numOfferPrice, quantity, groupId, size }) => [
        rowId,
        `"${rowTitle}"`,
        description,
        rowAvailability,
        condition,
        link,
        rowImage,
        brandName,
        `${numPrice.toFixed(2)} BDT`,
        '', // google_product_category
        '', // fb_product_category
        productType,
        quantity,
        numOfferPrice ? `${numOfferPrice.toFixed(2)} BDT` : '',
        '', // sale_price_effective_date
        groupId, // item_group_id
        gender,
        '', // color
        size ? `"${size}"` : '', // size
        ageGroup,
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
      ];

      const offerOf = (price, offer) => (offer != null && Number(offer) > 0 && Number(offer) < price ? Number(offer) : null);
      const defaultQty = p.stockAmount && p.stockAmount > 0 ? p.stockAmount : 150;

      if (p.type === 'variant' && Array.isArray(p.variants) && p.variants.length > 0) {
        // One row per variant, grouped by item_group_id so Meta shows them as variations
        const multi = p.variants.length > 1;
        p.variants.forEach((v, idx) => {
          const numPrice = Number(v.price || 0);
          const vName = String(v.size || v.name || v.label || `Option ${idx + 1}`).replace(/"/g, '""');
          const vOut = isOut || v.stockStatus === 'outofstock' || v.stockStatus === 'out_of_stock';
          const vQty = Number(v.stockAmount) > 0 ? Number(v.stockAmount) : defaultQty;
          const vRow = buildRow({
            rowId: multi ? `${id}-${idx + 1}` : id,
            rowTitle: multi ? `${title} - ${vName}` : title,
            rowAvailability: vOut ? 'out of stock' : 'in stock',
            rowImage: resolveImage(v.imageUrl) || imageLink,
            numPrice,
            numOfferPrice: offerOf(numPrice, v.offerPrice),
            quantity: vQty,
            groupId: multi ? id : '',
            size: multi ? vName : '',
          });
          csvData += vRow.join(',') + '\n';
        });
        return;
      }

      const numPrice = Number(p.price || p.regularPrice || 0);
      const row = buildRow({
        rowId: id,
        rowTitle: title,
        rowAvailability: availability,
        rowImage: imageLink,
        numPrice,
        numOfferPrice: offerOf(numPrice, p.offerPrice),
        quantity: defaultQty,
        groupId: '',
        size: '',
      });

      csvData += row.join(',') + '\n';
    });
    
    res.send(csvData);
  } catch (err) {
    next(err);
  }
};
