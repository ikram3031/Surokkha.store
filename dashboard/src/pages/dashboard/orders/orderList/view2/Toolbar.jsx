import { useTranslation } from 'react-i18next';
import { Filter, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getStatusOptionClass } from '@/utils/statusColors';
import {
  FILTER_CONTROL_CLASS,
  ORDER_FILTER_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_BULK_OPTIONS,
  PAYMENT_FILTER_OPTIONS,
  STATUS_ALL,
} from '../constants';
import { DateRangePicker } from './DateRangePicker';

const useOptionLabel = () => {
  const { t } = useTranslation();
  return (opt) => (opt.labelKey ? t(opt.labelKey, opt.label) : opt.label);
};

// Colored dot that takes the option's text color
const Dot = ({ value }) => <span className={cn('size-1.5 shrink-0 rounded-full bg-current', getStatusOptionClass(value))} />;

// Search field — white in dark mode
function SearchBox({ search, className }) {
  const { t } = useTranslation();
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-2.5 left-2.5 z-10 size-4 text-muted-foreground dark:text-zinc-500" />
      <Input
        type="text"
        value={search.input}
        onChange={(e) => search.setInput(e.target.value)}
        placeholder={t('orders.search_orders', 'Search by order ID, phone, customer name...')}
        className="h-9 pr-8 pl-8 text-sm dark:border-white dark:bg-white dark:text-zinc-900 dark:placeholder:text-zinc-500"
      />
      {search.input && (
        <button
          type="button"
          onClick={() => search.setInput('')}
          className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground dark:text-zinc-500 dark:hover:text-zinc-900"
          aria-label={t('common.clear', 'Clear')}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

// Order status filter (multi-select). On mobile the "Status:" prefix hides once a value is chosen.
function StatusFilter({ filters }) {
  const { t } = useTranslation();
  const optionLabel = useOptionLabel();
  const selected = filters.selectedStatuses;
  const active = selected.length > 0;
  const single = selected.length === 1 ? ORDER_FILTER_OPTIONS.find((o) => o.value === selected[0]) : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-active={active}
        className={FILTER_CONTROL_CLASS}
        aria-label={t('orders.order_status', 'Order Status')}
      >
        <span className="truncate">
          <span className={cn(active && 'hidden sm:inline')}>
            <span className="hidden min-[400px]:inline">{t('orders.order_status', 'Order Status')}</span>
            <span className="min-[400px]:hidden">{t('common.status', 'Status')}</span>:{' '}
          </span>
          {!active ? (
            t('common.all', 'All')
          ) : single ? (
            <span className={cn('font-medium', getStatusOptionClass(single.value))}>{optionLabel(single)}</span>
          ) : (
            <span className="font-medium">
              {selected.length} {t('common.selected', 'selected')}
            </span>
          )}
        </span>
        <Filter className="size-4 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('orders.order_status', 'Order Status')}</span>
          {active && (
            <button
              type="button"
              onClick={filters.clearStatus}
              className="text-[11px] font-medium text-destructive underline hover:text-destructive/80"
            >
              {t('common.clear', 'Clear')}
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ORDER_FILTER_OPTIONS.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onCheckedChange={() => filters.toggleStatus(opt.value)}
            className={cn('cursor-pointer gap-2 font-medium', getStatusOptionClass(opt.value))}
          >
            <Dot value={opt.value} />
            {optionLabel(opt)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Payment status filter (single select)
function PaymentFilter({ filters }) {
  const { t } = useTranslation();
  const optionLabel = useOptionLabel();
  const active = filters.payment !== STATUS_ALL;
  const current = PAYMENT_FILTER_OPTIONS.find((o) => o.value === filters.payment);

  return (
    <Select value={filters.payment} onValueChange={(v) => filters.setPayment(v ?? STATUS_ALL)}>
      <SelectTrigger
        data-active={active}
        aria-label={t('orders.payment_status', 'Payment Status')}
        className={cn(FILTER_CONTROL_CLASS, 'w-auto data-[size=default]:h-9 dark:bg-zinc-800 dark:hover:bg-zinc-700')}
      >
        <span className="truncate">
          <span className={cn(active && 'hidden sm:inline')}>
            {t('orders.payment', 'Payment')}
            <span className="hidden min-[400px]:inline"> {t('common.status', 'Status')}</span>:{' '}
          </span>
          {active ? <span className="font-medium">{current ? optionLabel(current) : filters.payment}</span> : t('common.all', 'All')}
        </span>
      </SelectTrigger>
      <SelectContent side="bottom" className="min-w-44">
        <SelectItem value={STATUS_ALL}>{t('common.all', 'All')}</SelectItem>
        {PAYMENT_FILTER_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className={cn('font-medium', getStatusOptionClass(opt.value))}>
            <Dot value={opt.value} />
            {optionLabel(opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Shown instead of the filters while rows are selected
function BulkBar({ list }) {
  const { t } = useTranslation();
  const optionLabel = useOptionLabel();
  const { selection, bulk } = list;
  const tint = 'h-9 w-full data-[size=default]:h-9 font-medium text-sm sm:w-40';

  return (
    <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap sm:justify-end">
      <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1">
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          <span className="font-semibold text-primary">{selection.ids.length}</span> {t('common.selected', 'selected')}
        </span>
        <button
          type="button"
          onClick={selection.clear}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
        >
          <X className="size-3.5" /> {t('common.clear', 'Clear')}
        </button>
      </div>

      <Select value="" onValueChange={(v) => v && bulk.setPaymentTarget(v)}>
        <SelectTrigger className={cn(tint, 'border-amber-500/50 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20')}>
          <span>{t('orders.payment_status', 'Payment Status')}</span>
        </SelectTrigger>
        <SelectContent side="bottom">
          {PAYMENT_BULK_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className={cn('font-medium', getStatusOptionClass(opt.value))}>
              <Dot value={opt.value} />
              {optionLabel(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value="" onValueChange={(v) => v && bulk.setStatusTarget(v)}>
        <SelectTrigger className={cn(tint, 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20')}>
          <span>{t('orders.order_status', 'Order Status')}</span>
        </SelectTrigger>
        <SelectContent side="bottom">
          {ORDER_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className={cn('font-medium', getStatusOptionClass(opt.value))}>
              <Dot value={opt.value} />
              {optionLabel(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="col-span-2 flex gap-2 sm:col-span-1">
        <Button
          variant="destructive"
          onClick={() => bulk.setDeleteOpen(true)}
          className="h-9 flex-1 gap-2 px-3 text-sm sm:flex-none"
          title={`${t('common.delete', 'Delete Selected')} (${selection.ids.length})`}
        >
          <Trash2 className="size-4" />
          <span className="sm:hidden">{t('common.delete', 'Delete')}</span>
        </Button>
        <Button variant="outline" onClick={selection.clear} className="hidden h-9 gap-1.5 px-3 text-sm sm:inline-flex">
          <X className="size-4" />
          {t('common.clear', 'Clear')}
        </Button>
      </div>
    </div>
  );
}

// Search on the left; date range + filters (or bulk actions while rows are selected) on the right
export function Toolbar({ list }) {
  const { t } = useTranslation();
  const { search, filters, selection, isReadOnly } = list;
  const showBulk = selection.ids.length > 0 && !isReadOnly;

  return (
    <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
      <SearchBox search={search} className="xl:w-96" />

      {showBulk ? (
        <BulkBar list={list} />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
          {filters.hasActive && (
            <Button
              type="button"
              variant="ghost"
              onClick={filters.reset}
              className="col-span-2 h-9 gap-1.5 px-3 text-sm text-muted-foreground hover:text-foreground sm:col-span-1"
            >
              <RotateCcw className="size-3.5" />
              {t('common.reset', 'Reset')}
            </Button>
          )}
          <DateRangePicker
            from={filters.dateFrom}
            to={filters.dateTo}
            onChange={filters.setDateRange}
            className="col-span-2 sm:col-span-1"
          />
          <StatusFilter filters={filters} />
          <PaymentFilter filters={filters} />
        </div>
      )}
    </div>
  );
}

export default Toolbar;
