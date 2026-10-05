import { Router } from "express";
import { getStyles, updateStyle } from "../controllers/StylesController.js";

const stylesRouter = Router();

stylesRouter.get("/", getStyles);
stylesRouter.patch("/:id", updateStyle);
stylesRouter.put("/:id", updateStyle);

export default stylesRouter;
