import { Router } from "express";
import {
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from "../controllers/attribute.controller.js";
import { requireFeature } from "../../common/middlewares/feature.middleware.js";
import { authenticateToken, authorizeRoles, OPERATORS, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const router = Router();

const guard = requireFeature("attribute");

router.route("/attributes")
  .get(guard, getAttributes);

router.route("/dashboard/attributes")
  .get(guard, authenticateToken, authorizeRoles(ALL_STAFF), getAttributes)
  .post(guard, authenticateToken, authorizeRoles(OPERATORS), createAttribute);

router.route("/dashboard/attributes/:id")
  .put(guard, authenticateToken, authorizeRoles(OPERATORS), updateAttribute)
  .delete(guard, authenticateToken, authorizeRoles(OPERATORS), deleteAttribute);

export default router;
