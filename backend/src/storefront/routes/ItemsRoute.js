import { Router } from "express";
import {
  getSingleItem,
  getMetaCatalogCsv,
  listItems,
} from "../controllers/ItemsController.js";

const itemsRouter = Router();

// GET /api/v1/items : Lists items with pagination, sorting, and search query parameters
itemsRouter.get("/", listItems);

// POST /api/v1/items/search : Lists items with complex filters and pagination in request body
itemsRouter.post("/search", listItems);

// GET /api/v1/items/feed/meta-catalog.csv : Dynamic CSV feed for Meta Commerce Manager
itemsRouter.get("/feed/meta-catalog.csv", getMetaCatalogCsv);
itemsRouter.get("/feed/meta-catalog-store.csv", getMetaCatalogCsv);
itemsRouter.get("/feed/meta-catalog-shop.csv", getMetaCatalogCsv);

// GET /api/v1/items/:identifier : Retrieves details of a single item by ObjectId, DID, or Slug
itemsRouter.get("/:identifier", getSingleItem);

export default itemsRouter;
