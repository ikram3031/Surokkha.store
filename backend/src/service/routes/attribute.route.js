import { Router } from "express";
import {
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from "../controllers/attribute.controller.js";
import { requireFeature } from "../../common/middlewares/feature.middleware.js";

const router = Router();

router.use(requireFeature("attribute"));

router.route("/attributes")
  .get(getAttributes);

router.route("/dashboard/attributes")
  .get(getAttributes)
  .post(createAttribute);

router.route("/dashboard/attributes/:id")
  .put(updateAttribute)
  .delete(deleteAttribute);

export default router;
