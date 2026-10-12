# 16. System Users & Staff: Admin Password Reset Feature

## 1. Overview & Objective
In multi-user administrative dashboards, administrators and store owners frequently need to reset passwords for staff members who forget credentials, need initial account provisioning, or require immediate credential rotation after offboarding/re-assignment.

This document details the implementation of the **Reset Password** feature directly accessible from the **System Users & Staff** table action menu (`...`) in the Admin Dashboard, along with strong role hierarchy safeguards, cryptographic validation, and audit logging.

---

## 2. Key Requirements & Role Hierarchy Safeguards

1. **Role-Based Access Control (RBAC):**
   - **Owner:** Can reset passwords for any user (Owner, Admin, Staff, Courier Manager, etc.).
   - **Admin:** Can reset passwords for standard staff members, but **CANNOT** reset passwords for `Owner` accounts (enforced on both client-side and server-side with HTTP 403 Forbidden).
   - **Other roles:** Cannot access user management endpoints.

2. **Security & Cryptography:**
   - Minimum password length: 6 characters.
   - Confirmation validation (`password === confirmPassword`).
   - Bcrypt salt hashing via `hashPassword(password)`.
   - Clearing pending invite tokens (`inviteToken: null`, `inviteExpiresAt: null`) and auto-activating the user (`isActive: true`).
   - Audit trail recorded in `LogModel` (`USERS_UPDATE` event with requester details and target user ID).

3. **User Experience:**
   - Directly available in the action dropdown menu (`DropdownMenuItem` with `KeyRound` icon).
   - Interactive dialog modal (`ResetPasswordDialog`) displaying user avatar, name, email, and current role.
   - Built-in **"Generate Strong Password"** button: generates a high-entropy, 10-character password combining uppercase, lowercase, numbers, and symbols, and copies it immediately to the clipboard.
   - Show/hide password toggles for verification.
   - Immediate feedback via Sonner toasts and inline alerts.

---

## 3. Backend Architecture

### 3.1 Validation Helper (`backend/src/common/helper/userControllerHelper.js`)
Added `validateResetPasswordPayload` and relaxed `validateUpdateUserPayload` to support partial updates:

```javascript
/**
 * Validate payload for resetting a user's password
 */
export const validateResetPasswordPayload = (payload) => {
  const errors = [];
  const { password, confirmPassword } = payload || {};

  if (!password || typeof password !== "string" || password.trim().length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push("Passwords do not match");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

### 3.2 Service Controller (`backend/src/service/controllers/UsersController.js`)
Controller method: `resetUserPassword`:

```javascript
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password, confirmPassword } = req.body || {};

    const validation = validateResetPasswordPayload({ password, confirmPassword });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0] || 'Invalid password payload',
        errors: validation.errors,
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Role Hierarchy Guard: Only Owner can reset an Owner's password
    const requesterRole = req.user?.role;
    if (user.role === 'Owner' && requesterRole !== 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Only an Owner can reset another Owner\'s password',
      });
    }

    const passwordHash = await hashPassword(password.trim());
    user.passwordHash = passwordHash;
    user.inviteToken = null;
    user.inviteExpiresAt = null;
    user.isActive = true;
    await user.save();

    // Audit Log
    try {
      await LogModel.create({
        actorId: req.user?._id || req.user?.id,
        actorType: 'User',
        actorName: req.user?.name || 'Administrator',
        action: 'USERS_UPDATE',
        entityType: 'User',
        entityId: user._id,
        description: `Reset password for user "${user.name}" (${user.email}) by ${req.user?.name || requesterRole}`,
        metadata: {
          targetUserId: user._id,
          targetEmail: user.email,
          targetRole: user.role,
          requesterRole,
        },
      });
    } catch (logErr) {
      console.warn('[UsersController] Audit log creation failed:', logErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Password has been reset successfully for user ${user.name}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password',
    });
  }
};
```

### 3.3 Routing (`backend/src/service/routes/UsersRoute.js`)
Protected with `authenticateJWT` and `authorizeRoles('Owner', 'Admin')`:

```javascript
router.post(
  '/:userId/reset-password',
  authenticateJWT,
  authorizeRoles('Owner', 'Admin'),
  resetUserPassword
);
```

---

## 4. Frontend Implementation

### 4.1 Reset Password Modal (`dashboard/src/components/dashboard/reset-password-dialog.jsx`)
Features included:
- **Entropy Password Generator:** Generates a secure random password using uppercase, lowercase, numbers, and special symbols (`@#$%&*!`).
- **One-click Clipboard Copy:** Automatically copies generated passwords to clipboard with toast notification.
- **Show/Hide Password:** Dual toggle for password and confirmation fields.
- **Visual Staff Profile Card:** Displays the target user's avatar, name, email, and role badge inside the modal.
- **Clean State Reset:** Clears form state and validation errors on modal open/close.

### 4.2 System Users Table Menu (`dashboard/src/components/dashboard/system-users-table.jsx`)
Integrated into the three-dot (`...`) dropdown menu:

```jsx
<DropdownMenuItem
  onClick={() => {
    setSelectedUserForPasswordReset(user);
    setIsResetPasswordOpen(true);
  }}
  disabled={currentUser?.role === 'Admin' && user.role === 'Owner'}
  className="cursor-pointer font-medium"
>
  <KeyRound className="mr-2 h-4 w-4 text-amber-500" />
  Reset Password
</DropdownMenuItem>
```

---

## 5. File Synchronization & Verification

The feature has been implemented, validated, and synchronized across both repositories:

| File Path | Description |
|---|---|
| `backend/src/common/helper/userControllerHelper.js` | Added `validateResetPasswordPayload`, relaxed `validateUpdateUserPayload` |
| `backend/src/service/controllers/UsersController.js` | Added `resetUserPassword` with RBAC guard and audit logging |
| `backend/src/service/routes/UsersRoute.js` | Registered `POST /:userId/reset-password` |
| `dashboard/src/components/dashboard/reset-password-dialog.jsx` | Created interactive password reset dialog |
| `dashboard/src/components/dashboard/system-users-table.jsx` | Added `Reset Password` menu item with RBAC disable check |

### Quality & Linter Checks:
- **Backend syntax:** Verified with `node --check` (0 errors).
- **Dashboard linter:** Verified with `npx oxlint` (0 errors, 0 warnings).
- **Dashboard build:** Verified with `npm run build` (vite build completed successfully in 2.31s).
