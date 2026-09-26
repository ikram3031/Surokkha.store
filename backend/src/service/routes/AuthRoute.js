import { Router } from "express";
import {
  createSuperAdmin,
  login,
  refreshToken,
  logout,
  googleAuth,
  verifyInviteToken,
  acceptInvite,
} from "../controllers/AuthController.js";
import { sendQrCodeEmail, verify2fa } from "../controllers/TwoFactorController.js";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/google", googleAuth);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/logout", logout);
authRouter.post("/2fa/send-qr", sendQrCodeEmail);
authRouter.post("/2fa/verify", verify2fa);

// User Invitation & Onboarding Endpoints
authRouter.get("/invite/verify", verifyInviteToken);
authRouter.post("/invite/accept", acceptInvite);

// Creation of the Owner / super-admin is intentionally disabled by default.
// If you need to create an Owner, enable the endpoint below in a controlled environment.
// authRouter.post("/create-super-admin", createSuperAdmin);

export default authRouter;
