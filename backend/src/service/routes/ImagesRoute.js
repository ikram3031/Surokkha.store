import { Router } from "express";
import { uploadMiddleware, uploadProductImage, listAllMedia, bulkDeleteMedia } from "../controllers/ImagesController.js";
import { authenticateToken, authorizeRoles, ADMINS, OPERATORS, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const imagesRouter = Router();

// Retrieve all media files from /uploads with search & pagination (Accessible to all authenticated users)
imagesRouter.get("/", authenticateToken, authorizeRoles(ALL_STAFF), listAllMedia);

imagesRouter.get("/resize", async (req, res, next) => {
  try {
    const url = req.query.url;

    if (!url) {
      res.status(400).json({ status: "error", message: "query param `url` is required" });
      return;
    }

    res.redirect(String(url));
  } catch (err) {
    next(err);
  }
});

imagesRouter.post(
  "/upload",
  authenticateToken,
  authorizeRoles(OPERATORS),
  uploadMiddleware,
  uploadProductImage
);

imagesRouter.post(
  "/bulk-delete",
  authenticateToken,
  authorizeRoles(ADMINS),
  bulkDeleteMedia
);

export default imagesRouter;

