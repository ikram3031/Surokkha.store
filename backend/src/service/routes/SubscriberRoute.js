import { Router } from "express";
import { createSubscriber } from "../controllers/SubscriberController.js";

const router = Router();

router.post("/", createSubscriber);

export default router;
