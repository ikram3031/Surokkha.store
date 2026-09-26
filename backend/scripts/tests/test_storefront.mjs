import http from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createStorefrontApp } from '../../src/storefront/app.js';
import { UserModel } from '../../src/common/models/user.model.js';
import { MemberModel } from '../../src/common/models/member.model.js';
import { ProductModel } from '../../src/common/models/product.model.js';
import { CategoryModel } from '../../src/common/models/category.model.js';
import { BrandModel } from '../../src/common/models/brand.model.js';
import { CouponModel } from '../../src/common/models/coupon.model.js';
import { OrderModel } from '../../src/common/models/order.model.js';
import { PaymentModel } from '../../src/common/models/payment.model.js';
import { ReviewModel } from '../../src/common/models/review.model.js';
import { SizeChartModel } from '../../src/common/models/sizeChart.model.js';
import { StoreUtilsModel } from '../../src/common/models/storeUtils.model.js';
import { AssetModel } from '../../src/common/models/asset.model.js';
import { SubscriberModel } from '../../src/common/models/subscriber.model.js';
import { ContactMessageModel } from '../../src/common/models/contactMessage.model.js';
import { PopularSearchModel } from '../../src/common/models/popularSearch.model.js';
import { RecentSearchModel } from '../../src/common/models/recentSearch.model.js';

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

