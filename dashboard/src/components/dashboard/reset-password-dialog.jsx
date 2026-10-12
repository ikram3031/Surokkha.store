import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

/**
 * Generates a cryptographically strong, human-readable temporary password
 * e.g. "Surokkha#2026!W8x"
 */
function generateStrongPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const specials = "@#$%&*!";

  const getRandomChar = (charset) =>
    charset[Math.floor(Math.random() * charset.length)];

  // Guarantee at least one of each character category
  const parts = [
    getRandomChar(upper),
    getRandomChar(lower),
    getRandomChar(lower),
    getRandomChar(lower),
    getRandomChar(digits),
    getRandomChar(digits),
    getRandomChar(specials),
    getRandomChar(upper),
    getRandomChar(lower),
    getRandomChar(digits),
  ];

  // Shuffle array
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }

  return parts.join("");
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleDialogChange = (nextOpen) => {
    if (!nextOpen) {
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setValidationError("");
      setCopied(false);
    }
    onOpenChange?.(nextOpen);
  };

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setShowConfirmPassword(true);
    setValidationError("");

    // Auto copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(generated);
      setCopied(true);
      toast.success("Generated strong password and copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.info("Generated strong password.");
    }
  };

  const handleCopyCurrentPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setValidationError("");

    if (!password || password.trim().length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!user?.id && !user?._id) {
      toast.error("User identifier is missing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = user.id || user._id;
      const res = await apiClient.post(`/api/v1/users/${userId}/reset-password`, {
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      toast.success(
        res.data?.message || `Password for ${user.name} has been reset successfully.`
      );
      onSuccess?.();
      handleDialogChange(false);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(", ") ||
        "Failed to reset password. Please check your permissions.";
      setValidationError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const userInitials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "US";

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Reset User Password
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set a new login password for this staff member
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Selected User Summary Badge */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border/80 flex items-center justify-between gap-3 mt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-foreground truncate">
                {user.name}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">
                {user.email}
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-[11px] font-medium shrink-0">
            {user.role || "Staff"}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Quick Action: Generate Strong Password */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground">
              New Password <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {password && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCurrentPassword}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePassword}
                className="h-6 px-2 text-[11px] text-primary hover:text-primary gap-1 font-medium bg-primary/5 hover:bg-primary/10 border-primary/20"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                Generate Strong
              </Button>
            </div>
          </div>

          {/* New Password Input */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password (min. 6 characters)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationError) setValidationError("");
              }}
              className="pr-10 h-9 text-xs font-mono"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">
              Confirm Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationError) setValidationError("");
                }}
                className={`pr-10 h-9 text-xs font-mono ${
                  confirmPassword && password !== confirmPassword
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Validation Feedback */}
          {validationError && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {password && confirmPassword && password === confirmPassword && (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Passwords match. Ready to reset.
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !password || password.length < 6}
              className="h-8 text-xs gap-1.5 font-semibold shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" />
                  Save New Password
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default ResetPasswordDialog;
