import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemUsers } from '@/hooks/use-users';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, AlertCircle, Mail, KeyRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { ResetPasswordDialog } from '@/components/dashboard/reset-password-dialog';
import { formatDateTime } from '@/utils/dateHelper';

export function SystemUsersTable({
  searchQuery,
  roleFilter,
  page = 1,
  onTotalPagesChange,
  selectedIds,
  onSelectedIdsChange,
}) {
  const queryClient = useQueryClient();

  const { data: responseData, isLoading, isError, error } = useSystemUsers({
    search: searchQuery,
    role: roleFilter !== 'All' ? roleFilter : undefined,
    page,
    limit: 15,
  });

  const users = responseData?.data ?? [];
  const totalPages = responseData?.meta?.totalPages ?? 1;

  useEffect(() => {
    if (onTotalPagesChange && responseData?.meta) {
      onTotalPagesChange(totalPages);
    }
  }, [totalPages, onTotalPagesChange, responseData]);

  const [toggling, setToggling] = useState(null);
  const [resendingInvite, setResendingInvite] = useState(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
  const { user: currentUser } = useAuth();

  const handleToggleStatus = async (id, currentStatus) => {
    setToggling(id);
    const newActive = currentStatus !== 'Active';
    try {
      await apiClient.put(`/api/v1/users/${id}`, { isActive: newActive });
      toast.success(`User status updated to ${newActive ? 'Active' : 'Inactive'}.`);
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
    } catch {
      toast.error('Failed to update user status.');
    } finally {
      setToggling(null);
    }
  };

  const handleResendInvite = async (id, name) => {
    setResendingInvite(id);
    try {
      const res = await apiClient.post(`/api/v1/users/${id}/resend-invite`, {
        domain: window.location.origin,
      });
      toast.success(res.data?.message || `Invitation email resent to ${name}.`);
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to resend invitation to ${name}.`);
    } finally {
      setResendingInvite(null);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevokeAccess = async () => {
    if (!deleteTarget) return;
    setIsRevoking(true);
    try {
      await apiClient.delete(`/api/v1/users/${deleteTarget.id}`);
      toast.success(`Access revoked for ${deleteTarget.name}.`);
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      onSelectedIdsChange(selectedIds.filter(id => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to revoke access.');
    } finally {
      setIsRevoking(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Owner':
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">{role}</Badge>;
      case 'Admin':
        return <Badge variant="default">{role}</Badge>;
      case 'Manager':
        return <Badge variant="secondary">{role}</Badge>;
      case 'Marketing Expert':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25">{role}</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to fetch system users. {error instanceof Error ? error.message : 'Unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }

  const isAllPageSelected = users.length > 0 && users.every(u => selectedIds.includes(u.id));

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] px-4">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                checked={isAllPageSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    const pageIds = users.map(u => u.id);
                    const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
                    onSelectedIdsChange(newSelected);
                  } else {
                    const pageIds = users.map(u => u.id);
                    onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
                  }
                }}
              />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Assigned Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="w-[50px] px-4">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : users && users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="w-[50px] px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={selectedIds.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectedIdsChange([...selectedIds, user.id]);
                      } else {
                        onSelectedIdsChange(selectedIds.filter(id => id !== user.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id={`status-${user.id}`} 
                      checked={user.status === 'Active'}
                      onCheckedChange={() => handleToggleStatus(user.id, user.status)}
                      disabled={toggling === user.id}
                    />
                    <label 
                      htmlFor={`status-${user.id}`} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {user.status}
                    </label>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(user.lastLogin)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {user.status !== 'Active' && (
                        <DropdownMenuItem
                          disabled={resendingInvite === user.id}
                          onClick={() => handleResendInvite(user.id, user.name)}
                          className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-medium"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {resendingInvite === user.id ? 'Sending Invite...' : 'Resend Invite Email'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setResetPasswordTarget(user)}
                        className="cursor-pointer font-medium"
                        disabled={currentUser?.role === 'Admin' && user.role === 'Owner'}
                      >
                        <KeyRound className="h-4 w-4 mr-2 text-primary" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.status)} className="cursor-pointer">
                        Toggle Active Status
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => setDeleteTarget({ id: user.id, name: user.name })}
                      >
                        Revoke Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No system users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleRevokeAccess}
        isDeleting={isRevoking}
        title="Revoke Access"
        description={`Are you sure you want to revoke access for ${deleteTarget?.name ?? ''}?`}
      />
      <ResetPasswordDialog
        open={!!resetPasswordTarget}
        onOpenChange={(open) => !open && setResetPasswordTarget(null)}
        user={resetPasswordTarget}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['system-users'] })}
      />
    </div>
  );
}
