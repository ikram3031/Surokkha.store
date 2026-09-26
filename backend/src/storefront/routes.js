import { Router } from "express";
import productsRouter from "./routes/ProductsRoute.js";
import reviewRouter from "./routes/ReviewRoute.js";
import imagesRouter from "./routes/ImagesRoute.js";
import authRouter from "./routes/AuthRoute.js";
import assetsRouter from "./routes/AssetsRoute.js";
import ordersRouter from "./routes/OrdersRoute.js";
import paymentsRouter from "./routes/PaymentsRoute.js";
import categoriesRouter from "./routes/CategoryRoute.js";
import brandRouter from "./routes/BrandRoute.js";
import couponRouter from "./routes/CouponRoute.js";
import searchRouter from "./routes/SearchRoute.js";
import subscriberRouter from "./routes/SubscriberRoute.js";
import contactRouter from "./routes/ContactRoute.js";
import storeUtilsRouter from "./routes/StoreUtilsRoute.js";
import sizeChartRouter from "./routes/SizeChartRoute.js";
import { searchProducts } from "./controllers/SearchController.js";

const storefrontRouter = Router();

storefrontRouter.use("/products", productsRouter);
storefrontRouter.use("/reviews", reviewRouter);
storefrontRouter.use("/images", imagesRouter);
storefrontRouter.use("/auth", authRouter);
storefrontRouter.use("/assets", assetsRouter);
storefrontRouter.use("/orders", ordersRouter);
storefrontRouter.use("/payments", paymentsRouter);
storefrontRouter.use("/categories", categoriesRouter);
storefrontRouter.use("/brands", brandRouter);
storefrontRouter.use("/coupons", couponRouter);
storefrontRouter.use("/size-charts", sizeChartRouter);
storefrontRouter.use("/subscribers", subscriberRouter);
storefrontRouter.use("/contact", contactRouter);
storefrontRouter.use("/store-utils", storeUtilsRouter);
storefrontRouter.use("/search", searchRouter);
storefrontRouter.get("/search-products", searchProducts);

// Resolves client IP from request headers or socket
storefrontRouter.get("/client-ip", (req, res) => {
  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
    req.socket?.remoteAddress ||
    "";
  res.json({ status: "success", ip });
});

export default storefrontRouter;
