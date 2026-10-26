import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, baseURL, getApiBaseUrl } from '@/lib/api-client';
import { fetchOrders, useOrders } from '@/hooks/use-orders';
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/lib/auth-context';
import { isReadOnlyRole } from '@/lib/rbac';
import { getApiErrorMessage } from '@/lib/error-handler';
import { clientConfig } from '@/clientConfig';
import { exportToCsv } from '@/utils/exportCsv';
import { formatDateTime } from '@/utils/dateHelper';
import { getPaymentMethodLabel } from '@/utils/orderDetailsHelper';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_MOBILE, EXPORT_MAX_PAGES, PAGE_SIZE_OPTIONS, STATUS_ALL } from './constants';
import { useIsWide } from './view2/useMediaQuery';

// Shared by the shared PathaoSyncBar too, so both read one cached result
const PATHAO_STATUS_KEY = ['pathao-sync-status'];
// Same keys as the overview page hooks, so the cache is shared
const STATUS_COUNTS_KEY = ['dashboard', 'orderStatusDistribution', 'all'];

// Page heading per order type (the same list serves online, custom and in-store orders)
const PAGE_TITLES = {
  online: { key: 'nav.orders', label: 'Orders' },
  custom: { key: 'nav.custom_orders', label: 'Custom Orders' },
  instore: { key: 'nav.in_store_orders', label: 'In-Store Orders' },
};

// URL values that mean "no filter" are removed from the query string
const isDefaultParam = (key, val, defaultPageSize) =>
  val === undefined ||
  val === null ||
  val === '' ||
  val === STATUS_ALL ||
  val === 'all' ||
  (key === 'page' && Number(val) === 1) ||
  (key === 'limit' && Number(val) === defaultPageSize);

export const getCustomerPhone = (order) =>
  order?.billingInfo?.phone || order?.shippingInfo?.phone || order?.customer?.phone || '';

export const getItemCount = (order) =>
  Array.isArray(order?.items) ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) : 0;

// Flattens an order into one CSV row
const toCsvRow = (order) => ({
  'Order ID': order.orderNumber,
  Customer: order.customerName,
  Phone: getCustomerPhone(order),
  Amount: Number(order.totalAmount || 0),
  Date: formatDateTime(order.date),
  'Payment Status': order.paymentStatus,
  'Payment Method': getPaymentMethodLabel(order.paymentMethod) || '',
  'Order Status': order.orderStatus,
});

/**
 * All logic for the orders list page, shared by View1 and View2.
 * Views only render; anything that reads/writes the URL, calls the API or
 * changes state lives here.
 *
 * @param {object}  options
 * @param {boolean} options.fetchData  true = this hook fetches the rows (View2).
 *                                     false = the view renders the shared OrdersTable,
 *                                     which fetches its own rows (View1).
 * @param {string}  options.orderType  passed to the orders API
 */
