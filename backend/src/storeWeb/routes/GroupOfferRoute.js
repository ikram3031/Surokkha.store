import express from "express";
import { listGroupOffers, getGroupOffer } from "../controllers/GroupOfferController.js";

const router = express.Router();

router.get("/", listGroupOffers);
router.get("/:identifier", getGroupOffer);

export default router;
