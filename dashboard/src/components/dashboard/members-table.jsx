import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembers } from '@/hooks/use-members';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/utils/dateHelper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { getApiErrorMessage } from '@/lib/error-handler';

// Renders the members and customer management table with batch actions and navigation to dedicated profile page
export const MembersTable = ({
  searchQuery,
  segmentFilter,
  page = 1,
  onTotalPagesChange,
  selectedIds,
  onSelectedIdsChange,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: responseData, isLoading, isError, error } = useMembers({
    search: searchQuery,
    segment: segmentFilter !== 'All' ? segmentFilter : undefined,
    page,
    limit: 15,
  });

  const members = responseData?.data ?? [];
  const totalPages = responseData?.meta?.totalPages ?? 1;

  useEffect(() => {
    if (onTotalPagesChange && responseData?.meta) {
      onTotalPagesChange(totalPages);
    }
  }, [totalPages, onTotalPagesChange, responseData]);

  const handleSendMessage = (member) => {
    toast.info(`Preparing message for ${member.email}`);
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const canChangePassword = ['owner', 'admin', 'manager', 'administrator', 'super_admin'].includes((user?.role || '').toLowerCase());

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/members/${deleteTarget.id}`);
      toast.success(`Member ${deleteTarget.name} deleted.`);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onSelectedIdsChange(selectedIds.filter(id => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete member.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordTarget) return;

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.post(`/api/v1/members/${passwordTarget.id}/change-password`, {
        newPassword,
      });
      toast.success(`Password updated for ${passwordTarget.name}.`);
      setPasswordTarget(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to change password.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to fetch members. {error instanceof Error ? error.message : 'Unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }

  const isAllPageSelected = members.length > 0 && members.every(m => selectedIds.includes(m.id));

  return (
    <>
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
                    const pageIds = members.map(m => m.id);
                    const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
                    onSelectedIdsChange(newSelected);
                  } else {
                    const pageIds = members.map(m => m.id);
                    onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-[200px] min-w-[160px]">Customer</TableHead>
            <TableHead className="w-[200px]">Email</TableHead>
            <TableHead className="w-[130px]">Phone</TableHead>
            <TableHead className="w-[100px] text-right">Total Orders</TableHead>
            <TableHead className="w-[130px] text-right">Lifetime Spent</TableHead>
            <TableHead className="w-[110px]">Joined Date</TableHead>
            <TableHead className="w-[60px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 15 }).map((_, i) => (
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
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : members && members.length > 0 ? (
            members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="w-[50px] px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={selectedIds.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectedIdsChange([...selectedIds, member.id]);
                      } else {
                        onSelectedIdsChange(selectedIds.filter(id => id !== member.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <Link
                    to={`/dashboard/members/${member.id}`}
                    className="flex items-center gap-3 min-w-0 group cursor-pointer"
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0 border group-hover:border-primary transition-colors">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors" title={member.name}>
                      {member.name}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <span className="truncate block text-muted-foreground" title={member.email}>{member.email}</span>
                </TableCell>
                <TableCell className="w-[130px] text-muted-foreground whitespace-nowrap">{member.phone}</TableCell>
                <TableCell className="text-right w-[100px] font-semibold">{member.totalOrders}</TableCell>
                <TableCell className="text-right w-[130px] font-bold whitespace-nowrap text-foreground">৳{member.lifetimeSpent.toFixed(2)}</TableCell>
                <TableCell className="w-[110px] whitespace-nowrap">{formatDate(member.joinedDate)}</TableCell>
                <TableCell className="text-right w-[60px]">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/members/${member.id}`)}>
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendMessage(member)}>
                        Send Message
                      </DropdownMenuItem>
                      {canChangePassword && (
                        <DropdownMenuItem
                          onClick={() => {
                            setPasswordTarget({ id: member.id, name: member.name });
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                        >
                          Change Password
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => setDeleteTarget({ id: member.id, name: member.name })}
                      >
                        Delete Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteMember}
        isDeleting={isDeleting}
        title="Delete Member"
        description={`Are you sure you want to delete member ${deleteTarget?.name ?? ''}?`}
      />

      <Dialog open={!!passwordTarget} onOpenChange={(open) => { if (!open) setPasswordTarget(null); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for {passwordTarget?.name ?? 'this member'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label htmlFor="new-password" className="text-sm font-medium text-muted-foreground">
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-muted-foreground">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="cancel" onClick={() => setPasswordTarget(null)} disabled={isChangingPassword}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
