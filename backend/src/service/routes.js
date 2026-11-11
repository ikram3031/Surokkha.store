import { Router } from "express";
import { accessArea, clearAccessArea } from "../common/middlewares/auth.middleware.js";
import express from "express";
import dashProductRouter from "./routes/dashProduct.route.js";
import dashAssetsRouter from "./routes/dashAssets.route.js";
import productsRouter from "./routes/ProductsRoute.js";
import itemsRouter from "./routes/ItemsRoute.js";
import reviewRouter from "./routes/ReviewRoute.js";
import imagesRouter from "./routes/ImagesRoute.js";
import authRouter from "./routes/AuthRoute.js";
import usersRouter from "./routes/UsersRoute.js";
import assetsRouter from "./routes/AssetsRoute.js";
import membersRouter from "./routes/MembersRoute.js";
import emailRouter from "./routes/EmailRoute.js";
import ordersRouter from "./routes/OrdersRoute.js";
import paymentsRouter from "./routes/PaymentsRoute.js";
import billingRouter from "./routes/BillingRoute.js";
import accountAttachmentRouter from "./routes/AccountAttachmentRoute.js";
import accountsRouter from "./routes/AccountsRoute.js";
import billTypeRouter from "./routes/BillTypeRoute.js";
import paymentTypeRouter from "./routes/PaymentTypeRoute.js";
import investorRouter from "./routes/InvestorRoute.js";
import investmentRouter from "./routes/InvestmentRoute.js";
import accountBalanceRouter from "./routes/AccountBalanceRoute.js";
import plexiviaSyncRouter from "./routes/PlexiviaSyncRoute.js";
import supportRouter from "./routes/SupportRoute.js";
import categoriesRouter from "./routes/CategoryRoute.js";
import brandRouter from "./routes/BrandRoute.js";
import dashboardRouter from "./routes/DashboardRoute.js";
import couponRouter from "./routes/CouponRoute.js";
import groupOfferRouter from "./routes/GroupOfferRoute.js";
import directOfferRouter from "./routes/DirectOfferRoute.js";
import comboRouter from "./routes/ComboRoute.js";
import systemRouter from "./routes/SystemRoute.js";
import searchRouter from "./routes/SearchRoute.js";
import logsRouter from "./routes/LogsRoute.js";
import subscriberRouter from "./routes/SubscriberRoute.js";
import contactRouter from "./routes/ContactRoute.js";
import checkoutLeadRouter from "./routes/CheckoutLeadRoute.js";
import productAnalyticsRouter from "./routes/ProductAnalyticsRoute.js";
import inventoryRouter from "./routes/InventoryRoute.js";
import stockItemRouter from "./routes/StockItemRoute.js";
import purchaseRouter from "./routes/PurchaseRoute.js";
import webmailRouter from "./routes/WebmailRoute.js";
import storeUtilsRouter from "./routes/StoreUtilsRoute.js";
import reportsRouter from "./routes/ReportsRoute.js";
import sizeChartRouter from "./routes/SizeChartRoute.js";
import cmsContentRouter from "./routes/CmsContentRoute.js";
import settingsRouter from "./routes/SettingsRoute.js";
import telemetryRouter from "./routes/TelemetryRoute.js";
import attributeRouter from "./routes/attribute.route.js";
import mediaAuditRouter from "./routes/mediaAuditRoute.js";
import developerRouter from "./routes/DeveloperRoute.js";
import courierRouter from "./routes/CourierRoute.js";
import customerRouter from "./routes/CustomerRoute.js";
import { searchProducts } from "./controllers/SearchController.js";
import stylesRouter from "./routes/StylesRoute.js";
import blogRouter from "./routes/BlogRoute.js";

const serviceRouter = Router();

