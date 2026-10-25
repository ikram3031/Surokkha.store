import styles from '@/styles/styles.json';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Order list config shared by View1 and View2.
// Status lists, chip tones and page sizes live here so both views stay in sync.
// ---------------------------------------------------------------------------

export const STATUS_ALL = 'All';

// Rows per page offered by View2 (View1's OrdersTable uses its own fixed size)
export const PAGE_SIZE_OPTIONS = [10, 15, 20, 50];
// Default rows per page: desktop vs mobile (below Tailwind `sm`)
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_SIZE_MOBILE = 10;

// Orders older than this many pages are not pulled by Export (100 rows per request)
export const EXPORT_MAX_PAGES = 50;

// Order statuses. `filter: false` = can be set on an order but is not offered as a list filter.
export const ORDER_STATUS_OPTIONS = [
  { value: 'Pending', labelKey: 'orders.status_pending', label: 'Pending' },
  { value: 'Processing', labelKey: 'orders.status_processing', label: 'Processing' },
  { value: 'Hold', labelKey: 'orders.status_hold', label: 'Hold' },
  { value: 'Shipped', labelKey: 'orders.status_shipped', label: 'Shipped' },
  { value: 'Completed', labelKey: 'orders.status_delivered', label: 'Completed' },
  { value: 'Cancelled', labelKey: 'orders.status_canceled', label: 'Cancelled' },
  { value: 'Return', label: 'Return', filter: false },
  { value: 'Fake', label: 'Fake' },
];
export const ORDER_FILTER_OPTIONS = ORDER_STATUS_OPTIONS.filter((o) => o.filter !== false);

// Payment statuses, per place they are used (kept identical to the previous page)
const PAYMENT_OPTION_MAP = {
  Paid: { value: 'Paid', labelKey: 'orders.status_paid', label: 'Paid' },
  Pending: { value: 'Pending', labelKey: 'orders.status_pending', label: 'Pending' },
  Partial: { value: 'Partial', labelKey: 'orders.status_partial', label: 'Partial' },
  Failed: { value: 'Failed', labelKey: 'orders.status_failed', label: 'Failed' },
  Refunded: { value: 'Refunded', labelKey: 'orders.status_returned', label: 'Refunded' },
};
export const PAYMENT_FILTER_OPTIONS = ['Paid', 'Pending', 'Failed'].map((v) => PAYMENT_OPTION_MAP[v]);
export const PAYMENT_BULK_OPTIONS = ['Paid', 'Pending', 'Failed', 'Refunded'].map((v) => PAYMENT_OPTION_MAP[v]);
export const PAYMENT_UPDATE_OPTIONS = ['Paid', 'Pending', 'Partial', 'Failed'].map((v) => PAYMENT_OPTION_MAP[v]);

// Status → chip tone (tones are defined in styles/styles.json → badge.status.tones)
const ORDER_STATUS_META = {
  pending: { tone: 'pending', labelKey: 'orders.status_pending', label: 'Pending' },
  unfulfilled: { tone: 'pending', labelKey: 'orders.status_pending', label: 'Pending' },
  processing: { tone: 'processing', labelKey: 'orders.status_processing', label: 'Processing' },
  confirmed: { tone: 'processing', labelKey: 'orders.status_confirmed', label: 'Confirmed' },
  hold: { tone: 'hold', labelKey: 'orders.status_hold', label: 'Hold' },
  shipped: { tone: 'shipped', labelKey: 'orders.status_shipped', label: 'Shipped' },
  completed: { tone: 'delivered', labelKey: 'orders.status_delivered', label: 'Completed' },
  delivered: { tone: 'delivered', labelKey: 'orders.status_delivered', label: 'Completed' },
  cancelled: { tone: 'cancelled', labelKey: 'orders.status_canceled', label: 'Cancelled' },
  canceled: { tone: 'cancelled', labelKey: 'orders.status_canceled', label: 'Cancelled' },
  return: { tone: 'cancelled', labelKey: 'orders.status_returned', label: 'Returned' },
  returned: { tone: 'cancelled', labelKey: 'orders.status_returned', label: 'Returned' },
  fake: { tone: 'fake', label: 'Fake' },
};

const PAYMENT_STATUS_META = {
  paid: { tone: 'delivered', labelKey: 'orders.status_paid', label: 'Paid' },
  pending: { tone: 'pending', labelKey: 'orders.status_pending', label: 'Pending' },
  partial: { tone: 'processing', labelKey: 'orders.status_partial', label: 'Partial' },
  returned: { tone: 'cancelled', labelKey: 'orders.status_returned', label: 'Returned' },
  refunded: { tone: 'cancelled', labelKey: 'orders.status_returned', label: 'Refunded' },
  failed: { tone: 'cancelled', labelKey: 'orders.status_failed', label: 'Failed' },
  cancelled: { tone: 'cancelled', labelKey: 'orders.status_failed', label: 'Failed' },
  canceled: { tone: 'cancelled', labelKey: 'orders.status_failed', label: 'Failed' },
};

const fallbackMeta = (status) => ({ tone: 'pending', label: status || '—' });

export const getOrderStatusMeta = (status) =>
  ORDER_STATUS_META[String(status || '').toLowerCase()] ?? fallbackMeta(status);

export const getPaymentStatusMeta = (status) =>
  PAYMENT_STATUS_META[String(status || '').toLowerCase()] ?? fallbackMeta(status);

// Same-size status chip (rounded-md, no dot) using the shared tones
export const statusChipClass = (tone, className) =>
  cn(
    'inline-flex shrink-0 items-center text-xs',
    styles.badge.status.base,
    'rounded-md',
    styles.badge.status.tones[tone] ?? styles.badge.status.tones.pending,
    className
  );

// ---------------------------------------------------------------------------
// View2 style tokens. Colors come from theme variables (primary, muted…),
// so every whitelabel client gets its own brand color automatically.
// ---------------------------------------------------------------------------

// Toolbar date range + filters: gray background with a primary border
export const FILTER_CONTROL_CLASS =
  'inline-flex h-9 min-w-0 items-center justify-between gap-2 rounded-md border border-primary/70 bg-zinc-100 px-2.5 text-sm whitespace-nowrap shadow-xs transition-colors outline-none hover:border-primary hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-ring/40 data-[active=true]:border-primary sm:min-w-44 sm:px-3 dark:bg-zinc-800 dark:hover:bg-zinc-700';

// Light mode: outline. Dark mode: white background, black text (Export, Print invoice)
export const LIGHT_BUTTON_CLASS =
  'border-border bg-background text-foreground hover:bg-muted dark:border-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:hover:text-zinc-900';

// Solid brand button (New Custom Order, Edit order, Save)
export const PRIMARY_BUTTON_CLASS =
  'bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90';

// Pagination buttons
export const PAGE_BUTTON_CLASS =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-primary/40 px-2 text-sm font-medium tabular-nums transition-colors outline-none hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-35';
export const PAGE_BUTTON_ACTIVE_CLASS =
  'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground';
