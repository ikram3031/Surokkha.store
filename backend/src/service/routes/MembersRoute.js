import { Router } from "express";
import { createMember, getMemberById, listMembers, updateMember, deleteMember, changeMemberPassword } from "../controllers/MembersController.js";
import { authenticateToken, authorizeRoles, MANAGERS, OPERATORS } from "../../common/middlewares/auth.middleware.js";

const membersRouter = Router();

// Customer records are managed by staff here; customers sign in through the customer-auth API.
membersRouter.use(authenticateToken);
membersRouter.get("/", authorizeRoles(OPERATORS), listMembers);
membersRouter.get("/:memberId", authorizeRoles(OPERATORS), getMemberById);
membersRouter.post("/", authorizeRoles(MANAGERS), createMember);
membersRouter.post("/:memberId/change-password", authorizeRoles(MANAGERS), changeMemberPassword);
membersRouter.put("/:memberId", authorizeRoles(MANAGERS), updateMember);
membersRouter.delete("/:memberId", authorizeRoles(MANAGERS), deleteMember);

export default membersRouter;
