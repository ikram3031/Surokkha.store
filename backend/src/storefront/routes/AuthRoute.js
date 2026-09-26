import { Router } from "express";
import {
  login,
  refreshToken,
  logout,
  googleAuth,
} from "../controllers/AuthController.js";
import { sendQrCodeEmail, verify2fa } from "../controllers/TwoFactorController.js";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/google", googleAuth);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/logout", logout);
authRouter.post("/2fa/send-qr", sendQrCodeEmail);
authRouter.post("/2fa/verify", verify2fa);

export default authRouter;
