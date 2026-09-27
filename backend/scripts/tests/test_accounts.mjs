import http from "http";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { createServiceApp } from "../../src/service/app.js";
import { UserModel } from "../../src/common/models/user.model.js";
import { BillTypeModel } from "../../src/common/models/billType.model.js";
import { InvestorModel } from "../../src/common/models/investor.model.js";
import { InvestmentModel } from "../../src/common/models/investment.model.js";
import { BillingModel } from "../../src/common/models/billing.model.js";
import { PaymentModel } from "../../src/common/models/payment.model.js";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "dev_jwt_access_token_secret_key_at_least_20_chars";

// Makes an HTTP request to the test server and parses JSON response
const request = (server, method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: "127.0.0.1",
      port: addr.port,
      path,
      method,
      headers: { Accept: "application/json", ...headers },
    };
    if (body && typeof body === "object") {
      body = JSON.stringify(body);
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(body);
    }
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
};

let passed = 0;
let failed = 0;

// Validates a test condition and prints formatted output
const assert = (condition, testName, details = "") => {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m : ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m : ${testName} ${details ? `(${JSON.stringify(details)})` : ""}`);
    failed++;
  }
};

// Main test runner executing all test cases for the Accounts module
const runAccountsTestSuite = async () => {
  console.log("\n======================================================");
  console.log("       STARTING ACCOUNTS MODULE TEST SUITE            ");
  console.log("======================================================\n");

  let mongoServer;
  let server;

  try {
    process.env.ACCESS_TOKEN_SECRET = ACCESS_SECRET;
    process.env.REFRESH_TOKEN_SECRET = ACCESS_SECRET;
    process.env.WP_TABLE_PREFIX = "wp_";
    process.env.NODE_ENV = "test";

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log("  \x1b[36mℹ In-memory MongoDB connected\x1b[0m");

    const app = await createServiceApp();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    console.log(`  \x1b[36mℹ Service Test Server running on port ${port}\x1b[0m\n`);

    const hashedPassword = await bcrypt.hash("AdminPassword123!", 10);
    const adminUser = await UserModel.create({
      name: "Admin User",
      email: "admin@example.com",
      passwordHash: hashedPassword,
      role: "Admin",
      isActive: true,
    });

    const staffUser = await UserModel.create({
      name: "Partner User",
      email: "partner@example.com",
      passwordHash: hashedPassword,
      role: "Manager",
      isActive: true,
      phone: "01700000000",
    });

    const adminToken = jwt.sign(
      { id: adminUser._id.toString(), userId: adminUser._id.toString(), email: adminUser.email, role: "Admin" },
      ACCESS_SECRET,
      { expiresIn: "2h" }
    );
    const authHeader = { Authorization: `Bearer ${adminToken}` };

    console.log("------------------------------------------------------");
    console.log(" 1. Bill Types (CRUD, Default Status & Search)");
    console.log("------------------------------------------------------");

    let billType1Id;
    let billType2Id;

    {
      const res = await request(
        server,
        "POST",
        "/api/v1/accounts/bill-types",
        {
          name: "Office Rent",
          description: "Monthly physical office rent expense",
          isDefault: true,
          status: "active",
        },
        authHeader
      );
      assert(res.status === 201 && res.data?.data?.name === "Office Rent", "POST /accounts/bill-types (Create default bill type)");
      billType1Id = res.data?.data?._id || res.data?.data?.id;
    }

    {
      const res = await request(
        server,
        "POST",
        "/api/v1/accounts/bill-types",
        {
          name: "Server Hosting",
          description: "Cloud servers & infrastructure",
          isDefault: false,
          status: "active",
        },
        authHeader
      );
      assert(res.status === 201 && res.data?.data?.name === "Server Hosting", "POST /accounts/bill-types (Create regular bill type)");
      billType2Id = res.data?.data?._id || res.data?.data?.id;
    }

    {
      const res = await request(server, "GET", "/api/v1/accounts/bill-types?search=Office", null, authHeader);
      assert(res.status === 200 && res.data?.data?.length === 1, "GET /accounts/bill-types (Filter by search keyword)");
    }

    {
      const res = await request(server, "GET", `/api/v1/accounts/bill-types/${billType1Id}`, null, authHeader);
      assert(res.status === 200 && res.data?.data?.name === "Office Rent", "GET /accounts/bill-types/:id (Get bill type details)");
    }

    {
      const res = await request(
        server,
        "PUT",
        `/api/v1/accounts/bill-types/${billType2Id}`,
        {
          description: "AWS & Cloudflare infrastructure costs",
        },
        authHeader
      );
      assert(res.status === 200 && res.data?.data?.description.includes("AWS"), "PUT /accounts/bill-types/:id (Update bill type)");
    }

    console.log("\n------------------------------------------------------");
    console.log(" 2. Investors (CRUD, Existing User Links & Summary)");
    console.log("------------------------------------------------------");

    let investor1Id;
    let investor2Id;

    {
      const res = await request(
        server,
        "POST",
        "/api/v1/accounts/investors",
        {
          name: "Rahim Chowdhury",
          email: "rahim@investor.com",
          phone: "01811223344",
          type: "manual",
          notes: "Angel Investor Phase 1",
          status: "active",
        },
        authHeader
      );
      assert(res.status === 201 && res.data?.data?.name === "Rahim Chowdhury", "POST /accounts/investors (Create manual investor)");
      investor1Id = res.data?.data?._id || res.data?.data?.id;
    }

    {
      const res = await request(
        server,
        "POST",
        "/api/v1/accounts/investors",
        {
          type: "existing_user",
          userId: staffUser._id.toString(),
          notes: "Partner Investor",
          status: "active",
        },
        authHeader
      );
      assert(
        res.status === 201 && res.data?.data?.name === "Partner User" && res.data?.data?.email === "partner@example.com",
        "POST /accounts/investors (Create investor linked to existing user)"
      );
      investor2Id = res.data?.data?._id || res.data?.data?.id;
    }

    {
      const res = await request(server, "GET", "/api/v1/accounts/investors", null, authHeader);
      assert(res.status === 200 && res.data?.data?.length === 2, "GET /accounts/investors (List all investors with meta)");
    }

    {
      const res = await request(
        server,
        "PUT",
        `/api/v1/accounts/investors/${investor1Id}`,
        {
          phone: "01899998888",
          notes: "Angel Investor Phase 1 & 2",
        },
        authHeader
      );
      assert(res.status === 200 && res.data?.data?.phone === "01899998888", "PUT /accounts/investors/:id (Update investor)");
    }

    console.log("\n------------------------------------------------------");
    console.log(" 3. Investments (CRUD, Returns, Date & Status Filters)");
    console.log("------------------------------------------------------");

    let investment1Id;
    let investment2Id;
    let investment3Id;

    const todayStr = new Date().toISOString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString();

    {
      const res = await request(
        server,
        "POST",
        "/api/v1/accounts/investments",
        {
          investorId: investor1Id,
          takenAmount: 100000,
          returnedAmount: 0,
          takenDate: yesterdayStr,
          paymentMethod: "Bank Transfer",
          notes: "Seed capital",
          status: "active",
        },
        authHeader
      );
      assert(res.status === 201 && res.data?.data?.takenAmount === 100000, "POST /accounts/investments (Create investment 1)");
      investment1Id = res.data?.data?._id || res.data?.data?.id;
    }

    {
      const res = await request(
        server,
        "POST",
        "/api/v1/accounts/investments",
        {
          investorId: investor1Id,
          takenAmount: 50000,
          returnedAmount: 20000,
          takenDate: todayStr,
          paymentMethod: "Cheque",
          notes: "Expansion capital",
        },
        authHeader
      );
      assert(
        res.status === 201 && res.data?.data?.status === "partial",
        "POST /accounts/investments (Auto-derive partial status when returnedAmount > 0)"
      );
      investment2Id = res.data?.data?._id || res.data?.data?.id;
    }

    {
      const res = await request(
        server,
        "POST",
        "/api/v1/accounts/investments",
        {
          investorId: investor2Id,
          takenAmount: 30000,
          returnedAmount: 30000,
          takenDate: todayStr,
          paymentMethod: "Cash",
          notes: "Short-term bridge loan",
        },
        authHeader
      );
      assert(
        res.status === 201 && res.data?.data?.status === "returned",
        "POST /accounts/investments (Auto-derive returned status when returnedAmount >= takenAmount)"
      );
      investment3Id = res.data?.data?._id || res.data?.data?.id;
    }

    {
      const res = await request(
        server,
        "GET",
        "/api/v1/accounts/investments?status=active",
        null,
        authHeader
      );
      assert(res.status === 200 && res.data?.data?.length === 1, "GET /accounts/investments (Filter by status=active)");
    }

    {
      const res = await request(
        server,
        "GET",
        `/api/v1/accounts/investments?investorId=${investor1Id}`,
        null,
        authHeader
      );
      assert(
        res.status === 200 &&
          res.data?.meta?.totalTakenAmount === 150000 &&
          res.data?.meta?.totalReturnedAmount === 20000 &&
          res.data?.meta?.netAmount === 130000,
        "GET /accounts/investments (Financial totals metadata calculation)"
      );
    }

    {
      const res = await request(server, "GET", `/api/v1/accounts/investors/${investor1Id}`, null, authHeader);
      assert(
        res.status === 200 &&
          res.data?.data?.summary?.totalInvested === 150000 &&
          res.data?.data?.summary?.netInvested === 130000 &&
          res.data?.data?.investments?.length === 2,
        "GET /accounts/investors/:id (Investor details with nested investment history and summary)"
      );
    }

    {
      const res = await request(
        server,
        "PUT",
        `/api/v1/accounts/investments/${investment1Id}`,
        {
          returnedAmount: 100000,
          returnedDate: todayStr,
        },
        authHeader
      );
      assert(
        res.status === 200 && res.data?.data?.status === "returned",
        "PUT /accounts/investments/:id (Update returned amount and auto-adjust status)"
      );
    }

    console.log("\n------------------------------------------------------");
    console.log(" 4. Billing (BillType Integration & Date Range Filter)");
    console.log("------------------------------------------------------");

    let bill1Id;
    let bill2Id;

    {
      const res = await request(
        server,
        "POST",
        "/api/v1/billing",
        {
          billTypeId: billType1Id,
          title: "September Office Rent",
          amount: 25000,
          totalAmount: 25000,
          paidAmount: 25000,
          status: "paid",
          billingDate: yesterdayStr,
          dueDate: todayStr,
          notes: "Banani office floor 4",
        },
        authHeader
      );
      assert(
        res.status === 201 && res.data?.data?.title === "September Office Rent",
        "POST /billing (Create bill with billTypeId and billingDate)"
      );
      bill1Id = res.data?.data?._id || res.data?.data?.id;
    }

    {
      const res = await request(
        server,
        "POST",
        "/api/v1/billing",
        {
          billTypeId: billType2Id,
          title: "AWS Cloud Services",
          amount: 5000,
          totalAmount: 5000,
          paidAmount: 5000,
          status: "paid",
          billingDate: todayStr,
          dueDate: todayStr,
        },
        authHeader
      );
      assert(res.status === 201 && res.data?.data?.amount === 5000, "POST /billing (Create second bill)");
      bill2Id = res.data?.data?._id || res.data?.data?.id;
    }

    {
      const res = await request(
        server,
        "GET",
        `/api/v1/billing?billTypeId=${billType1Id}`,
        null,
        authHeader
      );
      assert(res.status === 200 && res.data?.data?.length === 1, "GET /billing (Filter billing by billTypeId)");
    }

    console.log("\n------------------------------------------------------");
    console.log(" 5. Payments (Manual & Order-Free Receipts)");
    console.log("------------------------------------------------------");

    let payment1Id;
    let payment2Id;

    {
      const res = await request(
        server,
        "POST",
        "/api/v1/payments",
        {
          paymentMethod: "bKash",
          amount: 80000,
          totalAmount: 80000,
          paidAmount: 80000,
          status: "paid",
          paymentDate: yesterdayStr,
          paymentPhone: "01711223344",
          notes: "Wholesale client direct payment",
        },
        authHeader
      );
      assert(res.status === 201 && res.data?.data?.paidAmount === 80000, "POST /payments (Create manual payment without orderId)");
      payment1Id = res.data?.data?._id || res.data?.data?.id;
    }

    {
      const res = await request(
        server,
        "POST",
        "/api/v1/payments",
        {
          paymentMethod: "Bank Wire",
          amount: 40000,
          totalAmount: 40000,
          paidAmount: 40000,
          status: "paid",
          paymentDate: todayStr,
          notes: "Corporate client payment",
        },
        authHeader
      );
      assert(res.status === 201 && res.data?.data?.paidAmount === 40000, "POST /payments (Create second payment)");
      payment2Id = res.data?.data?._id || res.data?.data?.id;
    }

    console.log("\n------------------------------------------------------");
    console.log(" 6. Account Balance & Timeline Analytics (/accounts/balance)");
    console.log("------------------------------------------------------");

    {
      const res = await request(server, "GET", "/api/v1/accounts/balance?preset=all", null, authHeader);
      const data = res.data?.data;
      assert(res.status === 200, "GET /accounts/balance?preset=all (Endpoint response 200)");
      assert(data?.totalReceipt === 120000, "Account Balance totalReceipt equals 120,000", data?.totalReceipt);
      assert(data?.totalBills === 30000, "Account Balance totalBills equals 30,000", data?.totalBills);
      assert(data?.totalInvestments === 180000, "Account Balance totalInvestments equals 180,000", data?.totalInvestments);
      assert(data?.totalInvestmentsReturned === 150000, "Account Balance totalInvestmentsReturned equals 150,000", data?.totalInvestmentsReturned);
      assert(data?.netInvestments === 30000, "Account Balance netInvestments equals 30,000", data?.netInvestments);
      assert(data?.balance === 90000, "Account Balance balance equals 90,000 (120,000 - 30,000)", data?.balance);
      assert(data?.businessAsset === 60000, "Account Balance businessAsset equals 60,000 (90,000 - 30,000)", data?.businessAsset);
      assert(Array.isArray(data?.timeline) && data.timeline.length > 0, "Account Balance timeline array populated");
    }

    {
      const res = await request(server, "GET", "/api/v1/accounts/balance?preset=7days", null, authHeader);
      assert(
        res.status === 200 && Array.isArray(res.data?.data?.timeline) && res.data?.data?.timeline?.length >= 7,
        "GET /accounts/balance?preset=7days (Returns full 7-day timeline sequence)"
      );
    }

    {
      const res = await request(server, "GET", "/api/v1/accounts/balance?preset=30days", null, authHeader);
      assert(
        res.status === 200 && Array.isArray(res.data?.data?.timeline) && res.data?.data?.timeline?.length >= 30,
        "GET /accounts/balance?preset=30days (Returns full 30-day timeline sequence)"
      );
    }

    {
      const res = await request(server, "GET", "/api/v1/accounts/balance?preset=this_month", null, authHeader);
      assert(res.status === 200 && res.data?.data?.dateRange?.preset === "this_month", "GET /accounts/balance?preset=this_month");
    }

    console.log("\n------------------------------------------------------");
    console.log(" 7. Deletion & Cleanup Verification");
    console.log("------------------------------------------------------");

    {
      const resDel = await request(server, "DELETE", `/api/v1/accounts/investments/${investment3Id}`, null, authHeader);
      assert(resDel.status === 200, "DELETE /accounts/investments/:id (Delete investment)");
    }

    {
      const resDel = await request(server, "DELETE", `/api/v1/accounts/investors/${investor2Id}`, null, authHeader);
      assert(resDel.status === 200, "DELETE /accounts/investors/:id (Delete investor)");
    }

    {
      const resDel = await request(server, "DELETE", `/api/v1/accounts/bill-types/${billType2Id}`, null, authHeader);
      assert(resDel.status === 200, "DELETE /accounts/bill-types/:id (Delete bill type)");
    }

  } catch (error) {
    console.error("\n\x1b[31mCRITICAL ERROR DURING ACCOUNTS TESTS:\x1b[0m", error);
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

    console.log("\n======================================================");
    console.log(`ACCOUNTS TEST SUMMARY: \x1b[32m${passed} PASSED\x1b[0m | \x1b[31m${failed} FAILED\x1b[0m`);
    console.log("======================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  }
};

runAccountsTestSuite();
