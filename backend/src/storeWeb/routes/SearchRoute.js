import { Router } from "express";
import {
  searchProducts,
  getRecentSearches,
  getPopularSearches,
} from "../controllers/SearchController.js";
import { authenticateToken } from "../../common/middlewares/auth.middleware.js";

const searchRouter = Router();

const optionalAuthenticateToken = async (req, res, next) => {
  if (req.headers.authorization) {
    try {
      await authenticateToken(req, res, next);
      return;
    } catch {
      // Proceed unauthenticated if token is invalid
    }
  }
  next();
};

// GET /api/v1/search?q=term&limit=12
searchRouter.get("/", optionalAuthenticateToken, searchProducts);

// GET /api/v1/search/popular
searchRouter.get("/popular", getPopularSearches);

// GET /api/v1/search/recent
searchRouter.get("/recent", authenticateToken, getRecentSearches);

export default searchRouter;
