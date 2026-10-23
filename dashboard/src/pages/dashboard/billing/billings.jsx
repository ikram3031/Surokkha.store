import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { EXPORT_BUTTON_CLASS } from '@/lib/export-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useBillings } from '@/hooks/use-billings';

// Renders the bills and invoices management page with status filtering and export
const BillingsPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: responseData, isLoading, isError } = useBillings({
    search: searchQuery || undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    page: currentPage,
    limit: 15,
  });

  const invoices = responseData?.items ?? [];
  const meta = responseData?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const handleSearch = (q) => {
    setSearchQuery(q);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleStatusFilter = (v) => {
    setStatusFilter(v ?? 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleBulkExport = () => {
    alert(`${t('common.export')} ${selectedIds.length}...`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1" variant="outline">
            <CheckCircle2 className="h-3 w-3" />{t('orders.status_paid')}
          </Badge>
        );
      case 'Pending':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1" variant="outline">
            <Clock className="h-3 w-3" />{t('orders.status_pending')}
          </Badge>
        );
      case 'Failed':
        return (
          <Badge className="bg-red-500/15 text-red-600 border-red-500/30 gap-1" variant="outline">
            <XCircle className="h-3 w-3" />{t('common.error')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const isAllPageSelected = invoices.length > 0 && invoices.every(inv => selectedIds.includes(inv.id));

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.invoices')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('admin.billing')}</p>
        </div>
        <Button variant="outline" className={EXPORT_BUTTON_CLASS}>
          <Download className="size-4" />
          {t('common.export')}
        </Button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b bg-muted/30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search_placeholder')}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <Button
                variant="outline"
                onClick={handleBulkExport}
                className={EXPORT_BUTTON_CLASS}
              >
                <Download className="size-4" />
                {t('common.export')} ({selectedIds.length})
              </Button>
            )}
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t('common.all')}</SelectItem>
                <SelectItem value="Paid">{t('orders.status_paid')}</SelectItem>
                <SelectItem value="Pending">{t('orders.status_pending')}</SelectItem>
                <SelectItem value="Failed">{t('common.error')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
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
                        const pageIds = invoices.map(inv => inv.id);
                        const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
                        setSelectedIds(newSelected);
                      } else {
                        const pageIds = invoices.map(inv => inv.id);
                        setSelectedIds(selectedIds.filter(id => !pageIds.includes(id)));
                      }
                    }}
                  />
                </TableHead>
                <TableHead>{t('orders.order_id')}</TableHead>
                <TableHead>{t('orders.customer')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('common.time')}</TableHead>
                <TableHead>{t('common.amount')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="w-[50px] px-4">
                      <span className="h-4 w-4 block bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-28 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-16 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-16 block bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell className="text-right"><span className="h-8 w-8 ml-auto block bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-red-500">
                    {t('common.error')}
                  </TableCell>
                </TableRow>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="w-[50px] px-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        checked={selectedIds.includes(inv.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, inv.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== inv.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {inv.invoiceId}
                    </TableCell>
                    <TableCell>{inv.customerName}</TableCell>
                    <TableCell>{inv.date}</TableCell>
                    <TableCell>{inv.dueDate}</TableCell>
                    <TableCell className="font-medium">৳{inv.amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {t('common.no_data')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="border-t px-4 py-3 bg-muted/10">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        setCurrentPage((p) => p - 1);
                        setSelectedIds([]);
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
                          setCurrentPage(pageNum);
                          setSelectedIds([]);
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
                        setCurrentPage((p) => p + 1);
                        setSelectedIds([]);
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
  );
};

export default BillingsPage;
