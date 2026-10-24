import { Router } from "express";
import {
  getSingleProduct,
  getMetaCatalogCsv,
  getOfferCatalogCsv,
  listProducts,
} from "../controllers/ProductsController.js";

const productsRouter = Router();

// GET /api/v1/products : Lists products with pagination, sorting, and search query parameters
productsRouter.get("/", listProducts);

// POST /api/v1/products/search : Lists products with complex filters and pagination in request body
productsRouter.post("/search", listProducts);

// GET /api/v1/products/:identifier : Retrieves details of a single product by ObjectId or Slug

// GET /api/v1/products/feed/meta-catalog.csv : Dynamic CSV feed for Meta Commerce Manager
productsRouter.get("/feed/meta-catalog.csv", getMetaCatalogCsv);
productsRouter.get("/feed/meta-catalog-store.csv", getMetaCatalogCsv);
productsRouter.get("/feed/meta-catalog-shop.csv", getMetaCatalogCsv);
// GET /store/v1/products/feed/meta-catalog-offer.csv : live feed of the products offer.surokkha.shop shows
productsRouter.get("/feed/meta-catalog-offer.csv", getOfferCatalogCsv);

productsRouter.get("/:identifier", getSingleProduct);

export default productsRouter;
