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
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const usersRouter = Router();

// Require authentication for user management endpoints
usersRouter.use(authenticateToken);

// User's own profile routes
usersRouter.get("/me", getProfile);
usersRouter.put("/me", updateProfile);
usersRouter.post("/me/avatar", avatarUploadMiddleware, uploadProfileAvatar);

// Only Owner and Admin may manage users
usersRouter.get("/", authorizeRoles("Owner", "Admin"), listUsers);
usersRouter.get("/:userId", authorizeRoles("Owner", "Admin"), getUserById);
usersRouter.post("/", authorizeRoles("Owner", "Admin"), createUser);
usersRouter.post("/:userId/resend-invite", authorizeRoles("Owner", "Admin"), resendInvitation);
usersRouter.post("/:userId/reset-password", authorizeRoles("Owner", "Admin"), resetUserPassword);
usersRouter.put("/:userId", authorizeRoles("Owner", "Admin"), updateUser);
usersRouter.delete("/:userId", authorizeRoles("Owner", "Admin"), deleteUser);

export default usersRouter;
