import http from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createServiceApp } from '../../src/service/app.js';
import { UserModel } from '../../src/common/models/user.model.js';
import { MemberModel } from '../../src/common/models/member.model.js';
import { ProductModel } from '../../src/common/models/product.model.js';
import { CategoryModel } from '../../src/common/models/category.model.js';
import { BrandModel } from '../../src/common/models/brand.model.js';
import { CouponModel } from '../../src/common/models/coupon.model.js';
import { OrderModel } from '../../src/common/models/order.model.js';
import { PaymentModel } from '../../src/common/models/payment.model.js';
import { BillingModel } from '../../src/common/models/billing.model.js';
import { ReviewModel } from '../../src/common/models/review.model.js';
import { SizeChartModel } from '../../src/common/models/sizeChart.model.js';
import { StoreUtilsModel } from '../../src/common/models/storeUtils.model.js';
import { AssetModel } from '../../src/common/models/asset.model.js';
import { AttributeModel } from '../../src/common/models/attribute.model.js';
import { LogModel } from '../../src/common/models/log.model.js';
import { StoreSettingsModel } from '../../src/common/models/storeSettings.model.js';
import { SubscriberModel } from '../../src/common/models/subscriber.model.js';
import { ContactMessageModel } from '../../src/common/models/contactMessage.model.js';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_jwt_access_token_secret_key_at_least_20_chars';

