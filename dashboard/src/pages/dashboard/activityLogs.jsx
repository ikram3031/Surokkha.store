import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Search,
  Activity,
  Trash2,
  CheckCircle,
  Clock,
  MailCheck,
  Mail,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/dateHelper';

const ActivityLogsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [readFilter, setReadFilter] = useState('All'); // 'All' | 'unread' | 'read'
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'newOrder' | 'created' | 'updated' | 'deleted'
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Fetch active logs
  const {
    data: logsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'activity-logs',
      { search: searchQuery, readStatus: readFilter, type: typeFilter, page: currentPage },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', '20');
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (readFilter === 'unread') params.append('readStatus', 'false');
      if (readFilter === 'read') params.append('readStatus', 'true');
      if (typeFilter !== 'All') params.append('type', typeFilter);

      const res = await apiClient.get(`/api/v1/logs?${params.toString()}`);
      return res.data;
    },
  });

  const logs = logsResponse?.data || [];
  const totalPages = logsResponse?.pagination?.totalPages || 1;
  const totalItems = logsResponse?.pagination?.total || 0;

  // Single Soft Delete
  const handleDeleteLog = async (log) => {
    setIsProcessing(true);
    try {
      await apiClient.delete(`/api/v1/logs/${log.id || log._id}`);
      toast.success('Log entry deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      setSingleDeleteTarget(null);
    } catch {
      toast.error('Failed to delete log entry.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Soft Delete
  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await apiClient.post('/api/v1/logs/bulk-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} logs deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error('Failed to delete selected logs.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Mark as Read
  const handleBulkMarkRead = async () => {
    setIsProcessing(true);
    try {
      await apiClient.put('/api/v1/logs/mark-read', { ids: selectedIds });
      toast.success(`${selectedIds.length} logs marked as read.`);
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      setSelectedIds([]);
    } catch {
      toast.error('Failed to mark logs as read.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Mark as Unread
  const handleBulkMarkUnread = async () => {
    setIsProcessing(true);
    try {
      await apiClient.put('/api/v1/logs/mark-unread', { ids: selectedIds });
      toast.success(`${selectedIds.length} logs marked as unread.`);
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      setSelectedIds([]);
    } catch {
      toast.error('Failed to mark logs as unread.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Checkbox Selection Helpers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(logs.map((l) => l.id || l._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex-1 space-y-5 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Activity Logs</h2>
            <p className="text-xs text-muted-foreground">
              Audit trail of user actions, order events, updates, and system activities ({totalItems} total).
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search log description, user..."
            className="pl-8 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto ml-auto justify-end flex-wrap">
          <Select
            value={readFilter}
            onValueChange={(val) => {
              setReadFilter(val);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
          >
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Read Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="unread">🔵 Unread Only</SelectItem>
              <SelectItem value="read">⚪ Read Only</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(val) => {
              setTypeFilter(val);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Events</SelectItem>
              <SelectItem value="newOrder">New Order (111)</SelectItem>
              <SelectItem value="created">Created (110)</SelectItem>
              <SelectItem value="updated">Updated (121)</SelectItem>
              <SelectItem value="deleted">Deleted (666)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 animate-in fade-in">
          <span className="text-xs font-semibold text-primary">
            {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkMarkRead}
              disabled={isProcessing}
              className="h-8 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <MailCheck className="h-3.5 w-3.5 text-primary" />
              Mark as Read
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkMarkUnread}
              disabled={isProcessing}
              className="h-8 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Mark as Unread
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={isProcessing}
              className="h-8 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Dedicated Activity Logs Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  checked={logs.length > 0 && selectedIds.length === logs.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableHead>
              <TableHead>Log Description</TableHead>
              <TableHead className="w-52">Time</TableHead>
              <TableHead className="w-24 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-72" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-destructive">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  Failed to load activity logs.
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="h-8 w-8 text-emerald-500/70" />
                    <p className="font-semibold text-sm">No activity logs found</p>
                    <p className="text-xs">There are no active log records matching the criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const id = log.id || log._id;
                const isSelected = selectedIds.includes(id);
                const isUnread = !log.readStatus;

                return (
                  <TableRow
                    key={id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-primary/10'
                        : isUnread
                        ? 'bg-primary/[0.03] font-medium'
                        : 'hover:bg-muted/20 opacity-85'
                    }`}
                  >
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(id)}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {/* Unread indicator dot */}
                        {isUnread ? (
                          <span
                            className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse shadow-xs"
                            title="Unread Log"
                          />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
                        )}

                        <div className="space-y-0.5">
                          <span
                            className={`text-xs ${
                              isUnread
                                ? 'font-semibold text-foreground'
                                : 'text-foreground/80'
                            }`}
                          >
                            {log.description}
                          </span>

                          {/* Event Type Badge & User DID info */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 uppercase font-mono ${
                                log.type === 'newOrder'
                                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                  : log.type === 'created'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : log.type === 'updated'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                  : 'bg-red-500/10 text-red-600 border-red-500/30'
                              }`}
                            >
                              {log.type} {log.typeDid ? `(${log.typeDid})` : ''}
                            </Badge>

                            {log.createdBy && (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                by: {log.createdBy}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Clock className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                        <span>
                          {log.createdAt
                            ? formatDateTime(log.createdAt)
                            : '—'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSingleDeleteTarget(log)}
                        title="Delete log entry (soft delete)"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage((p) => p - 1);
                }}
                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-xs font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                }}
                className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Single Delete Confirm Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(singleDeleteTarget)}
        onOpenChange={(open) => !open && setSingleDeleteTarget(null)}
        onConfirm={() => handleDeleteLog(singleDeleteTarget)}
        title="Delete Activity Log?"
        description="Are you sure you want to remove this activity log entry from active records?"
        confirmText="Delete"
        variant="destructive"
      />

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedIds.length} Activity Logs?`}
        description={`All ${selectedIds.length} selected activity log entries will be removed from active view.`}
        confirmText="Delete Selected"
        variant="destructive"
      />
    </div>
  );
};

export default ActivityLogsPage;
