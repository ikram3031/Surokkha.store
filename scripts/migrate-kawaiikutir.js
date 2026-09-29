import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { CategoryModel } from "../backend/src/common/models/category.model.js";
import { ProductModel } from "../backend/src/common/models/product.model.js";
import { MemberModel } from "../backend/src/common/models/member.model.js";
import { OrderModel } from "../backend/src/common/models/order.model.js";
import { CouponModel } from "../backend/src/common/models/coupon.model.js";
import { UserModel } from "../backend/src/common/models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Decodes HTML entities commonly found in WordPress text
const decodeHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/<[^>]*>?/gm, "")
    .trim();
};

// Generates fallback did if generateDid is not directly imported
const createDid = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Maps raw WooCommerce order status to internal platform order status
const mapOrderStatus = (status) => {
  switch (status) {
    case "completed":
      return "completed";
    case "cancelled":
    case "failed":
    case "refunded":
      return "cancelled";
    case "shipped":
      return "shipped";
    case "processing":
    case "pending":
    case "on-hold":
    default:
      return "processing";
  }
};

// Converts the raw WooCommerce dump into platform-ready documents
export const transformKawaiiKutirData = (dump, adminUserId) => {
  const categoryMap = new Map();
  const transformedCategories = dump.categories.map((c) => {
    const catId = new mongoose.Types.ObjectId();
    categoryMap.set(c.id, catId);
    return {
      _id: catId,
      name: decodeHtml(c.name),
      slug: c.slug,
      did: `CAT-${createDid()}`,
      description: decodeHtml(c.description || ""),
      imageUrl: c.image?.src || "",
      productCount: c.count || 0,
      parent: null,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    };
  });

  const transformedProducts = dump.products.map((p) => {
    const isVariable = p.type === "variable" && p.variationData && p.variationData.length > 0;
    const catRefs = p.categories.map((c) => categoryMap.get(c.id)).filter(Boolean);

    let variants = [];
    let simplePrice = null;
    let simpleOfferPrice = null;

    if (isVariable) {
      variants = p.variationData.map((v, idx) => {
        const optionLabel = v.attributes && v.attributes.length > 0
          ? v.attributes.map((a) => decodeHtml(a.option)).join(" - ")
          : `Option ${idx + 1}`;
        const regPrice = parseFloat(v.regular_price || v.price || "0");
        const salePrice = v.sale_price && parseFloat(v.sale_price) > 0 ? parseFloat(v.sale_price) : null;
        return {
          size: optionLabel,
          price: regPrice || parseFloat(p.price || "0"),
          offerPrice: salePrice,
          sku: v.sku || `${p.slug}-${idx + 1}`,
          sortOrder: idx,
          imageUrl: v.image?.src || p.images[0]?.src || null,
        };
      });
    } else {
      const reg = parseFloat(p.regular_price || p.price || "0");
      const sale = p.sale_price && parseFloat(p.sale_price) > 0 ? parseFloat(p.sale_price) : null;
      simplePrice = reg;
      simpleOfferPrice = sale;
    }

    const mainImage = p.images && p.images.length > 0 ? p.images[0].src : "";
    const galleryImages = p.images ? p.images.map((i) => i.src) : [];

    return {
      name: decodeHtml(p.name),
      slug: p.slug,
      did: `PRD-${createDid()}`,
      description: decodeHtml(p.short_description || p.description || p.name),
      longDescription: p.description || "",
      chargeTax: false,
      taxRate: null,
      isActive: p.status === "publish",
      type: isVariable ? "variant" : "simple",
      price: simplePrice,
      offerPrice: simpleOfferPrice,
      sku: p.sku || p.slug,
      variants,
      season: ["All-Season"],
      tags: p.tags ? p.tags.map((t) => decodeHtml(t.name)) : [],
      notes: [],
      metaData: {
        metaTitle: decodeHtml(p.name),
        metaDescription: decodeHtml(p.short_description || "").slice(0, 160),
        keywords: p.tags ? p.tags.map((t) => decodeHtml(t.name)) : [],
        ogImage: mainImage,
      },
      brand: [],
      categories: catRefs,
      imageUrl: mainImage,
      thumbnailUrl: mainImage,
      images: galleryImages,
      stockStatus: p.stock_status === "instock" ? "instock" : "outofstock",
      stockAmount: p.stock_quantity || (p.stock_status === "instock" ? 20 : 0),
      createdBy: adminUserId,
      updatedBy: adminUserId,
    };
  });

  const memberMap = new Map();
  const transformedMembers = dump.customers.map((c) => {
    const memberId = new mongoose.Types.ObjectId();
    memberMap.set(c.email.toLowerCase(), memberId);
    const fullName = `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.username || "Customer";
    return {
      _id: memberId,
      name: fullName,
      email: c.email.toLowerCase(),
      phone: c.billing?.phone || "",
      passwordHash: "$2b$10$wN1QyZqA1iU4wEwA8D0h6erqZp3M6u7C5r3O7.Y9O3h9V0b7V1q.S",
      did: `MBR-${createDid()}`,
      isActive: true,
      role: "Customer",
      isEmailVerified: true,
      billingAddress: {
        firstName: c.billing?.first_name || "",
        lastName: c.billing?.last_name || "",
        company: c.billing?.company || "",
        address1: c.billing?.address_1 || "",
        address2: c.billing?.address_2 || "",
        city: c.billing?.city || "Dhaka",
        state: c.billing?.state || "",
        postcode: c.billing?.postcode || "",
        country: c.billing?.country || "BD",
        email: c.billing?.email?.toLowerCase() || c.email.toLowerCase(),
        phone: c.billing?.phone || "",
      },
      shippingAddress: {
        firstName: c.shipping?.first_name || c.billing?.first_name || "",
        lastName: c.shipping?.last_name || c.billing?.last_name || "",
        company: c.shipping?.company || "",
        address1: c.shipping?.address_1 || c.billing?.address_1 || "",
        address2: c.shipping?.address_2 || c.billing?.address_2 || "",
        city: c.shipping?.city || c.billing?.city || "Dhaka",
        state: c.shipping?.state || "",
        postcode: c.shipping?.postcode || "",
        country: c.shipping?.country || "BD",
        email: c.shipping?.email?.toLowerCase() || c.email.toLowerCase(),
        phone: c.shipping?.phone || c.billing?.phone || "",
      },
      createdBy: adminUserId,
      updatedBy: adminUserId,
    };
  });

  const transformedOrders = dump.orders.map((o) => {
    const rawBillingName = `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim() || "Valued Customer";
    const rawShippingName = `${o.shipping?.first_name || ""} ${o.shipping?.last_name || ""}`.trim() || rawBillingName;
    const customerEmail = (o.billing?.email || "").toLowerCase();
    const matchedMemberId = memberMap.get(customerEmail) || null;

    const items = o.line_items.map((li) => {
      const unitP = parseFloat(li.price || (li.total && li.quantity ? (parseFloat(li.total) / li.quantity).toFixed(2) : "0"));
      const variationName = li.meta_data && li.meta_data.length > 0
        ? li.meta_data.map((m) => `${m.display_key || m.key}: ${m.display_value || m.value}`).join(", ")
        : "";
      return {
        name: decodeHtml(li.name),
        quantity: li.quantity || 1,
        unitPrice: isNaN(unitP) ? 0 : unitP,
        size: variationName || "Standard",
        concentration: "",
        productDid: "",
      };
    });

    const subtotal = parseFloat(o.total || "0") - parseFloat(o.shipping_total || "0");
    const shippingFee = parseFloat(o.shipping_total || "0");
    const total = parseFloat(o.total || "0");

    return {
      orderNumber: `ORD-${o.id}`,
      did: `ORD-${createDid()}`,
      status: mapOrderStatus(o.status),
      member: matchedMemberId,
      billingInfo: {
        fullName: rawBillingName,
        phone: o.billing?.phone || "01000000000",
        email: o.billing?.email || "",
        address: o.billing?.address_1 || "Dhaka, Bangladesh",
        thana: "",
        district: o.billing?.city || "Dhaka",
        zip: o.billing?.postcode || "",
      },
      shippingInfo: {
        fullName: rawShippingName,
        phone: o.shipping?.phone || o.billing?.phone || "01000000000",
        address: o.shipping?.address_1 || o.billing?.address_1 || "Dhaka, Bangladesh",
        thana: "",
        district: o.shipping?.city || o.billing?.city || "Dhaka",
        zip: o.shipping?.postcode || "",
      },
      paymentMethod: o.payment_method_title || o.payment_method || "Cash on Delivery",
      shippingTotalAmount: shippingFee,
      discountTotalAmount: parseFloat(o.discount_total || "0"),
      couponCode: o.coupon_lines && o.coupon_lines.length > 0 ? o.coupon_lines[0].code.toUpperCase() : null,
      items: items.length > 0 ? items : [{ name: "Order Item", quantity: 1, unitPrice: total, size: "Standard" }],
      totals: {
        subtotal: subtotal > 0 ? subtotal : total,
        shippingFee,
        tax: parseFloat(o.total_tax || "0"),
        total,
      },
      active: true,
      createdBy: adminUserId,
      updatedBy: adminUserId,
      createdAt: o.date_created ? new Date(o.date_created) : new Date(),
    };
  });

  const transformedCoupons = dump.coupons.map((c) => {
    const isPercent = c.discount_type === "percent" || c.discount_type === "percent_cart";
    return {
      code: c.code.toUpperCase().trim(),
      did: `CPN-${createDid()}`,
      discountType: isPercent ? "percentage" : "fixed",
      discountValue: parseFloat(c.amount || "0"),
      minOrderAmount: parseFloat(c.minimum_amount || "0"),
      validFrom: c.date_created ? new Date(c.date_created) : null,
      validTo: c.date_expires ? new Date(c.date_expires) : null,
      active: true,
      usageLimit: c.usage_limit || null,
      usedCount: c.usage_count || 0,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    };
  });

  return {
    categories: transformedCategories,
    products: transformedProducts,
    members: transformedMembers,
    orders: transformedOrders,
    coupons: transformedCoupons,
  };
};

