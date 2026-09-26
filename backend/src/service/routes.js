import { Router } from "express";
import express from "express";
import dashProductRouter from "./routes/dashProduct.route.js";
import dashAssetsRouter from "./routes/dashAssets.route.js";
import productsRouter from "./routes/ProductsRoute.js";
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
import categoriesRouter from "./routes/CategoryRoute.js";
import brandRouter from "./routes/BrandRoute.js";
import dashboardRouter from "./routes/DashboardRoute.js";
import couponRouter from "./routes/CouponRoute.js";
import systemRouter from "./routes/SystemRoute.js";
import searchRouter from "./routes/SearchRoute.js";
import studioRouter from "./routes/studio.js";
import logsRouter from "./routes/LogsRoute.js";
import subscriberRouter from "./routes/SubscriberRoute.js";
import contactRouter from "./routes/ContactRoute.js";
import webmailRouter from "./routes/WebmailRoute.js";
import storeUtilsRouter from "./routes/StoreUtilsRoute.js";
import reportsRouter from "./routes/ReportsRoute.js";
import sizeChartRouter from "./routes/SizeChartRoute.js";
import settingsRouter from "./routes/SettingsRoute.js";
import telemetryRouter from "./routes/TelemetryRoute.js";
import attributeRouter from "./routes/attribute.route.js";
import mediaAuditRouter from "./routes/mediaAuditRoute.js";
import developerRouter from "./routes/DeveloperRoute.js";
import { searchProducts } from "./controllers/SearchController.js";

const serviceRouter = Router();

// Dashboard admin and business management service routes
serviceRouter.use("/dash/products", dashProductRouter);
serviceRouter.use("/dash/assets", dashAssetsRouter);
serviceRouter.use("/products", productsRouter);
serviceRouter.use("/reviews", reviewRouter);
serviceRouter.use("/images", imagesRouter);
serviceRouter.use("/auth", authRouter);
serviceRouter.use("/users", usersRouter);
serviceRouter.use("/assets", assetsRouter);
serviceRouter.use("/members", membersRouter);
serviceRouter.use("/sendEmail", emailRouter);
serviceRouter.use("/orders", ordersRouter);
serviceRouter.use("/payments", paymentsRouter);
serviceRouter.use("/billing", billingRouter);
serviceRouter.use("/categories", categoriesRouter);
serviceRouter.use("/brands", brandRouter);
serviceRouter.use("/dashboard", dashboardRouter);
serviceRouter.use("/coupons", couponRouter);
serviceRouter.use("/size-charts", sizeChartRouter);
serviceRouter.use("/dashboard/size-charts", sizeChartRouter);
serviceRouter.use("/system", systemRouter);
serviceRouter.use("/subscribers", subscriberRouter);
serviceRouter.use("/contact", contactRouter);
serviceRouter.use("/webmail", webmailRouter);
serviceRouter.use("/store-utils", storeUtilsRouter);
serviceRouter.use("/settings", settingsRouter);
serviceRouter.use("/telemetry", telemetryRouter);
serviceRouter.use("/search", searchRouter);
serviceRouter.use("/logs", logsRouter);
serviceRouter.use("/reports", reportsRouter);
serviceRouter.use("/studio", express.json({ limit: "60mb" }), studioRouter);
serviceRouter.use("/developer", developerRouter);
serviceRouter.use("/attribute", attributeRouter);
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
