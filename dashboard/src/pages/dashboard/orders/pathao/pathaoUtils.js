// Shared helpers for the Pathao orders page
export const ACTION_BTN =
  'cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90';

export const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `৳${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const SETTLEMENT_META = {
  none: { label: 'In transit', className: 'bg-muted text-muted-foreground' },
  pending: { label: 'Awaiting payout', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  invoiced: { label: 'Paid by Pathao', className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  settled: { label: 'Paid, invoice matched', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  disputed: { label: 'Disputed', className: 'bg-red-500/15 text-red-700 dark:text-red-400' },
};

// Pathao merchant panel buckets, in the panel's order. Palette validated for CVD/contrast per mode
// (light passes all checks; dark has one near-floor pair, relieved by the labelled cards and slice gaps).
export const CATEGORY_META = {
  delivered: { label: 'Delivered', light: '#0a8a4f', dark: '#087a45' },
  active: { label: 'Active Deliveries', light: '#5cb87e', dark: '#2aa8b0' },
  on_hold: { label: 'On hold', light: '#f08a10', dark: '#b87c0a' },
  regular_return: { label: 'Regular Return', light: '#d8344f', dark: '#e0405a' },
  paid_return: { label: 'Paid Return', light: '#e86fb5', dark: '#c25cb8' },
  partial_return: { label: 'Partial Return', light: '#8f5fd6', dark: '#6f7be8' },
  exchange: { label: 'Exchange', light: '#c9a227', dark: '#a8851a' },
  others: { label: 'Others', light: '#1e88e5', dark: '#1e88e5' },
};

export const ORDER_STATUS_META = {
  completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  return: 'bg-red-500/15 text-red-700 dark:text-red-400',
  shipped: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
};
