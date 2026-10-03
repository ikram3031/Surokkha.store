import { Router } from "express";

import { createUser, deleteUser, getUserById, listUsers, updateUser, getProfile, updateProfile, resendInvitation } from "../controllers/UsersController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const usersRouter = Router();

// Require authentication for user management endpoints
usersRouter.use(authenticateToken);

// User's own profile routes
usersRouter.get("/me", getProfile);
usersRouter.put("/me", updateProfile);

// Only Owner and Admin may manage users
usersRouter.get("/", authorizeRoles("Owner", "Admin"), listUsers);
usersRouter.get("/:userId", authorizeRoles("Owner", "Admin"), getUserById);
usersRouter.post("/", authorizeRoles("Owner", "Admin"), createUser);
usersRouter.post("/:userId/resend-invite", authorizeRoles("Owner", "Admin"), resendInvitation);
usersRouter.put("/:userId", authorizeRoles("Owner", "Admin"), updateUser);
usersRouter.delete("/:userId", authorizeRoles("Owner", "Admin"), deleteUser);

export default usersRouter;
