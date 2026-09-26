import { Router } from "express";
import {
  getSingleProduct,
  listProducts,
} from "../controllers/ProductsController.js";

const productsRouter = Router();

// GET /api/v1/products : Lists products with pagination, sorting, and search query parameters
productsRouter.get("/", listProducts);

// POST /api/v1/products/search : Lists products with complex filters and pagination in request body
productsRouter.post("/search", listProducts);

// GET /api/v1/products/:identifier : Retrieves details of a single product by ObjectId or Slug
productsRouter.get("/:identifier", getSingleProduct);

export default productsRouter;
