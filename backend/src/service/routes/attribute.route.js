import { Router } from "express";
import {
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from "../controllers/attribute.controller.js";
import { requireFeature } from "../../common/middlewares/feature.middleware.js";

const router = Router();

const guard = requireFeature("attribute");

router.route("/attributes")
  .get(guard, getAttributes);

router.route("/dashboard/attributes")
  .get(guard, getAttributes)
  .post(guard, createAttribute);

router.route("/dashboard/attributes/:id")
  .put(guard, updateAttribute)
  .delete(guard, deleteAttribute);

export default router;
