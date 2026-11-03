import { Router } from "express";
import {
  createSuperAdmin,
  login,
  requestPasswordHelp,
  refreshToken,
  logout,
  googleAuth,
  verifyInviteToken,
  acceptInvite,
} from "../controllers/AuthController.js";
import { sendQrCodeEmail, verify2fa, resetUser2fa } from "../controllers/TwoFactorController.js";
import { authenticateToken, authorizeRoles, OWNER_ONLY } from "../../common/middlewares/auth.middleware.js";
import { limitCredentialAttempts, limitEmailRequests } from "../../common/middlewares/rateLimit.middleware.js";

const authRouter = Router();

authRouter.post("/login", limitCredentialAttempts, login);
authRouter.post("/forgot-password", limitEmailRequests, requestPasswordHelp);
authRouter.post("/google", limitCredentialAttempts, googleAuth);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/logout", logout);
authRouter.post("/2fa/send-qr", limitEmailRequests, sendQrCodeEmail);
authRouter.post("/2fa/verify", limitCredentialAttempts, verify2fa);
authRouter.post("/2fa/reset", authenticateToken, authorizeRoles(OWNER_ONLY), resetUser2fa);

// User Invitation & Onboarding Endpoints
authRouter.get("/invite/verify", verifyInviteToken);
authRouter.post("/invite/accept", limitCredentialAttempts, acceptInvite);

// Creation of the Owner / super-admin is intentionally disabled by default.
// If you need to create an Owner, enable the endpoint below in a controlled environment.
// authRouter.post("/create-super-admin", createSuperAdmin);

export default authRouter;