export function useOrderList({ fetchData = true, orderType = 'online' } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isReadOnly = isReadOnlyRole(user?.role);
  const actorName = user?.name || 'Admin';
  const [searchParams, setSearchParams] = useSearchParams();

  // ---------------------------------------------------------------- URL state
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const defaultPageSize = useIsWide() ? DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE_MOBILE;
  const limitParam = parseInt(searchParams.get('limit') || '', 10);
  const pageSize = PAGE_SIZE_OPTIONS.includes(limitParam) ? limitParam : defaultPageSize;
  const statusFilter = searchParams.get('status') || STATUS_ALL;
  const paymentFilter = searchParams.get('payment') || STATUS_ALL;
  const urlSearch = searchParams.get('q') || '';
  const dateFrom = searchParams.get('from') || '';
  const dateTo = searchParams.get('to') || '';

  const updateParams = useCallback(
    (updates) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, val]) => {
          if (isDefaultParam(key, val, defaultPageSize)) next.delete(key);
          else next.set(key, String(val));
        });
        return next;
      });
    },
    [setSearchParams, defaultPageSize]
  );

  // ---------------------------------------------------------------- selection
  const [selectedIds, setSelectedIds] = useState([]);
  const clearSelection = useCallback(() => setSelectedIds([]), []);
  const toggleSelected = useCallback((id, checked) => {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  }, []);
  const setManySelected = useCallback((ids, checked) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((x) => !ids.includes(x))
    );
  }, []);

  // ---------------------------------------------------------------- search (debounced into ?q=)
  const [searchInput, setSearchInput] = useState(urlSearch);

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== (searchParams.get('q') || '')) {
        updateParams({ q: trimmed, page: 1 });
        clearSelection();
      }
    }, 300);
    return () => clearTimeout(handler);
    // Only the typed text should restart the debounce
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ---------------------------------------------------------------- filters
  const selectedStatuses = useMemo(
    () =>
      statusFilter === STATUS_ALL || !statusFilter
        ? []
        : statusFilter.split(',').map((s) => s.trim()).filter(Boolean),
    [statusFilter]
  );

  const toggleStatusFilter = (value) => {
    const next = selectedStatuses.includes(value)
      ? selectedStatuses.filter((s) => s !== value)
      : [...selectedStatuses, value];
    updateParams({ status: next.length === 0 ? STATUS_ALL : next.join(','), page: 1 });
    clearSelection();
  };

  const clearStatusFilter = () => {
    updateParams({ status: STATUS_ALL, page: 1 });
    clearSelection();
  };

  const setPaymentFilter = (value) => {
    updateParams({ payment: value ?? STATUS_ALL, page: 1 });
    clearSelection();
  };

  const setDateRange = (from, to) => {
    updateParams({ from, to, page: 1 });
    clearSelection();
  };

  const setDate = (key, value) => {
    updateParams({ [key]: value, page: 1 });
    clearSelection();
  };

  const hasActiveFilters =
    selectedStatuses.length > 0 || paymentFilter !== STATUS_ALL || Boolean(urlSearch) || Boolean(dateFrom) || Boolean(dateTo);

  // Clears status, payment, date and search filters in one go
  const resetFilters = () => {
    setSearchInput('');
    updateParams({ status: STATUS_ALL, payment: STATUS_ALL, q: '', from: '', to: '', page: 1 });
    clearSelection();
  };

  // ---------------------------------------------------------------- data
  const queryParams = useMemo(
    () => ({
      search: urlSearch,
      status: statusFilter !== STATUS_ALL ? statusFilter : undefined,
      paymentStatus: paymentFilter !== STATUS_ALL ? paymentFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: currentPage,
      limit: pageSize,
      orderType,
    }),
    [urlSearch, statusFilter, paymentFilter, dateFrom, dateTo, currentPage, pageSize, orderType]
  );

  const ordersQuery = useOrders(queryParams, { enabled: fetchData });
  const orders = useMemo(() => ordersQuery.data?.data ?? [], [ordersQuery.data]);
  const meta = ordersQuery.data?.meta;

  // View1's OrdersTable reports its page count back through setReportedTotalPages
  const [reportedTotalPages, setReportedTotalPages] = useState(1);
  const totalPages = fetchData ? Math.max(1, meta?.totalPages ?? 1) : reportedTotalPages;
  const totalOrders = meta?.total ?? 0;

  // ---------------------------------------------------------------- pagination
  const setPage = (page) => updateParams({ page });
  const setPageSize = (size) => {
    updateParams({ limit: size, page: 1 });
    clearSelection();
  };

  // ---------------------------------------------------------------- single order actions
  const invalidateOrders = (orderId) => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    if (orderId) queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
  };

  // Quick view keeps the id; the order object is re-read from fresh list data
  const [quickView, setQuickView] = useState(null);
  const quickViewOrder = useMemo(
    () => (quickView ? orders.find((o) => o.id === quickView.id) ?? quickView : null),
    [orders, quickView]
  );

  // Updates order status (and payment status) of one order. Returns true on success.
  const updateOrderStatus = async (order, { orderStatus, paymentStatus, returnFee, orderNotes }) => {
    if (!order || !orderStatus) return false;
    const isReturn = orderStatus === 'Return';
    if (isReturn && (returnFee === '' || returnFee === null || returnFee === undefined)) {
      toast.error(t('orders.return_fee_required', 'Return fee is required'));
      return false;
    }

    const payload = { status: orderStatus.toLowerCase() };
    if (isReturn) {
      payload.returnFee = Number(returnFee);
      payload.paymentStatus = 'returned';
    } else if (paymentStatus && paymentStatus !== 'Not found' && paymentStatus !== 'N/A') {
      payload.paymentStatus = paymentStatus.toLowerCase();
    }
    if (orderNotes !== undefined) payload.orderNotes = orderNotes.trim();

    try {
      await apiClient.put(`/api/v1/orders/${order.id}`, payload);
      logActivity({
        type: 'updated',
        description: `Order #${order.orderNumber} status changed to "${orderStatus}" and payment to "${payload.paymentStatus ?? paymentStatus}" by "${actorName}"`,
      });
      toast.success(t('orders.order_updated_success', `Order #${order.orderNumber} updated successfully.`));
      invalidateOrders(order.id);
      return true;
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to update order status.'));
      return false;
    }
  };

  // Saves only the order notes (inline edit in the table). Returns true on success.
  const updateOrderNotes = async (order, orderNotes) => {
    try {
      await apiClient.put(`/api/v1/orders/${order.id}`, { orderNotes: orderNotes.trim() });
      logActivity({ type: 'updated', description: `Order #${order.orderNumber} notes updated by "${actorName}"` });
      toast.success(t('orders.notes_updated', 'Order notes updated.'));
      invalidateOrders(order.id);
      return true;
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to update order notes.'));
      return false;
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Permanently deletes the order held in deleteTarget
  const confirmDeleteOrder = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/orders/${deleteTarget.id}`);
      logActivity({ type: 'deleted', description: `Order #${deleteTarget.orderNumber} deleted by "${actorName}"` });
      toast.success(t('common.deleted', `Order ${deleteTarget.orderNumber} deleted successfully.`));
      invalidateOrders();
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      if (quickView?.id === deleteTarget.id) setQuickView(null);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to delete order.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const [invoiceTarget, setInvoiceTarget] = useState(null);

  // Opens the printable invoice in a new tab
  const openInvoice = (order) => {
    const apiBase = (baseURL || getApiBaseUrl()).replace(/\/$/, '');
    const orderIdentifier = order._id || order.id || order.did || order.orderNumber;
    window.open(`${apiBase}/api/v1/orders/${orderIdentifier}/invoice`, '_blank', 'noopener,noreferrer');
  };

  const viewDetails = (order) => navigate(`/dashboard/orders/${order.id}`);
  const editOrder = (order) => navigate(`/dashboard/orders/${order.id}?edit=true`);

  // ---------------------------------------------------------------- bulk actions
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState(null);
  const [bulkPaymentTarget, setBulkPaymentTarget] = useState(null);
  const [bulkReturnFee, setBulkReturnFee] = useState('');
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await apiClient.post('/api/v1/orders/bulk-delete', { ids: selectedIds });
      logActivity({
        type: 'deleted',
        description: `${selectedIds.length} order(s) deleted by "${actorName}"`,
      });
      toast.success(t('orders.order_updated_success', 'Selected orders deleted successfully.'));
      invalidateOrders();
      clearSelection();
      setBulkDeleteOpen(false);
    } catch {
      toast.error(t('common.error', 'Failed to delete some orders.'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const closeBulkStatus = () => {
    setBulkStatusTarget(null);
    setBulkReturnFee('');
  };

  // Applies bulkStatusTarget to every selected order
  const confirmBulkStatus = async () => {
    const status = bulkStatusTarget;
    if (!status || status === 'placeholder') return;
    if (status === 'Return' && !bulkReturnFee) {
      toast.error(t('orders.return_fee_required', 'Return fee is required'));
      return;
    }
    setIsUpdatingBulk(true);
    try {
      await apiClient.post('/api/v1/orders/bulk-update', { ids: selectedIds, status, returnFee: Number(bulkReturnFee) });
      logActivity({
        type: 'updated',
        description: `${selectedIds.length} order(s) status updated to "${status}" by "${actorName}"`,
      });
      toast.success(t('orders.order_updated_success', `Selected orders updated to status "${status}".`));
      invalidateOrders();
      clearSelection();
    } catch {
      toast.error(t('common.error', 'Failed to update orders.'));
    } finally {
      setIsUpdatingBulk(false);
      closeBulkStatus();
    }
  };

  // Applies bulkPaymentTarget to every selected order
  const confirmBulkPayment = async () => {
    const paymentStatus = bulkPaymentTarget;
    if (!paymentStatus || paymentStatus === 'placeholder') return;
    setIsUpdatingBulk(true);
    try {
      await apiClient.post('/api/v1/orders/bulk-update', { ids: selectedIds, paymentStatus });
      logActivity({
        type: 'updated',
        description: `${selectedIds.length} order(s) payment status updated to "${paymentStatus}" by "${actorName}"`,
      });
      toast.success(t('orders.order_updated_success', `Selected orders updated to payment status "${paymentStatus}".`));
      invalidateOrders();
      clearSelection();
    } catch {
      toast.error(t('common.error', 'Failed to update orders.'));
    } finally {
      setIsUpdatingBulk(false);
      setBulkPaymentTarget(null);
    }
  };

  // ---------------------------------------------------------------- export (all pages of the current filter)
  const [isExporting, setIsExporting] = useState(false);

  const exportOrders = async () => {
    setIsExporting(true);
    try {
      const rows = [];
      let page = 1;
      let pages = 1;
      do {
        const res = await fetchOrders({ ...queryParams, page, limit: 100 });
        rows.push(...res.data);
        pages = res.meta?.totalPages || 1;
        page += 1;
      } while (page <= pages && page <= EXPORT_MAX_PAGES);

      if (rows.length === 0) {
        toast.info(t('orders.export_empty', 'No orders to export.'));
        return;
      }
      exportToCsv(rows.map(toCsvRow), `orders_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(t('orders.export_done', `${rows.length} orders exported.`));
    } catch {
      toast.error(t('orders.export_failed', 'Failed to export orders.'));
    } finally {
      setIsExporting(false);
    }
  };

  // ---------------------------------------------------------------- Pathao sync (View2 only; View1 uses PathaoSyncBar)
  const pathaoQuery = useQuery({
    queryKey: PATHAO_STATUS_KEY,
    queryFn: async () => (await apiClient.get('/api/v1/courier/pathao/config')).data?.data || {},
    refetchInterval: 60 * 1000,
    retry: false,
    enabled: fetchData,
  });
  const [isSyncingPathao, setIsSyncingPathao] = useState(false);

  const syncPathao = async () => {
    setIsSyncingPathao(true);
    try {
      const res = await apiClient.post('/api/v1/courier/pathao/orders/sync');
      const result = res.data?.data || {};
      if (result.skipped) {
        toast.info(result.reason || 'Sync skipped.');
      } else {
        toast.success(`Pathao sync done: ${result.updated} updated of ${result.checked} orders.`);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
      pathaoQuery.refetch();
    } catch {
      toast.error('Failed to sync Pathao orders.');
    } finally {
      setIsSyncingPathao(false);
    }
  };

  // ---------------------------------------------------------------- stats (all time, View2 only)
  const statusCountsQuery = useQuery({
    queryKey: STATUS_COUNTS_KEY,
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/orders/status-distribution', { params: { range: 'all' } });
      return res.data?.data?.statusCounts || {};
    },
    staleTime: 30 * 1000,
    enabled: fetchData,
  });
  const stats = useMemo(() => {
    const counts = statusCountsQuery.data || {};
    return {
      isLoading: statusCountsQuery.isLoading,
      totalOrders: Object.values(counts).reduce((sum, v) => sum + Number(v || 0), 0),
      pending: Number(counts.pending || 0),
      processing: Number(counts.processing || 0),
      shipped: Number(counts.shipped || 0),
    };
  }, [statusCountsQuery.data, statusCountsQuery.isLoading]);

  // ---------------------------------------------------------------- page actions
  const customOrderAction = { to: '/dashboard/orders/custom/new', labelKey: 'orders.new_custom_order', label: 'New Custom Order' };
  const inStoreOrderAction = { to: '/dashboard/orders/new', labelKey: 'orders.new_order', label: 'New In-Store Order' };
  const newOrderAction = isReadOnly
    ? null
    : orderType === 'custom'
      ? customOrderAction
      : orderType === 'instore'
        ? inStoreOrderAction
        : clientConfig?.features?.customOrders
          ? customOrderAction
          : clientConfig?.features?.inStoreOrder !== false
            ? inStoreOrderAction
            : null;

  return {
    isReadOnly,
    orderType,
    title: PAGE_TITLES[orderType] || PAGE_TITLES.online,
    // Status counts cover every order type, so they are only shown on the main orders list
    showStats: orderType === 'online',
    newOrderAction,

    search: { input: searchInput, setInput: setSearchInput, query: urlSearch },

    filters: {
      status: statusFilter,
      selectedStatuses,
      toggleStatus: toggleStatusFilter,
      clearStatus: clearStatusFilter,
      payment: paymentFilter,
      setPayment: setPaymentFilter,
      dateFrom,
      dateTo,
      setDateRange,
      setDate,
      hasActive: hasActiveFilters,
      reset: resetFilters,
    },

    pagination: {
      page: currentPage,
      setPage,
      totalPages,
      setReportedTotalPages,
      pageSize,
      setPageSize,
      total: totalOrders,
    },

    data: {
      orders,
      isLoading: ordersQuery.isLoading,
      isFetching: ordersQuery.isFetching,
      isError: ordersQuery.isError,
      error: ordersQuery.error,
    },

    selection: {
      ids: selectedIds,
      setIds: setSelectedIds,
      toggle: toggleSelected,
      setMany: setManySelected,
      clear: clearSelection,
    },

    orderActions: {
      quickViewOrder,
      openQuickView: (order) => setQuickView(order),
      closeQuickView: () => setQuickView(null),
      updateStatus: updateOrderStatus,
      updateNotes: updateOrderNotes,
      viewDetails,
      edit: editOrder,
      openInvoice,
      invoiceTarget,
      setInvoiceTarget,
      deleteTarget,
      setDeleteTarget,
      isDeleting,
      confirmDelete: confirmDeleteOrder,
    },

    bulk: {
      deleteOpen: bulkDeleteOpen,
      setDeleteOpen: setBulkDeleteOpen,
      isDeleting: isBulkDeleting,
      confirmDelete: handleBulkDelete,
      statusTarget: bulkStatusTarget,
      setStatusTarget: setBulkStatusTarget,
      closeStatus: closeBulkStatus,
      returnFee: bulkReturnFee,
      setReturnFee: setBulkReturnFee,
      confirmStatus: confirmBulkStatus,
      paymentTarget: bulkPaymentTarget,
      setPaymentTarget: setBulkPaymentTarget,
      confirmPayment: confirmBulkPayment,
      isUpdating: isUpdatingBulk,
    },

    exporter: { run: exportOrders, isExporting },

    pathao: {
      lastSyncAt: pathaoQuery.data?.lastOrderSyncAt ?? null,
      isSyncing: isSyncingPathao,
      sync: syncPathao,
    },

    stats,
  };
}

export default useOrderList;
