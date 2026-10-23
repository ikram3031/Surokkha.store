import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, Download, PlusCircle, Trash2, X, Filter, RotateCcw } from 'lucide-react';
import { OrdersTable } from '@/components/dashboard/orders-table';
import PathaoSyncBar from '@/components/dashboard/orders/PathaoSyncBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import styles from '@/styles/styles.json';
import { getStatusOptionClass } from '@/utils/statusColors';
import { BulkActionDialogs } from './BulkActionDialogs';
import {
  ORDER_FILTER_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_BULK_OPTIONS,
  PAYMENT_FILTER_OPTIONS,
  STATUS_ALL,
} from './constants';

// View 1 — the original orders list layout (expandable rows via the shared OrdersTable).
// All state and actions come from useOrderList via `list`.
const View1 = ({ list }) => {
  const { t } = useTranslation();
  const { isReadOnly, newOrderAction, search, filters, pagination, selection, bulk, exporter } = list;
  const { page: currentPage, totalPages } = pagination;
  const optionLabel = (opt) => (opt.labelKey ? t(opt.labelKey, opt.label) : opt.label);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('orders.title', 'Orders Management')}</h2>
          <PathaoSyncBar />
        </div>
        <div className="flex items-center gap-2">
          {newOrderAction && (
            <Button size="lg" className="h-9 px-4" nativeButton={false} render={<Link to={newOrderAction.to} />}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t(newOrderAction.labelKey, newOrderAction.label)}
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            className="h-9 px-4"
            onClick={exporter.run}
            disabled={exporter.isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('common.export', 'Export Orders')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('orders.search_orders', 'Search by customer name, phone or order ID...')}
            className="pl-8 pr-8 h-9 text-xs"
            value={search.input}
            onChange={(e) => search.setInput(e.target.value)}
          />
          {search.input && (
            <button
              type="button"
              onClick={() => search.setInput('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
          {selection.ids.length === 0 && (
            <div className="flex gap-2 items-center w-full sm:w-auto">
              {filters.hasActive && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={filters.reset}
                  className="h-9 gap-1.5 text-xs cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t('common.reset', 'Reset')}
                </Button>
              )}
              <div className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-2 text-xs shadow-xs">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  max={filters.dateTo || undefined}
                  onChange={(e) => filters.setDate('from', e.target.value)}
                  className="h-7 w-[125px] border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0 cursor-pointer dark:[color-scheme:dark]"
                  aria-label="From date"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom || undefined}
                  onChange={(e) => filters.setDate('to', e.target.value)}
                  className="h-7 w-[125px] border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0 cursor-pointer dark:[color-scheme:dark]"
                  aria-label="To date"
                />
                {(filters.dateFrom || filters.dateTo) && (
                  <button
                    type="button"
                    onClick={() => filters.setDateRange('', '')}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Clear dates"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-9 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-[200px] cursor-pointer">
                  <span className="truncate">
                    {filters.selectedStatuses.length === 0
                      ? `${t('orders.order_status', 'Order Status')}: ${t('common.all', 'All')}`
                      : `${t('orders.order_status', 'Status')} (${filters.selectedStatuses.length}): ${filters.selectedStatuses.join(', ')}`}
                  </span>
                  <Filter className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52" align="start">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>{t('orders.order_status', 'Order Status')}</span>
                    {filters.selectedStatuses.length > 0 && (
                      <button
                        type="button"
                        onClick={filters.clearStatus}
                        className="text-[11px] font-medium text-destructive hover:text-destructive/80 cursor-pointer underline"
                      >
                        {t('common.clear', 'Clear')}
                      </button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ORDER_FILTER_OPTIONS.map((opt) => (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={filters.selectedStatuses.includes(opt.value)}
                      onCheckedChange={() => filters.toggleStatus(opt.value)}
                      className={`cursor-pointer text-xs ${getStatusOptionClass(opt.value)}`}
                    >
                      {optionLabel(opt)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={filters.payment} onValueChange={filters.setPayment}>
                <SelectTrigger className="w-[160px] h-9 cursor-pointer text-xs">
                  <span>
                    {filters.payment === STATUS_ALL
                      ? `${t('orders.payment_status', 'Payment')}: ${t('common.all', 'All')}`
                      : `${t('orders.payment_status', 'Payment')}: ${filters.payment}`}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value={STATUS_ALL}>{t('orders.payment_status', 'Payment')}: {t('common.all', 'All')}</SelectItem>
                  {PAYMENT_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className={getStatusOptionClass(opt.value)}>
                      {optionLabel(opt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selection.ids.length > 0 && !isReadOnly && (
            <div className="flex gap-1.5 items-center ml-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden md:inline">
                {selection.ids.length} {t('common.selected', 'selected')}:
              </span>

              <Select value="" onValueChange={(val) => val && bulk.setPaymentTarget(val)}>
                <SelectTrigger className="w-[145px] h-9 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium cursor-pointer text-xs">
                  <span>{t('orders.payment_status', 'Payment Status')}</span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  {PAYMENT_BULK_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className={`cursor-pointer text-xs ${getStatusOptionClass(opt.value)}`.trim()}>
                      {optionLabel(opt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value="" onValueChange={(val) => val && bulk.setStatusTarget(val)}>
                <SelectTrigger className="w-[135px] h-9 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer text-xs">
                  <span>{t('orders.order_status', 'Order Status')}</span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className={`cursor-pointer text-xs ${getStatusOptionClass(opt.value)}`.trim()}>
                      {optionLabel(opt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="destructive"
                size="icon"
                onClick={() => bulk.setDeleteOpen(true)}
                className="h-9 w-9 flex items-center justify-center shrink-0 cursor-pointer"
                title={`${t('common.delete', 'Delete Selected')} (${selection.ids.length})`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.table.wrapper}>
        <div className="overflow-x-auto">
          <OrdersTable
            searchQuery={search.query}
            statusFilter={filters.status}
            paymentFilter={filters.payment}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            page={currentPage}
            onTotalPagesChange={pagination.setReportedTotalPages}
            selectedIds={selection.ids}
            onSelectedIdsChange={selection.setIds}
            orderType={list.orderType}
            isReadOnly={isReadOnly}
          />

          <div className="py-3">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) pagination.setPage(currentPage - 1);
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;

                  if (!showPage) {
                    if (page === 2 || page === totalPages - 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          pagination.setPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) pagination.setPage(currentPage + 1);
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      <BulkActionDialogs list={list} />
    </div>
  );
};

export default View1;
