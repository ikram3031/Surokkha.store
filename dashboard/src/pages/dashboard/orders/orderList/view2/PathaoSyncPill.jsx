import { RefreshCw, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/dateHelper';

// "Pathao synced: <time>  [Sync now]" — Sync now is white with red text in dark mode
export function PathaoSyncPill({ pathao, className }) {
  return (
    <div
      className={cn(
        'max-w-full items-center gap-2 rounded-full border bg-card py-1 pr-1 pl-3 text-xs shadow-xs',
        className
      )}
    >
      <Truck className="size-3.5 shrink-0 text-primary" />
      <span className="whitespace-nowrap text-muted-foreground">
        Pathao synced:{' '}
        <span className="font-semibold text-foreground">
          {pathao.lastSyncAt ? formatDateTime(pathao.lastSyncAt) : 'Never'}
        </span>
      </span>
      <button
        type="button"
        onClick={pathao.sync}
        disabled={pathao.isSyncing}
        className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-70 dark:bg-white dark:text-red-600 dark:hover:bg-zinc-200"
      >
        <RefreshCw className={cn('size-3', pathao.isSyncing && 'animate-spin')} />
        {pathao.isSyncing ? 'Syncing…' : 'Sync now'}
      </button>
    </div>
  );
}

export default PathaoSyncPill;
