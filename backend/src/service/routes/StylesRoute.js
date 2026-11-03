import { Router } from "express";
import { getStyles, updateStyle } from "../controllers/StylesController.js";
import { authenticateToken, authorizeRoles, ADMINS } from "../../common/middlewares/auth.middleware.js";

const stylesRouter = Router();

stylesRouter.get("/", authenticateToken, authorizeRoles(ADMINS), getStyles);
stylesRouter.put("/:type", authenticateToken, authorizeRoles(ADMINS), updateStyle);

export default stylesRouter;
