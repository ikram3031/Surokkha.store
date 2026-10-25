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

export const ORDER_STATUS_META = {
  completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  return: 'bg-red-500/15 text-red-700 dark:text-red-400',
  shipped: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
};
