import { Router } from "express";

import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
  getProfile,
  updateProfile,
  avatarUploadMiddleware,
  uploadProfileAvatar,
  resendInvitation,
  resetUserPassword,
} from "../controllers/UsersController.js";
import { authenticateToken, authorizeRoles, ADMINS } from "../../common/middlewares/auth.middleware.js";
import { alertOwnersOnAdminAction } from "../../common/utils/ownerAlerts.js";

const usersRouter = Router();

// Require authentication for user management endpoints
usersRouter.use(authenticateToken);

// User's own profile routes
usersRouter.get("/me", getProfile);
usersRouter.put("/me", updateProfile);
usersRouter.post("/me/avatar", avatarUploadMiddleware, uploadProfileAvatar);

// Only Owner and Admin may manage users
usersRouter.get("/", authorizeRoles(ADMINS), listUsers);
usersRouter.get("/:userId", authorizeRoles(ADMINS), getUserById);
usersRouter.post("/", authorizeRoles(ADMINS), alertOwnersOnAdminAction("Created a system user"), createUser);
usersRouter.post("/:userId/resend-invite", authorizeRoles(ADMINS), resendInvitation);
usersRouter.post("/:userId/reset-password", authorizeRoles(ADMINS), alertOwnersOnAdminAction("Reset a system user password"), resetUserPassword);
usersRouter.put("/:userId", authorizeRoles(ADMINS), alertOwnersOnAdminAction("Updated a system user"), updateUser);
usersRouter.delete("/:userId", authorizeRoles(ADMINS), alertOwnersOnAdminAction("Deleted a system user"), deleteUser);

export default usersRouter;
