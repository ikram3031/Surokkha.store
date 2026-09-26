import { Router } from "express";
import { listAllMedia } from "../controllers/ImagesController.js";

const imagesRouter = Router();

imagesRouter.get("/", listAllMedia);

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

export default imagesRouter;
