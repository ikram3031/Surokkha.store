import { Router } from "express";
import { bumpDeployVersion, listDeployVersions } from "../controllers/DeployController.js";
import { authenticateToken, authorizeRoles, ADMINS } from "../../common/middlewares/auth.middleware.js";

const deployRouter = Router();

// Called by `make deploy` on the VPS with X-Deploy-Token (no user session)
deployRouter.post("/bump", bumpDeployVersion);
deployRouter.get("/versions", authenticateToken, authorizeRoles(ADMINS), listDeployVersions);

export default deployRouter;
