import { Router } from "express";
import {
  getSingleItem,
  listItems,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/ItemsController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";

const itemsRouter = Router();

// GET /api/items : Lists items with pagination, sorting, and search query parameters (e.g. ?q=keyword)
itemsRouter.get("/", listItems);

// POST /api/items/search : Lists items with complex filters and pagination in the request body
itemsRouter.post("/search", listItems);

// POST /api/items : Creates a new item (restricted to Owner, Admin, and Manager roles)
itemsRouter.post("/", authenticateToken, createItem);

// GET /api/items/:identifier : Retrieves details of a single item by its ObjectId or Slug
itemsRouter.get("/:identifier", getSingleItem);

// PUT /api/items/:id : Updates details of an existing item (restricted to Owner, Admin, and Manager roles)
itemsRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  updateItem,
);

// DELETE /api/items/:id : Deletes an item by its ID or Slug (restricted to Owner, Admin, and Manager roles)
itemsRouter.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager"),
  deleteItem,
);

export default itemsRouter;
