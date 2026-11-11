import { Router } from "express";
import { getPromo, publicPromo } from "../../common/utils/promo.js";

const router = Router();

// GET /promo — the active promo banner and preset offers, for both storefronts
router.get("/", async (_req, res) => {
  try {
    res.json({ status: "success", data: publicPromo(await getPromo()) });
  } catch {
    res.status(500).json({ status: "error", message: "Unable to load promo" });
  }
});

export default router;