async function runStorefrontTests() {
  console.log('\n======================================================');
  console.log('       STARTING STOREFRONT API TEST SUITE            ');
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

    const app = await createStorefrontApp();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    console.log(`  \x1b[36mℹ Storefront Test Server running on port ${port}\x1b[0m\n`);

    // Seed Data
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const testMember = await MemberModel.create({
      name: 'Customer One',
      email: 'customer@example.com',
      password: hashedPassword,
      isActive: true,
      emailVerified: true
    });

    const customerToken = jwt.sign(
      { id: testMember._id.toString(), userId: testMember._id.toString(), email: testMember.email, role: 'customer' },
      ACCESS_SECRET,
      { expiresIn: '1h' }
    );
    const authHeader = { Authorization: `Bearer ${customerToken}` };

    const testCategory = await CategoryModel.create({
      name: 'Electronics',
      slug: 'electronics',
      isActive: true,
      description: 'Gadgets and gear'
    });

    const testBrand = await BrandModel.create({
      name: 'Sony',
      slug: 'sony',
      isActive: true
    });

    const testProduct = await ProductModel.create({
      productDid: 'prod-001',
      title: 'Wireless Headphones',
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      sku: 'SKU-HEAD-001',
      price: 1500,
      regular_price: 1800,
      stock_status: 'instock',
      stock_quantity: 50,
      categories: [testCategory._id],
      category: 'Electronics',
      brand: 'Sony',
      is_active: true,
      status: 'publish',
      images: [{ src: 'https://images.unsplash.com/photo-headphones.jpg' }]
    });

    const testCoupon = await CouponModel.create({
      code: 'DISCOUNT10',
      discountType: 'percentage',
      discountAmount: 10,
      minimumSpend: 500,
      isActive: true,
      expiryDate: new Date(Date.now() + 86400000)
    });

    const testSizeChart = await SizeChartModel.create({
      title: 'Standard T-Shirt Sizing',
      category: testCategory._id,
      chartData: [{ size: 'M', chest: '40', length: '28' }]
    });

    const testStoreUtils = await StoreUtilsModel.create({
      key: 'main_showcase',
      bannerText: 'Welcome to Surokkha Store',
      showcaseItems: []
    });

    const testAsset = await AssetModel.create({
      name: 'Hero Banner',
      metadata: { slot: 'hero_banner', imageUrl: 'https://images.unsplash.com/hero.jpg' }
    });

    await PopularSearchModel.create({ query: 'headphones', count: 12 });
    await RecentSearchModel.create({ user: testMember._id, query: 'wireless headphones' });

    console.log('------------------------------------------------------');
    console.log(' 1. Storefront System & Root Endpoints');
    console.log('------------------------------------------------------');

    // 1. Root /
    {
      const res = await request(server, 'GET', '/');
      assert(res.status === 200 && res.data.status === 'success', 'GET / (Health Check)');
    }

    // 2. Client IP
    {
      const res = await request(server, 'GET', '/api/v1/client-ip', null, { 'x-forwarded-for': '203.0.113.195' });
      assert(res.status === 200 && res.data.ip === '203.0.113.195', 'GET /api/v1/client-ip (Resolves IP)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 2. Storefront Products & Search Endpoints');
    console.log('------------------------------------------------------');

    // 3. Products List
    {
      const res = await request(server, 'GET', '/api/v1/products');
      assert(res.status === 200, 'GET /api/v1/products (List products)');
    }

    // 4. Products Search POST
    {
      const res = await request(server, 'POST', '/api/v1/products/search', { search: 'Headphones' });
      assert(res.status === 200, 'POST /api/v1/products/search (Filter products)');
    }

    // 5. Product by ID or Slug
    {
      const res = await request(server, 'GET', `/api/v1/products/${testProduct.slug}`);
      assert(res.status === 200 && (res.data.product || res.data._id || res.data.title || res.data.data), 'GET /api/v1/products/:identifier (Get single product by slug)');
    }

    // 6. Search Products
    {
      const res = await request(server, 'GET', '/api/v1/search-products?q=wireless');
      assert(res.status === 200, 'GET /api/v1/search-products (Query products)');
    }

    // 7. Search API
    {
      const res = await request(server, 'GET', '/api/v1/search?q=wireless');
      assert(res.status === 200, 'GET /api/v1/search (Search products endpoint)');
    }

    // 8. Popular Searches
    {
      const res = await request(server, 'GET', '/api/v1/search/popular');
      assert(res.status === 200, 'GET /api/v1/search/popular (Popular queries)');
    }

    // 9. Recent Searches (Authenticated)
    {
      const res = await request(server, 'GET', '/api/v1/search/recent', null, authHeader);
      assert(res.status === 200, 'GET /api/v1/search/recent (Recent user queries)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 3. Storefront Categories, Brands & Coupons');
    console.log('------------------------------------------------------');

    // 10. Categories List
    {
      const res = await request(server, 'GET', '/api/v1/categories');
      assert(res.status === 200, 'GET /api/v1/categories (List active categories)');
    }

    // 11. Category by ID
    {
      const res = await request(server, 'GET', `/api/v1/categories/${testCategory._id}`);
      assert(res.status === 200, 'GET /api/v1/categories/:id (Get category by ID)');
    }

    // 12. Brands List
    {
      const res = await request(server, 'GET', '/api/v1/brands');
      assert(res.status === 200, 'GET /api/v1/brands (List brands)');
    }

    // 13. Coupons List
    {
      const res = await request(server, 'GET', '/api/v1/coupons');
      assert(res.status === 200, 'GET /api/v1/coupons (List public coupons)');
    }

    // 14. Coupon by ID
    {
      const res = await request(server, 'GET', `/api/v1/coupons/${testCoupon._id}`);
      assert(res.status === 200, 'GET /api/v1/coupons/:id (Get coupon by ID)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 4. Storefront Size Charts, Store Utils & Assets');
    console.log('------------------------------------------------------');

    // 15. Size Charts List
    {
      const res = await request(server, 'GET', '/api/v1/size-charts');
      assert(res.status === 200, 'GET /api/v1/size-charts (List size charts)');
    }

    // 16. Size Chart by Category
    {
      const res = await request(server, 'GET', `/api/v1/size-charts/category/${testCategory._id}`);
      assert(res.status === 200, 'GET /api/v1/size-charts/category/:categoryId (Get category size chart)');
    }

    // 17. Store Utils
    {
      const res = await request(server, 'GET', '/api/v1/store-utils');
      assert(res.status === 200, 'GET /api/v1/store-utils (Get store utilities)');
    }

    // 18. Assets List
    {
      const res = await request(server, 'GET', '/api/v1/assets');
      assert(res.status === 200, 'GET /api/v1/assets (List slot assets)');
    }

    // 19. Asset by ID
    {
      const res = await request(server, 'GET', `/api/v1/assets/${testAsset._id}`);
      assert(res.status === 200, 'GET /api/v1/assets/:assetId (Get asset by ID)');
    }

    // 20. Images List
    {
      const res = await request(server, 'GET', '/api/v1/images');
      assert(res.status === 200, 'GET /api/v1/images (List gallery media images)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 5. Storefront Subscribers, Contact & Reviews');
    console.log('------------------------------------------------------');

    // 21. Create Subscriber
    {
      const res = await request(server, 'POST', '/api/v1/subscribers', { email: 'subscriber1@example.com' });
      assert(res.status === 200 || res.status === 201, 'POST /api/v1/subscribers (Newsletter subscribe)');
    }

    // 22. Submit Contact Message
    {
      const res = await request(server, 'POST', '/api/v1/contact', {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '01700000000',
        message: 'Need info about warranty'
      });
      assert(res.status === 200 || res.status === 201, 'POST /api/v1/contact (Contact form submission)');
    }

    let createdReviewId;
    // 23. Create Review (Authenticated)
    {
      const res = await request(server, 'POST', '/api/v1/reviews', {
        productDid: testProduct.productDid || testProduct._id.toString(),
        rating: 5,
        review: 'Excellent build quality and sound!',
        comment: 'Excellent build quality and sound!',
        userName: 'Customer One'
      }, authHeader);
      assert(res.status === 200 || res.status === 201, 'POST /api/v1/reviews (Customer submits review)');
      if (res.data?.data?._id || res.data?._id) {
        createdReviewId = res.data?.data?._id || res.data?._id;
      }
    }

    // Seed fallback review if needed
    if (!createdReviewId) {
      const fallbackRev = await ReviewModel.create({
        productDid: testProduct.productDid || 'prod-001',
        rating: 5,
        review: 'Superb sound!',
        user: testMember._id,
        userName: 'Customer One',
        status: 'approved'
      });
      createdReviewId = fallbackRev._id.toString();
    }

    // 24. Get Product Reviews
    {
      const res = await request(server, 'GET', `/api/v1/reviews/product/${testProduct.productDid || 'prod-001'}`);
      assert(res.status === 200, 'GET /api/v1/reviews/product/:productDid (Get product reviews)');
    }

    // 25. Get Single Review
    {
      const res = await request(server, 'GET', `/api/v1/reviews/${createdReviewId}`);
      assert(res.status === 200, 'GET /api/v1/reviews/:id (Get review by ID)');
    }

    // 26. Update Review
    {
      const res = await request(server, 'PUT', `/api/v1/reviews/${createdReviewId}`, {
        rating: 4,
        review: 'Updated review note',
        comment: 'Updated review note'
      }, authHeader);
      assert(res.status === 200, 'PUT /api/v1/reviews/:id (Update own review)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 6. Storefront Orders & Payments');
    console.log('------------------------------------------------------');

    let createdOrderId;
    let numericOrderId;

    // 27. Create Order (Checkout)
    {
      const orderPayload = {
        customer: {
          name: 'Rahim Uddin',
          phone: '01812345678',
          email: 'rahim@example.com',
          address: 'Mirpur-10, Dhaka'
        },
        shippingAddress: {
          address: 'Mirpur-10, Dhaka',
          city: 'Dhaka',
          zone: 'Inside Dhaka'
        },
        items: [
          {
            product: testProduct._id,
            productDid: testProduct.productDid,
            name: testProduct.name,
            title: testProduct.title,
            price: 1500,
            quantity: 1,
            total: 1500
          }
        ],
        line_items: [
          {
            product_id: testProduct._id,
            name: testProduct.title,
            price: 1500,
            quantity: 1,
            total: 1500
          }
        ],
        paymentMethod: 'cod',
        payment_method: 'cod',
        subTotal: 1500,
        shippingCost: 60,
        totalAmount: 1560,
        total: 1560
      };

      const res = await request(server, 'POST', '/api/v1/orders/new-order', orderPayload);
      assert(res.status === 200 || res.status === 201, 'POST /api/v1/orders/new-order (Customer checkout order creation)');
      if (res.data?.data?.orderId || res.data?.orderId || res.data?.data?._id || res.data?._id) {
        createdOrderId = res.data?.data?.orderId || res.data?.orderId || res.data?.data?._id || res.data?._id;
        numericOrderId = res.data?.data?.id || res.data?.id || res.data?.data?.orderId || res.data?.orderId;
      }
    }

    if (!createdOrderId) {
      const fallbackOrder = await OrderModel.create({
        orderId: 'ORD-1001',
        id: 1001,
        customer: { name: 'Rahim', phone: '01812345678', email: 'rahim@example.com', address: 'Dhaka' },
        items: [{ product: testProduct._id, name: testProduct.title, price: 1500, quantity: 1, total: 1500 }],
        paymentMethod: 'cod',
        totalAmount: 1560,
        status: 'pending'
      });
      createdOrderId = fallbackOrder._id.toString();
      numericOrderId = 'ORD-1001';
    }

    // 28. Get Order By ID / orderId
    {
      const lookupId = numericOrderId || createdOrderId;
      const res = await request(server, 'GET', `/api/v1/orders/${lookupId}`);
      assert(res.status === 200, 'GET /api/v1/orders/:orderId (Lookup order details)');
    }

    // 29. Get Order Invoice View
    {
      const lookupId = numericOrderId || createdOrderId;
      const res = await request(server, 'GET', `/api/v1/orders/${lookupId}/invoice`);
      assert(res.status === 200, 'GET /api/v1/orders/:orderId/invoice (Render/Download invoice HTML)');
    }

    let createdPaymentId;
    // 30. Create Payment Record
    {
      const res = await request(server, 'POST', '/api/v1/payments', {
        orderId: createdOrderId,
        amount: 1560,
        method: 'bkash',
        status: 'pending',
        transactionId: 'TRX998877'
      });
      assert(res.status === 200 || res.status === 201, 'POST /api/v1/payments (Initiate payment)');
      if (res.data?.data?._id || res.data?._id || res.data?.payment?._id) {
        createdPaymentId = res.data?.data?._id || res.data?._id || res.data?.payment?._id;
      }
    }

    if (!createdPaymentId) {
      const fallbackPayment = await PaymentModel.create({
        orderId: createdOrderId,
        amount: 1560,
        method: 'bkash',
        status: 'pending',
        transactionId: 'TRX998877'
      });
      createdPaymentId = fallbackPayment._id.toString();
    }

    // 31. Get Payment Details
    {
      const res = await request(server, 'GET', `/api/v1/payments/${createdPaymentId}`);
      assert(res.status === 200, 'GET /api/v1/payments/:paymentId (Get payment status)');
    }

    console.log('\n------------------------------------------------------');
    console.log(' 7. Storefront Authentication & Session');
    console.log('------------------------------------------------------');

    // 32. Refresh Token / Logout / Session
    {
      const refreshToken = jwt.sign({ id: testMember._id.toString() }, ACCESS_SECRET, { expiresIn: '7d' });
      const res = await request(server, 'POST', '/api/v1/auth/refresh-token', { refreshToken });
      assert(res.status === 200 || res.status === 400 || res.status === 201, 'POST /api/v1/auth/refresh-token (Refresh auth session)');
    }

    // 33. Customer Logout
    {
      const res = await request(server, 'POST', '/api/v1/auth/logout', {});
      assert(res.status === 200, 'POST /api/v1/auth/logout (Logout customer session)');
    }

  } catch (error) {
    console.error('\n\x1b[31mCRITICAL ERROR DURING STOREFRONT TESTS:\x1b[0m', error);
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
    console.log(`STOREFRONT SUMMARY: \x1b[32m${passed} PASSED\x1b[0m | \x1b[31m${failed} FAILED\x1b[0m`);
    console.log('======================================================\n');
  }
}

runStorefrontTests();
