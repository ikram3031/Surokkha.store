import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SystemUsersTable } from '@/components/dashboard/system-users-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Search, UserPlus, Trash2, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/error-handler';

// Renders the system users and staff management dashboard with invite modal and role controls
const UsersPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const roleFilter = searchParams.get('role') || 'All';
  const urlSearch = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Admin');
  const [newUserGetMail, setNewUserGetMail] = useState(true);

  const queryClient = useQueryClient();

  const updateParams = (updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          val === 'All' ||
          val === 'all' ||
          (key === 'page' && Number(val) === 1)
        ) {
          next.delete(key);
        } else {
          next.set(key, String(val));
        }
      });
      return next;
    });
  };

  useEffect(() => {
    setSearchInput(urlSearch);
    setDebouncedSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== (searchParams.get('q') || '')) {
        updateParams({ q: trimmed, page: 1 });
        setSelectedIds([]);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleRoleFilter = (v) => {
    updateParams({ role: v ?? 'All', page: 1 });
    setSelectedIds([]);
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
    setSelectedIds([]);
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error(t('common.required'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/api/v1/users', {
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim() || undefined,
        role: newUserRole,
        receiveEmailNotifications: newUserGetMail,
        domain: window.location.origin,
      });

      toast.success(response.data?.message || t('common.saved'));
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      setIsInviteOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('Marketing Expert');
      setNewUserGetMail(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) => apiClient.delete(`/api/v1/users/${id}`))
      );
      toast.success(t('common.saved'));
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('admin.system_users')}</h2>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger
            render={
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('admin.add_user')}
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('admin.add_user')}</DialogTitle>
              <DialogDescription>
                {t('admin.title')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">{t('admin.user_name')}</label>
                <Input
                  required
                  placeholder="e.g. Sarah Smith"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">{t('admin.user_email')}</label>
                <Input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  {t('admin.password')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
                </label>
                <Input
                  type="password"
                  placeholder={t('admin.password')}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">{t('admin.user_role')}</label>
                <Select value={newUserRole} onValueChange={(val) => setNewUserRole(val ?? 'Admin')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('admin.user_role')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">{t('admin.role_admin')}</SelectItem>
                    <SelectItem value="Manager">{t('admin.role_manager')}</SelectItem>
                    <SelectItem value="Marketing Expert">{t('admin.role_marketing')}</SelectItem>
                    <SelectItem value="Investor">Investor (Read-Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <label className="text-xs font-semibold cursor-pointer" htmlFor="new-user-mail">
                    {t('admin.get_mail', 'Get Mail')}
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    {t('admin.get_mail_desc', 'Receive order and site notification emails')}
                  </p>
                </div>
                <Switch
                  id="new-user-mail"
                  checked={newUserGetMail}
                  onCheckedChange={setNewUserGetMail}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('common.submitting') : t('common.submit')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('common.search_placeholder')}
            className="pl-8 pr-8 h-9 text-xs"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setBulkDeleteOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {t('common.delete')} ({selectedIds.length})
            </Button>
          )}
          <Select value={roleFilter} onValueChange={handleRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('admin.user_role')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('common.all')}</SelectItem>
              <SelectItem value="Admin">{t('admin.role_admin')}</SelectItem>
              <SelectItem value="Manager">{t('admin.role_manager')}</SelectItem>
              <SelectItem value="Marketing Expert">{t('admin.role_marketing')}</SelectItem>
              <SelectItem value="Investor">Investor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-card text-card-foreground shadow-sm border rounded-lg">
        <div className="p-6">
          <SystemUsersTable
            searchQuery={debouncedSearch}
            roleFilter={roleFilter}
            page={currentPage}
            onTotalPagesChange={setTotalPages}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
          />

          {totalPages > 1 && (
            <div className="border-t mt-4 pt-3">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      aria-disabled={currentPage === 1}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const showPage =
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1;

                    if (!showPage) {
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return (
                          <PaginationItem key={`ellipsis-${pageNum}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === pageNum}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNum);
                          }}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      aria-disabled={currentPage === totalPages}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title={t('common.delete')}
        description={`${t('common.confirm_delete')} (${selectedIds.length})`}
      />
    </div>
  );
};

export default UsersPage;
