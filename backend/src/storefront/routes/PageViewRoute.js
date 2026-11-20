import { Router } from "express";
import { recordPageView } from "../controllers/PageViewController.js";

const pageViewRouter = Router();

// POST /api/v1/page-views : page view tracking for the dashboard Pages report
pageViewRouter.post("/", recordPageView);

export default pageViewRouter;