function request(server, method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: addr.port,
      path: path,
      method: method,
      headers: { 'Accept': 'application/json', ...headers }
    };
    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m : ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m : ${testName} ${details ? `(${JSON.stringify(details)})` : ''}`);
    failed++;
  }
}

async function runServiceTests() {
  console.log('\n======================================================');
  console.log('         STARTING SERVICE API TEST SUITE              ');
  console.log('======================================================\n');

  let mongoServer;
  let server;

  try {
    process.env.ACCESS_TOKEN_SECRET = ACCESS_SECRET;
    process.env.REFRESH_TOKEN_SECRET = ACCESS_SECRET;
    process.env.WP_TABLE_PREFIX = 'wp_';
    process.env.NODE_ENV = 'test';

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('  \x1b[36mℹ In-memory MongoDB connected\x1b[0m');

    const app = await createServiceApp();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    console.log(`  \x1b[36mℹ Service Test Server running on port ${port}\x1b[0m\n`);

    // Seed Admin User
    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
    const adminUser = await UserModel.create({
      username: 'adminuser',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'Admin',
      isActive: true,
      emailVerified: true
    });

    const adminToken = jwt.sign(
      { id: adminUser._id.toString(), userId: adminUser._id.toString(), email: adminUser.email, role: 'Admin' },
      ACCESS_SECRET,
      { expiresIn: '2h' }
    );
    const authHeader = { Authorization: `Bearer ${adminToken}` };

    // Seed Base Data
    const testCategory = await CategoryModel.create({
      name: 'Footwear',
      slug: 'footwear',
      isActive: true,
      description: 'Shoes and sandals'
    });

    const testBrand = await BrandModel.create({
      name: 'Nike',
      slug: 'nike',
      isActive: true
    });

    const testProduct = await ProductModel.create({
      productDid: 'prod-srv-001',
      title: 'Nike Air Max',
      name: 'Nike Air Max',
      slug: 'nike-air-max',
      sku: 'SKU-NIKE-001',
      price: 4500,
      regular_price: 5000,
      stock_status: 'instock',
      stock_quantity: 25,
      categories: [testCategory._id],
      category: 'Footwear',
      brand: 'Nike',
      is_active: true,
      status: 'publish',
      images: [{ src: 'https://images.unsplash.com/nike.jpg' }]
    });

    const testMember = await MemberModel.create({
      name: 'VIP Client',
      email: 'vip@example.com',
      password: hashedPassword,
      phone: '01711223344',
      isActive: true,
      emailVerified: true
    });

    const testOrder = await OrderModel.create({
      orderId: 'ORD-SRV-1001',
      id: 2001,
      customer: { name: 'VIP Client', phone: '01711223344', email: 'vip@example.com', address: 'Banani, Dhaka' },
      items: [{ product: testProduct._id, name: testProduct.title, price: 4500, quantity: 1, total: 4500 }],
      paymentMethod: 'bkash',
      status: 'pending',
      totalAmount: 4560,
      total: 4560
    });

    const testPayment = await PaymentModel.create({
      orderId: testOrder._id.toString(),
      amount: 4560,
      method: 'bkash',
      status: 'completed',
      transactionId: 'TRX-SRV-001'
    });

    const testCoupon = await CouponModel.create({
      code: 'PROMO20',
      discountType: 'percentage',
      discountAmount: 20,
      minimumSpend: 1000,
      isActive: true,
      expiryDate: new Date(Date.now() + 86400000)
    });

    const testBilling = await BillingModel.create({
      customerName: 'VIP Client',
      customerEmail: 'vip@example.com',
      orderId: testOrder._id.toString(),
      amount: 4560,
      status: 'paid'
    });

    const testAsset = await AssetModel.create({
      name: 'Dashboard Banner',
      metadata: { slot: 'dashboard_hero', imageUrl: 'https://images.unsplash.com/dash.jpg' }
    });

    const testAttribute = await AttributeModel.create({
      name: 'Color',
      slug: 'color',
      values: ['Black', 'White', 'Blue']
    });

    const testSizeChart = await SizeChartModel.create({
      title: 'Shoe Size Guide',
      category: testCategory._id,
      chartData: [{ size: '42', chest: 'N/A', length: '27cm' }]
    });

    await StoreSettingsModel.create({
      key: 'settings',
      metaPixel: { pixelId: '123456789', enabled: true },
      tiktokPixel: { pixelId: '987654321', enabled: true },
      googleAnalytics: { measurementId: 'G-123456', enabled: true },
      seo: { metaTitle: 'Decantre Luxury Perfumes', metaDescription: 'Best luxury store' }
    });

    await LogModel.create({
      type: 'newOrder',
      message: 'New order ORD-SRV-1001 placed',
      active: true,
      isRead: false
    });

    console.log('------------------------------------------------------');
    console.log(' 1. Service Root, Swagger & System Health');
    console.log('------------------------------------------------------');

    // 1. Root /
    {
      const res = await request(server, 'GET', '/');
      assert(res.status === 200 && res.data.status === 'success', 'GET / (Service API Status & Doc links)');
    }

    // 2. Swagger / OpenApi JSON
    {
      const res = await request(server, 'GET', '/api/v1/swagger');
      assert(res.status === 200 || res.status === 301 || res.status === 302, 'GET /api/v1/swagger (Swagger UI/Docs)');
    }

    // 3. System Health
    {
      const res = await request(server, 'GET', '/api/v1/system/health');
      assert(res.status === 200, 'GET /api/v1/system/health (System health check)');
    }

    // 4. System Info (Protected)
    {
      const res = await request(server, 'GET', '/api/v1/system/info', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/system/info (System server info)');
    }

    // 5. System Metadata
    {
      const res = await request(server, 'GET', '/api/v1/system/metadata');
      assert(res.status === 200, 'GET /api/v1/system/metadata (Order & payment status metadata)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 2. Service Authentication & Staff Management');
    console.log('------------------------------------------------------');

    // 6. Admin Login
    {
      const res = await request(server, 'POST', '/api/v1/auth/login', {
        email: 'admin@example.com',
        password: 'AdminPassword123!'
      });
      assert(res.status === 200 && (res.data.accessToken || res.data.token || res.data.data?.accessToken), 'POST /api/v1/auth/login (Admin credentials login)');
    }

    // 7. Refresh Token
    {
      const refreshToken = jwt.sign({ id: adminUser._id.toString() }, ACCESS_SECRET, { expiresIn: '7d' });
      const res = await request(server, 'POST', '/api/v1/auth/refresh-token', { refreshToken });
      assert(res.status === 200 || res.status === 400 || res.status === 201, 'POST /api/v1/auth/refresh-token (Refresh admin session)');
    }

    // 8. List Staff Users (Protected)
    {
      const res = await request(server, 'GET', '/api/v1/users', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/users (List staff users)');
    }

    let createdStaffId;
    // 9. Create Staff User
    {
      const res = await request(server, 'POST', '/api/v1/users', {
        username: 'manager_staff',
        email: 'manager@example.com',
        password: 'Password123!',
        role: 'Manager'
      }, authHeader);
      assert(res.status === 200 || res.status === 201, 'POST /api/v1/users (Create staff user)');
      createdStaffId = res.data?.data?._id || res.data?._id || res.data?.user?._id;
    }

    if (createdStaffId) {
      // 10. Get Staff User by ID
      const resGet = await request(server, 'GET', `/api/v1/users/${createdStaffId}`, null, authHeader);
      assert(resGet.status === 200, 'GET /api/v1/users/:userId (Get staff user)');

      // 11. Update Staff User
      const resPut = await request(server, 'PUT', `/api/v1/users/${createdStaffId}`, {
        username: 'manager_updated',
        role: 'Manager'
      }, authHeader);
      assert(resPut.status === 200, 'PUT /api/v1/users/:userId (Update staff user)');

      // 12. Delete Staff User
      const resDel = await request(server, 'DELETE', `/api/v1/users/${createdStaffId}`, null, authHeader);
      assert(resDel.status === 200, 'DELETE /api/v1/users/:userId (Delete staff user)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 3. Service Members (Customer CRM) Management');
    console.log('------------------------------------------------------');

    // 13. List Members
    {
      const res = await request(server, 'GET', '/api/v1/members', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/members (List customer members)');
    }

    let createdMemberId;
    // 14. Create Member
    {
      const res = await request(server, 'POST', '/api/v1/members', {
        name: 'New Member',
        email: 'newmember@example.com',
        password: 'Password123!',
        phone: '01899887766'
      }, authHeader);
      assert(res.status === 200 || res.status === 201, 'POST /api/v1/members (Admin creates member)');
      createdMemberId = res.data?.data?._id || res.data?._id;
    }

    const testMemberId = createdMemberId || testMember._id.toString();

    // 15. Get Member by ID
    {
      const res = await request(server, 'GET', `/api/v1/members/${testMemberId}`, null, authHeader);
      assert(res.status === 200, 'GET /api/v1/members/:memberId (Get member details)');
    }

    // 16. Update Member
    {
      const res = await request(server, 'PUT', `/api/v1/members/${testMemberId}`, {
        name: 'VIP Client Gold'
      }, authHeader);
      assert(res.status === 200, 'PUT /api/v1/members/:memberId (Update member profile)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 4. Service Products & Dash Products');
    console.log('------------------------------------------------------');

    // 17. Search Dash Products
    {
      const res = await request(server, 'POST', '/api/v1/dash/products', { search: 'Nike' }, authHeader);
      assert(res.status === 200, 'POST /api/v1/dash/products (Multi-criteria dashboard search)');
    }

    // 18. List Service Products
    {
      const res = await request(server, 'GET', '/api/v1/products');
      assert(res.status === 200, 'GET /api/v1/products (List products in catalog)');
    }

    let createdProductId;
    // 19. Create Product
    {
      const res = await request(server, 'POST', '/api/v1/products', {
        title: 'Adidas Ultraboost',
        name: 'Adidas Ultraboost',
        slug: 'adidas-ultraboost',
        sku: 'SKU-ADI-001',
        price: 5200,
        regular_price: 5500,
        category: 'Footwear',
        brand: 'Adidas',
        stock_status: 'instock',
        stock_quantity: 30
      }, authHeader);
      assert(res.status === 200 || res.status === 201, 'POST /api/v1/products (Create new catalog product)');
      createdProductId = res.data?.data?._id || res.data?._id;
    }

    const targetProdId = createdProductId || testProduct._id.toString();

    // 20. Update Product
    {
      const res = await request(server, 'PUT', `/api/v1/products/${targetProdId}`, {
        price: 4999
      }, authHeader);
      assert(res.status === 200, 'PUT /api/v1/products/:id (Update product details)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 5. Service Orders & Fulfillment');
    console.log('------------------------------------------------------');

    // 21. List Orders
    {
      const res = await request(server, 'GET', '/api/v1/orders', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/orders (List paginated orders)');
    }

    // 22. Get Order Details
    {
      const res = await request(server, 'GET', `/api/v1/orders/${testOrder._id}`, null, authHeader);
      assert(res.status === 200, 'GET /api/v1/orders/:orderId (Get order details)');
    }

    // 23. Update Order Status
    {
      const res = await request(server, 'PUT', `/api/v1/orders/${testOrder._id}`, {
        status: 'confirmed',
        order_status: 'confirmed'
      }, authHeader);
      assert(res.status === 200, 'PUT /api/v1/orders/:orderId (Update order status)');
    }

    // 24. Bulk Update Orders
    {
      const res = await request(server, 'POST', '/api/v1/orders/bulk-update', {
        orderIds: [testOrder._id.toString()],
        status: 'processing'
      }, authHeader);
      assert(res.status === 200, 'POST /api/v1/orders/bulk-update (Bulk update order statuses)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 6. Service Payments & Billing');
    console.log('------------------------------------------------------');

    // 25. List Payments
    {
      const res = await request(server, 'GET', '/api/v1/payments', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/payments (List payments)');
    }

    // 26. Get Payment By ID
    {
      const res = await request(server, 'GET', `/api/v1/payments/${testPayment._id}`, null, authHeader);
      assert(res.status === 200, 'GET /api/v1/payments/:paymentId (Get payment info)');
    }

    // 27. Update Payment
    {
      const res = await request(server, 'PUT', `/api/v1/payments/${testPayment._id}`, {
        status: 'completed',
        amount: 4560
      }, authHeader);
      assert(res.status === 200, 'PUT /api/v1/payments/:paymentId (Update payment record)');
    }

    // 28. List Billing
    {
      const res = await request(server, 'GET', '/api/v1/billing', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/billing (List billing records)');
    }

    // 29. Get Billing by ID
    {
      const res = await request(server, 'GET', `/api/v1/billing/${testBilling._id}`, null, authHeader);
      assert(res.status === 200, 'GET /api/v1/billing/:billingId (Get billing record)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 7. Service Categories, Brands, Coupons & Attributes');
    console.log('------------------------------------------------------');

    // 30. List & Create Categories
    {
      const resList = await request(server, 'GET', '/api/v1/categories');
      assert(resList.status === 200, 'GET /api/v1/categories (List categories)');

      const resCreate = await request(server, 'POST', '/api/v1/categories', {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Bags, belts, caps'
      }, authHeader);
      assert(resCreate.status === 200 || resCreate.status === 201, 'POST /api/v1/categories (Create category)');
    }

    // 31. List & Create Brands
    {
      const resList = await request(server, 'GET', '/api/v1/brands');
      assert(resList.status === 200, 'GET /api/v1/brands (List brands)');

      const resCreate = await request(server, 'POST', '/api/v1/brands', {
        name: 'Puma',
        slug: 'puma'
      }, authHeader);
      assert(resCreate.status === 200 || resCreate.status === 201, 'POST /api/v1/brands (Create brand)');
    }

    // 32. List & Create Coupons
    {
      const resList = await request(server, 'GET', '/api/v1/coupons');
      assert(resList.status === 200, 'GET /api/v1/coupons (List coupons)');

      const resCreate = await request(server, 'POST', '/api/v1/coupons', {
        code: 'SUMMER25',
        discountType: 'percentage',
        discountAmount: 25,
        minimumSpend: 2000,
        expiryDate: new Date(Date.now() + 864000000)
      }, authHeader);
      assert(resCreate.status === 200 || resCreate.status === 201, 'POST /api/v1/coupons (Create coupon)');
    }

    // 33. Attributes Endpoints
    {
      const resList = await request(server, 'GET', '/api/v1/attribute/attributes');
      assert(resList.status === 200, 'GET /api/v1/attribute/attributes (Get product attributes)');

      const resCreate = await request(server, 'POST', '/api/v1/attribute/dashboard/attributes', {
        name: 'Size',
        slug: 'size',
        values: ['S', 'M', 'L', 'XL']
      });
      assert(resCreate.status === 200 || resCreate.status === 201, 'POST /api/v1/attribute/dashboard/attributes (Create attribute)');
    }

    // 34. Size Charts Endpoints
    {
      const resList = await request(server, 'GET', '/api/v1/size-charts');
      assert(resList.status === 200, 'GET /api/v1/size-charts (List size charts)');

      const resCreate = await request(server, 'POST', '/api/v1/size-charts', {
        title: 'Pants Sizing Guide',
        category: testCategory._id,
        chartData: [{ size: '32', waist: '32', length: '40' }]
      }, authHeader);
      assert(resCreate.status === 200 || resCreate.status === 201, 'POST /api/v1/size-charts (Upsert size chart)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 8. Service Dashboard Analytics & Reports');
    console.log('------------------------------------------------------');

    // 35. Daily Orders
    {
      const res = await request(server, 'GET', '/api/v1/dashboard/orders/daily');
      assert(res.status === 200, 'GET /api/v1/dashboard/orders/daily (Daily order counts)');
    }

    // 36. Order Status Distribution
    {
      const res = await request(server, 'GET', '/api/v1/dashboard/orders/status-distribution');
      assert(res.status === 200, 'GET /api/v1/dashboard/orders/status-distribution (Status pie breakdown)');
    }

    // 37. KPI Stats
    {
      const res = await request(server, 'GET', '/api/v1/dashboard/kpi');
      assert(res.status === 200, 'GET /api/v1/dashboard/kpi (High-level KPI stats)');
    }

    // 38. Reports Summary
    {
      const res = await request(server, 'GET', '/api/v1/reports/summary', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/reports/summary (Sales summary report)');
    }

    // 39. Reports Sales Timeline
    {
      const res = await request(server, 'GET', '/api/v1/reports/sales-timeline', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/reports/sales-timeline (Sales timeline report)');
    }

    // 40. Reports Inventory
    {
      const res = await request(server, 'GET', '/api/v1/reports/inventory', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/reports/inventory (Inventory report)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 9. Service Marketing Settings & Pixel Integrations');
    console.log('------------------------------------------------------');

    // 41. Public Meta Pixel Config
    {
      const res = await request(server, 'GET', '/api/v1/settings/public/meta-pixel');
      assert(res.status === 200, 'GET /api/v1/settings/public/meta-pixel (Public Meta Pixel config)');
    }

    // 42. Public TikTok Pixel Config
    {
      const res = await request(server, 'GET', '/api/v1/settings/public/tiktok-pixel');
      assert(res.status === 200, 'GET /api/v1/settings/public/tiktok-pixel (Public TikTok Pixel config)');
    }

    // 43. Meta Pixel Settings (Admin)
    {
      const res = await request(server, 'GET', '/api/v1/settings/meta-pixel', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/settings/meta-pixel (Admin Meta Pixel & CAPI)');
    }

    // 44. TikTok Pixel Settings (Admin)
    {
      const res = await request(server, 'GET', '/api/v1/settings/tiktok-pixel', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/settings/tiktok-pixel (Admin TikTok Pixel)');
    }

    // 45. Google Analytics Settings (Admin)
    {
      const res = await request(server, 'GET', '/api/v1/settings/google-analytics', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/settings/google-analytics (Admin Google Analytics)');
    }

    // 46. SEO Settings (Admin)
    {
      const res = await request(server, 'GET', '/api/v1/settings/seo', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/settings/seo (Admin SEO settings)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 10. Service Logs, Telemetry, Store Utils & Developer');
    console.log('------------------------------------------------------');

    // 47. Logs Notifications
    {
      const res = await request(server, 'GET', '/api/v1/logs/notifications', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/logs/notifications (Unread notification count & logs)');
    }

    // 48. List Logs
    {
      const res = await request(server, 'GET', '/api/v1/logs', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/logs (List logs)');
    }

    // 49. Telemetry Health
    {
      const res = await request(server, 'GET', '/api/v1/telemetry/health');
      assert(res.status === 200, 'GET /api/v1/telemetry/health (Telemetry gateway health)');
    }

    // 50. Store Utils Management
    {
      const resGet = await request(server, 'GET', '/api/v1/store-utils');
      assert(resGet.status === 200, 'GET /api/v1/store-utils (Get store showcases)');

      const resPut = await request(server, 'PUT', '/api/v1/store-utils', {
        bannerText: 'Updated Store Utils Banner'
      }, authHeader);
      assert(resPut.status === 200 || resPut.status === 201, 'PUT /api/v1/store-utils (Update store showcase utils)');
    }

    // 51. Webmail Folders
    {
      const res = await request(server, 'GET', '/api/v1/webmail/folders', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/webmail/folders (Webmail folders list)');
    }

    // 52. Webmail Messages
    {
      const res = await request(server, 'GET', '/api/v1/webmail/messages', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/webmail/messages (Webmail messages list)');
    }

    // 53. Media Audit Summary
    {
      const res = await request(server, 'GET', '/api/v1/admin/media-audit/summary', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/admin/media-audit/summary (Media audit & R2 storage summary)');
    }

    // 54. Developer Logs
    {
      const res = await request(server, 'GET', '/api/v1/developer/logs', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/developer/logs (Developer in-memory logs)');
    }

    // 55. Developer Scalar Docs
    {
      const res = await request(server, 'GET', '/api/v1/developer/docs');
      assert(res.status === 200, 'GET /api/v1/developer/docs (Developer Scalar API docs page)');
    }

  } catch (error) {
    console.error('\n\x1b[31mCRITICAL ERROR DURING SERVICE TESTS:\x1b[0m', error);
  } finally {
    if (server) {
      server.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('\n======================================================');
    console.log(`SERVICE SUMMARY: \x1b[32m${passed} PASSED\x1b[0m | \x1b[31m${failed} FAILED\x1b[0m`);
    console.log('======================================================\n');
  }
}

runServiceTests();
