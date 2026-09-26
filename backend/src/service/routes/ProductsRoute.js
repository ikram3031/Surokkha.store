import { Router } from "express";
import {
  getSingleProduct,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/ProductsController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";

const productsRouter = Router();

// GET /api/products : Lists products with pagination, sorting, and search query parameters (e.g. ?q=keyword)
productsRouter.get("/", listProducts);

// POST /api/products/search : Lists products with complex filters and pagination in the request body
productsRouter.post("/search", listProducts);

// POST /api/products : Creates a new product (restricted to Owner, Admin, and Manager roles)
productsRouter.post("/", authenticateToken, createProduct);

// GET /api/products/:identifier : Retrieves details of a single product by its ObjectId or Slug
productsRouter.get("/:identifier", getSingleProduct);

// PUT /api/products/:id : Updates details of an existing product (restricted to Owner, Admin, and Manager roles)
productsRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  updateProduct,
);

// DELETE /api/products/:id : Deletes a product by its ID or Slug (restricted to Owner, Admin, and Manager roles)
productsRouter.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  deleteProduct,
);

export default productsRouter;
