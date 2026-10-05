import { Router } from "express";
import { getStyles, updateStyle } from "../controllers/StylesController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const stylesRouter = Router();

stylesRouter.get("/", authenticateToken, getStyles);
stylesRouter.put("/:type", authenticateToken, authorizeRoles("Owner", "Admin"), updateStyle);

export default stylesRouter;