// Dashboard admin and business management service routes.
// accessArea tags each router with the dashboard menus that unlock it, so a user granted that menu
// (Accountant defaults, or per-user extras set by the Owner) passes its role checks; see auth.middleware.js.
serviceRouter.use("/styles", stylesRouter);
serviceRouter.use("/dash/products", accessArea({ catalog: "operator", inventory: "read", sales: "read" }), dashProductRouter, clearAccessArea);
serviceRouter.use("/dash/assets", accessArea({ media: "operator" }), dashAssetsRouter, clearAccessArea);
serviceRouter.use("/products", accessArea({ catalog: "operator", inventory: "read", sales: "read" }), productsRouter, clearAccessArea);
serviceRouter.use("/items", accessArea({ catalog: "operator", inventory: "read" }), itemsRouter, clearAccessArea);
serviceRouter.use("/reviews", accessArea({ catalog: "operator" }), reviewRouter, clearAccessArea);
serviceRouter.use("/images", accessArea({ catalog: "operator", media: "operator" }), imagesRouter, clearAccessArea);
serviceRouter.use("/auth", authRouter);
serviceRouter.use("/users", usersRouter);
serviceRouter.use("/assets", accessArea({ media: "operator" }), assetsRouter, clearAccessArea);
serviceRouter.use("/members", accessArea({ customers: "operator" }), membersRouter, clearAccessArea);
serviceRouter.use("/sendEmail", emailRouter);
serviceRouter.use("/orders", accessArea({ sales: "operator" }), ordersRouter, clearAccessArea);
serviceRouter.use("/bill-types", accessArea({ accounts: "admin" }), billTypeRouter, clearAccessArea);
serviceRouter.use("/accounts/bill-types", accessArea({ accounts: "admin" }), billTypeRouter, clearAccessArea);
serviceRouter.use("/payment-types", accessArea({ accounts: "admin", sales: "operator" }), paymentTypeRouter, clearAccessArea);
serviceRouter.use("/payment-methods", accessArea({ accounts: "admin", sales: "operator" }), paymentTypeRouter, clearAccessArea);
serviceRouter.use("/accounts/payment-types", accessArea({ accounts: "admin", sales: "operator" }), paymentTypeRouter, clearAccessArea);
serviceRouter.use("/accounts/payment-methods", accessArea({ accounts: "admin", sales: "operator" }), paymentTypeRouter, clearAccessArea);
serviceRouter.use("/payments/types", accessArea({ accounts: "admin", sales: "operator" }), paymentTypeRouter, clearAccessArea);
serviceRouter.use("/payments/methods", accessArea({ accounts: "admin", sales: "operator" }), paymentTypeRouter, clearAccessArea);
serviceRouter.use("/accounts/bills/payment-methods", accessArea({ accounts: "admin", sales: "operator" }), paymentTypeRouter, clearAccessArea);
serviceRouter.use("/payments", accessArea({ accounts: "admin" }), paymentsRouter, clearAccessArea);
serviceRouter.use("/billing", accessArea({ accounts: "admin" }), billingRouter, clearAccessArea);
serviceRouter.use("/bills", accessArea({ accounts: "admin" }), billingRouter, clearAccessArea);
serviceRouter.use("/accounts/bills", accessArea({ accounts: "admin" }), billingRouter, clearAccessArea);
serviceRouter.use("/accounts/attachments", accessArea({ accounts: "admin" }), accountAttachmentRouter, clearAccessArea);
serviceRouter.use("/accounts", accessArea({ accounts: "admin" }), accountsRouter, clearAccessArea);
serviceRouter.use("/accounts/investors", accessArea({ accounts: "admin" }), investorRouter, clearAccessArea);
serviceRouter.use("/accounts/investments", accessArea({ accounts: "admin" }), investmentRouter, clearAccessArea);
serviceRouter.use("/investors", accessArea({ accounts: "admin" }), investorRouter, clearAccessArea);
serviceRouter.use("/investments", accessArea({ accounts: "admin" }), investmentRouter, clearAccessArea);
serviceRouter.use("/accounts/balance", accessArea({ accounts: "admin" }), accountBalanceRouter, clearAccessArea);
serviceRouter.use("/balance", accessArea({ accounts: "admin" }), accountBalanceRouter, clearAccessArea);
serviceRouter.use("/plexivia", plexiviaSyncRouter);
serviceRouter.use("/support", accessArea({ support: "operator" }), supportRouter, clearAccessArea);
serviceRouter.use("/categories", accessArea({ catalog: "operator" }), categoriesRouter, clearAccessArea);
serviceRouter.use("/brands", accessArea({ catalog: "operator" }), brandRouter, clearAccessArea);
serviceRouter.use("/dashboard", accessArea({ overview: "read", analytics: "read" }), dashboardRouter, clearAccessArea);
serviceRouter.use("/coupons", accessArea({ catalog: "operator" }), couponRouter, clearAccessArea);
serviceRouter.use("/group-offers", accessArea({ catalog: "operator" }), groupOfferRouter, clearAccessArea);
serviceRouter.use("/direct-offers", accessArea({ catalog: "operator" }), directOfferRouter, clearAccessArea);
serviceRouter.use("/combos", accessArea({ catalog: "operator" }), comboRouter, clearAccessArea);
serviceRouter.use("/size-charts", accessArea({ catalog: "operator" }), sizeChartRouter, clearAccessArea);
serviceRouter.use("/cms-content", cmsContentRouter);
serviceRouter.use("/dashboard/size-charts", accessArea({ catalog: "operator" }), sizeChartRouter, clearAccessArea);
serviceRouter.use("/system", systemRouter);
serviceRouter.use("/subscribers", subscriberRouter);
serviceRouter.use("/checkout-leads", accessArea({ sales: "operator" }), checkoutLeadRouter, clearAccessArea);
serviceRouter.use("/product-analytics", accessArea({ analytics: "operator" }), productAnalyticsRouter, clearAccessArea);
serviceRouter.use("/inventory", accessArea({ inventory: "operator" }), inventoryRouter, clearAccessArea);
serviceRouter.use("/stock-items", accessArea({ inventory: "operator" }), stockItemRouter, clearAccessArea);
serviceRouter.use("/purchases", accessArea({ inventory: "admin", accounts: "admin" }), purchaseRouter, clearAccessArea);
serviceRouter.use("/contact", accessArea({ support: "operator" }), contactRouter, clearAccessArea);
serviceRouter.use("/webmail", accessArea({ webmail: "operator" }), webmailRouter, clearAccessArea);
serviceRouter.use("/store-utils", storeUtilsRouter);
serviceRouter.use("/settings", settingsRouter);
serviceRouter.use("/telemetry", telemetryRouter);
serviceRouter.use("/search", searchRouter);
serviceRouter.use("/logs", accessArea({ notifications: "operator" }), logsRouter, clearAccessArea);
serviceRouter.use("/reports", accessArea({ reports: "operator" }), reportsRouter, clearAccessArea);
serviceRouter.use("/developer", developerRouter);
serviceRouter.use(accessArea({ catalog: "operator" }), attributeRouter, clearAccessArea);
serviceRouter.use("/attribute", accessArea({ catalog: "operator" }), attributeRouter, clearAccessArea);
serviceRouter.use("/courier", accessArea({ sales: "operator" }), courierRouter, clearAccessArea);
serviceRouter.use("/customers", accessArea({ customers: "operator", sales: "operator" }), customerRouter, clearAccessArea);
serviceRouter.use("/blog", accessArea({ blog: "operator" }), blogRouter, clearAccessArea);
serviceRouter.use("/admin/media-audit", mediaAuditRouter);
serviceRouter.get("/search-products", searchProducts);

// Resolves client IP from request headers or socket
serviceRouter.get("/client-ip", (req, res) => {
  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
    req.socket?.remoteAddress ||
    "";
  res.json({ status: "success", ip });
});

export default serviceRouter;