// Main runner for direct MongoDB population
const runMigration = async () => {
  const dumpPath = path.join(rootDir, "scripts", "data", "kawaiikutir_wc_dump.json");
  const fallbackPath = "D:/APPS/.gemini/antigravity/brain/1a47ed7a-5908-424b-a485-cac289a0f9e7/scratch/kawaiikutir_wc_dump.json";

  const targetDump = fs.existsSync(dumpPath) ? dumpPath : fallbackPath;
  if (!fs.existsSync(targetDump)) {
    console.error("❌ WooCommerce dump file not found.");
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(targetDump, "utf8"));
  console.log(`📦 Loaded dump for ${dump.store.name} (${dump.store.url})`);

  const mockAdminId = new mongoose.Types.ObjectId();
  const transformed = transformKawaiiKutirData(dump, mockAdminId);

  const outDir = path.join(rootDir, "scripts", "data", "kawaiikutir");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outDir, "categories.json"), JSON.stringify(transformed.categories, null, 2));
  fs.writeFileSync(path.join(outDir, "products.json"), JSON.stringify(transformed.products, null, 2));
  fs.writeFileSync(path.join(outDir, "members.json"), JSON.stringify(transformed.members, null, 2));
  fs.writeFileSync(path.join(outDir, "orders.json"), JSON.stringify(transformed.orders, null, 2));
  fs.writeFileSync(path.join(outDir, "coupons.json"), JSON.stringify(transformed.coupons, null, 2));

  console.log("\n✅ Transformed datasets successfully saved to scripts/data/kawaiikutir/:");
  console.log(`   ├─ Categories: ${transformed.categories.length}`);
  console.log(`   ├─ Products:   ${transformed.products.length}`);
  console.log(`   ├─ Customers:  ${transformed.members.length}`);
  console.log(`   ├─ Orders:     ${transformed.orders.length}`);
  console.log(`   └─ Coupons:    ${transformed.coupons.length}`);

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && process.argv.includes("--insert-db")) {
    console.log(`\nConnecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log("Connected. Inserting documents...");

    for (const cat of transformed.categories) {
      await CategoryModel.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true });
    }
    for (const prd of transformed.products) {
      await ProductModel.findOneAndUpdate({ slug: prd.slug }, prd, { upsert: true });
    }
    for (const mbr of transformed.members) {
      await MemberModel.findOneAndUpdate({ email: mbr.email }, mbr, { upsert: true });
    }
    for (const ord of transformed.orders) {
      await OrderModel.findOneAndUpdate({ orderNumber: ord.orderNumber }, ord, { upsert: true });
    }
    for (const cpn of transformed.coupons) {
      await CouponModel.findOneAndUpdate({ code: cpn.code }, cpn, { upsert: true });
    }

    console.log("🎉 All data successfully inserted into MongoDB!");
    await mongoose.disconnect();
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration().catch(console.error);
}
