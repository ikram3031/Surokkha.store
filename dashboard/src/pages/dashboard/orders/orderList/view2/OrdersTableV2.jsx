import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Check,
  Eye,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Printer,
  RefreshCw,
  StickyNote,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/dateHelper';
import { getCustomerPhone, getItemCount } from '../useOrderList';
import { StatusChip } from './StatusChip';

// Fixed column widths. Order notes take the remaining space.
const COLUMNS = [
  { key: 'select', className: 'w-12' },
  { key: 'id', className: 'w-[140px]' },
  { key: 'view', className: 'w-16' },
  { key: 'customer', className: 'w-[220px]' },
  { key: 'notes', className: '' },
  { key: 'amount', className: 'w-[130px]' },
  { key: 'date', className: 'w-[130px]' },
  { key: 'payment', className: 'w-[124px]' },
  { key: 'status', className: 'w-[124px]' },
  { key: 'actions', className: 'w-20' },
];

const formatAmount = (value) =>
  `৳${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const formatTime = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

// Stops a click inside a cell from also opening the row's quick view
const stop = (e) => e.stopPropagation();

function RowActions({ order, list }) {
  const { t } = useTranslation();
  const { orderActions, isReadOnly } = list;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        aria-label={t('common.actions', 'Actions')}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('common.actions', 'Actions')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => orderActions.openQuickView(order)} className="cursor-pointer">
          <Eye className="text-muted-foreground" /> {t('orders.quick_view', 'Quick view')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => orderActions.viewDetails(order)} className="cursor-pointer">
          <Eye className="text-muted-foreground" /> {t('common.details', 'View Details')}
        </DropdownMenuItem>
        {!isReadOnly && (
          <DropdownMenuItem onClick={() => orderActions.edit(order)} className="cursor-pointer">
            <Pencil className="text-muted-foreground" /> {t('common.edit', 'Edit Order')}
          </DropdownMenuItem>
        )}
        {!isReadOnly && (
          <DropdownMenuItem onClick={() => orderActions.openQuickView(order)} className="cursor-pointer">
            <RefreshCw className="text-muted-foreground" /> {t('orders.change_status', 'Change Status')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => orderActions.openInvoice(order)} className="cursor-pointer">
          <Printer className="text-muted-foreground" /> {t('orders.print_invoice', 'Print Invoice')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => orderActions.setInvoiceTarget(order)} className="cursor-pointer">
          <Mail className="text-muted-foreground" /> {t('orders.send_invoice_email', 'Email Invoice')}
        </DropdownMenuItem>
        {!isReadOnly && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => orderActions.setDeleteTarget({ id: order.id, orderNumber: order.orderNumber })}
              className="cursor-pointer"
            >
              <Trash2 /> {t('common.delete', 'Delete Order')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const noteIconBtn =
  'inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-50';

// Order notes with an inline editor; the input is one line so the row height stays the same
function NotesCell({ order, list }) {
  const { t } = useTranslation();
  const { orderActions, isReadOnly } = list;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = () => {
    setDraft(order.orderNotes || '');
    setIsEditing(true);
  };

  const save = async () => {
    if (draft.trim() === (order.orderNotes || '').trim()) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const ok = await orderActions.updateNotes(order, draft);
    setIsSaving(false);
    if (ok) setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          autoFocus
          value={draft}
          maxLength={1000}
          disabled={isSaving}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          placeholder={t('orders.add_note', 'Add a note')}
          className="h-7 min-w-0 flex-1 px-2 text-xs"
        />
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className={cn(noteIconBtn, 'bg-primary text-primary-foreground hover:bg-primary/90')}
          title={t('common.save', 'Save')}
          aria-label={t('common.save', 'Save')}
        >
          {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={isSaving}
          className={cn(noteIconBtn, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
          title={t('common.cancel', 'Cancel')}
          aria-label={t('common.cancel', 'Cancel')}
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-start gap-1">
      {order.orderNotes ? (
        <span
          className="flex min-w-0 flex-1 items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400"
          title={order.orderNotes}
        >
          <StickyNote className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-2 whitespace-normal">{order.orderNotes}</span>
        </span>
      ) : (
        <span className="flex-1 text-xs text-muted-foreground/50">—</span>
      )}
      {!isReadOnly && (
        <button
          type="button"
          onClick={startEdit}
          className={cn(noteIconBtn, '-my-1 text-muted-foreground hover:bg-primary/10 hover:text-primary')}
          title={t('orders.edit_notes', 'Edit notes')}
          aria-label={t('orders.edit_notes', 'Edit notes')}
        >
          <Pencil className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// View2 orders table: fixed columns, primary-tinted header, separate View column, row click = quick view
export function OrdersTableV2({ list }) {
  const { t } = useTranslation();
  const { data, selection, orderActions, isReadOnly } = list;
  const { orders, isLoading, isError, error } = data;

  if (isError) {
    return (
      <Alert variant="destructive" className="m-4 w-auto">
        <AlertCircle className="size-4" />
        <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
        <AlertDescription>
          {t('orders.fetch_failed', 'Failed to fetch orders.')} {error instanceof Error ? error.message : ''}
        </AlertDescription>
      </Alert>
    );
  }

  const pageIds = orders.map((o) => o.id);
  const selectedOnPage = pageIds.filter((id) => selection.ids.includes(id)).length;
  const allSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;
  const someSelected = selectedOnPage > 0 && !allSelected;

  return (
    <Table className="min-w-[1040px] table-fixed [&_td]:py-2.5 [&_th]:text-primary dark:[&_th]:text-foreground/90">
      <colgroup>
        {COLUMNS.map((col) => (
          <col key={col.key} className={col.className} />
        ))}
      </colgroup>

      <TableHeader className="bg-primary/10 dark:bg-primary/15 [&_tr]:border-primary/20">
        <TableRow>
          <TableHead className="pr-0 pl-4">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              disabled={isReadOnly || pageIds.length === 0}
              onCheckedChange={(checked) => selection.setMany(pageIds, Boolean(checked))}
              aria-label={t('orders.select_all', 'Select all orders on this page')}
            />
          </TableHead>
          <TableHead>{t('orders.order_id', 'Order ID')}</TableHead>
          <TableHead className="text-center">{t('common.view', 'View')}</TableHead>
          <TableHead>{t('orders.customer', 'Customer')}</TableHead>
          <TableHead>{t('orders.order_notes', 'Order Notes')}</TableHead>
          <TableHead className="text-right">{t('orders.amount', 'Amount')}</TableHead>
          <TableHead>{t('common.date', 'Date')}</TableHead>
          <TableHead>{t('orders.payment', 'Payment')}</TableHead>
          <TableHead>{t('orders.order_status', 'Order Status')}</TableHead>
          <TableHead className="pr-4 text-right">{t('common.actions', 'Actions')}</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="pl-4"><Skeleton className="size-4 rounded" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="mx-auto size-6 rounded-md" /></TableCell>
              <TableCell><Skeleton className="h-4 w-36" /><Skeleton className="mt-1.5 h-3 w-24" /></TableCell>
              <TableCell><Skeleton className="h-3 w-40" /></TableCell>
              <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
              <TableCell><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
              <TableCell className="pr-4"><Skeleton className="ml-auto size-8 rounded-md" /></TableCell>
            </TableRow>
          ))
        ) : orders.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={COLUMNS.length} className="h-28 text-center text-muted-foreground">
              {t('overview.no_recent_orders', 'No orders found.')}
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order) => {
            const isSelected = selection.ids.includes(order.id);
            const phone = getCustomerPhone(order);
            const itemCount = getItemCount(order);
            const isPartial = String(order.paymentStatus).toLowerCase() === 'partial';
            const due = order.paymentDetails?.pendingAmount ?? Math.max(0, Number(order.totalAmount || 0) - Number(order.paidAmount || 0));

            return (
              <TableRow
                key={order.id}
                data-state={isSelected ? 'selected' : undefined}
                onClick={() => orderActions.openQuickView(order)}
                className={cn('cursor-pointer', isSelected && 'bg-primary/5 hover:bg-primary/10')}
              >
                <TableCell className="pr-0 pl-4" onClick={stop}>
                  <Checkbox
                    checked={isSelected}
                    disabled={isReadOnly}
                    onCheckedChange={(checked) => selection.toggle(order.id, Boolean(checked))}
                    aria-label={`Select order ${order.orderNumber}`}
                  />
                </TableCell>

                <TableCell className="overflow-hidden">
                  <span className="block truncate font-mono text-[13px] font-semibold text-foreground" title={order.orderNumber}>
                    #{order.orderNumber}
                  </span>
                  {order.courier?.consignmentId ? (
                    <span
                      className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#082F49] px-1.5 py-px text-[10px] font-semibold text-[#38BDF8] ring-1 ring-[#0369A1] ring-inset"
                      title={`Pathao consignment: ${order.courier.consignmentId}`}
                    >
                      <Truck className="size-2.5" /> Pathao
                    </span>
                  ) : (
                    itemCount > 0 && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    )
                  )}
                </TableCell>

                <TableCell className="text-center" onClick={stop}>
                  <button
                    type="button"
                    onClick={() => orderActions.openQuickView(order)}
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    title={t('orders.quick_view', 'Quick view')}
                    aria-label={t('orders.quick_view', 'Quick view')}
                  >
                    <Eye className="size-4" />
                  </button>
                </TableCell>

                <TableCell className="overflow-hidden">
                  <span className="block truncate font-medium text-foreground" title={order.customerName}>
                    {order.customerName}
                  </span>
                  {phone && <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">{phone}</span>}
                </TableCell>

                <TableCell className="overflow-hidden" onClick={stop}>
                  <NotesCell order={order} list={list} />
                </TableCell>

                <TableCell className="text-right">
                  <span className="font-semibold tabular-nums text-foreground">{formatAmount(order.totalAmount)}</span>
                </TableCell>

                <TableCell>
                  <span className="block text-foreground">{formatDate(order.date)}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{formatTime(order.date)}</span>
                </TableCell>

                <TableCell className="overflow-hidden">
                  <StatusChip kind="payment" status={order.paymentStatus} />
                  {isPartial && Number(order.paidAmount || 0) > 0 && (
                    <span className="mt-1 block truncate text-[10px] leading-tight">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {t('orders.due_short', 'Due')} {formatAmount(due)}
                      </span>
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <StatusChip kind="order" status={order.orderStatus} />
                </TableCell>

                <TableCell className="pr-4 text-right" onClick={stop}>
                  <RowActions order={order} list={list} />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export default OrdersTableV2;
