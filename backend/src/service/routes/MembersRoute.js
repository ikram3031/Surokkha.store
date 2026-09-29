import { Router } from "express";
import { createMember, getMemberById, listMembers, updateMember, deleteMember, registerMember, verifyMemberOtp, loginMember, checkMemberEmail, resendMemberOtp, forgotPassword, resetPassword, changeMemberPassword, refreshMemberToken, logoutMember } from "../controllers/MembersController.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const membersRouter = Router();

// Public member auth and email-verification flow.
membersRouter.post("/register", registerMember);
membersRouter.post("/login", loginMember);
membersRouter.post("/check-email", checkMemberEmail); // Step 1: verify email exist/verified status
membersRouter.post("/refresh-token", refreshMemberToken);
membersRouter.post("/logout", logoutMember);
membersRouter.post("/verify-otp", verifyMemberOtp);
membersRouter.post("/resend-otp", resendMemberOtp);
membersRouter.post("/forgot-password", forgotPassword);
membersRouter.post("/reset-password", resetPassword);

// Protected member management endpoints require an authenticated session.
membersRouter.use(authenticateToken);
membersRouter.post("/", createMember);
membersRouter.get("/", listMembers);
membersRouter.get("/:memberId", getMemberById);
membersRouter.post(
  "/:memberId/change-password",
  // authorizeRoles("Owner", "Admin", "Manager"),
  changeMemberPassword,
);
// membersRouter.put("/:memberId", authorizeRoles("super_admin", "admin", "store_manager"), updateMember);
membersRouter.put(
	"/:memberId",
	// authorizeRoles("super_admin", "admin", "store_manager"),
	updateMember,
);
membersRouter.delete("/:memberId", authorizeRoles("Owner", "Admin", "Manager"), deleteMember);

export default membersRouter;
