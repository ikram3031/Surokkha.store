import { Router } from "express";
// Same capture logic and collection as the shop API, so the dashboard shows both storefronts together
import { recordPageView } from "../../storefront/controllers/PageViewController.js";

const pageViewRouter = Router();

// POST /store/v1/page-views : page view tracking for the dashboard Pages report
pageViewRouter.post("/", (req, res) => {
  req.pageViewSite = "store";
  return recordPageView(req, res);
});

export default pageViewRouter;
