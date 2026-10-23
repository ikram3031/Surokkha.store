import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FILTER_CONTROL_CLASS, PRIMARY_BUTTON_CLASS } from '../constants';
import { useIsWide } from './useMediaQuery';

// ---- date helpers (local dates as 'YYYY-MM-DD', same format the API filter uses)
const pad = (n) => String(n).padStart(2, '0');
const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const parseYmd = (s) => new Date(`${s}T00:00:00`);
const formatYmd = (s) =>
  parseYmd(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const PRESETS = [
  { key: 'today', labelKey: 'dates.today', label: 'Today', range: () => [toYmd(new Date()), toYmd(new Date())] },
  { key: 'yesterday', labelKey: 'dates.yesterday', label: 'Yesterday', range: () => { const y = toYmd(addDays(new Date(), -1)); return [y, y]; } },
  { key: '7d', labelKey: 'dates.last_7_days', label: 'Last 7 days', range: () => [toYmd(addDays(new Date(), -6)), toYmd(new Date())] },
  { key: '30d', labelKey: 'dates.last_30_days', label: 'Last 30 days', range: () => [toYmd(addDays(new Date(), -29)), toYmd(new Date())] },
  {
    key: 'month',
    labelKey: 'dates.this_month',
    label: 'This month',
    range: () => {
      const now = new Date();
      return [toYmd(new Date(now.getFullYear(), now.getMonth(), 1)), toYmd(now)];
    },
  },
  { key: 'all', labelKey: 'dates.all_time', label: 'All time', range: () => ['', ''] },
];

// First month shown: the selected start, or (two-month view) last month + this month
const initialMonth = (from, wide) => {
  const base = from ? parseYmd(from) : new Date();
  return new Date(base.getFullYear(), base.getMonth() - (wide && !from ? 1 : 0), 1);
};

function Month({ year, month, draft, today, onPick, showPrev, showNext, onNav }) {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const { from, to } = draft;

  return (
    <div className="w-[252px]">
      <div className="relative mb-2 flex h-8 items-center justify-center text-sm font-medium">
        {showPrev && (
          <button
            type="button"
            onClick={() => onNav(-1)}
            className="absolute left-0 inline-flex size-7 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
        {label}
        {showNext && (
          <button
            type="button"
            onClick={() => onNav(1)}
            className="absolute right-0 inline-flex size-7 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 text-center text-[0.8rem] text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <span key={w} className="h-8 leading-8">{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: first.getDay() }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const day = toYmd(new Date(year, month, i + 1));
          const isStart = day === from;
          const isEnd = day === to;
          const inRange = from && to && day > from && day < to;
          const isSpan = from && to && from !== to;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onPick(day)}
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-md text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40',
                (isStart || isEnd) && 'bg-primary font-medium text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                inRange && 'rounded-none bg-primary/15 hover:bg-primary/25',
                !isStart && !isEnd && !inRange && day === today && 'bg-accent font-semibold',
                isStart && isSpan && 'rounded-r-none',
                isEnd && isSpan && 'rounded-l-none'
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One trigger, one calendar: pick a start day, then an end day.
 * The range is sent to onChange(from, to) once both ends are picked (or a preset is chosen).
 */
export function DateRangePicker({ from, to, onChange, className }) {
  const { t } = useTranslation();
  const isWide = useIsWide();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from, to });
  const [view, setView] = useState(() => initialMonth(from, isWide));

  const monthCount = isWide ? 2 : 1;
  const today = toYmd(new Date());
  const hasRange = Boolean(from);

  const handleOpenChange = (nextOpen) => {
    if (nextOpen) {
      setDraft({ from, to });
      setView(initialMonth(from, isWide));
    }
    setOpen(nextOpen);
  };

  const pickDay = (day) => {
    let next;
    if (!draft.from || draft.to) next = { from: day, to: '' }; // start a new range
    else if (day < draft.from) next = { from: day, to: draft.from }; // clicked before start: swap
    else next = { from: draft.from, to: day };
    setDraft(next);
    if (next.to) onChange(next.from, next.to);
  };

  const applyPreset = (preset) => {
    const [a, b] = preset.range();
    setDraft({ from: a, to: b });
    onChange(a, b);
    setOpen(false);
  };

  const clear = () => {
    setDraft({ from: '', to: '' });
    onChange('', '');
  };

  const done = () => {
    // Only a start day picked: filter that single day
    if (draft.from && !draft.to) onChange(draft.from, draft.from);
    setOpen(false);
  };

  const triggerLabel = !from
    ? t('orders.pick_date_range', 'Pick a date range')
    : !to || from === to
      ? formatYmd(from)
      : `${formatYmd(from)} – ${formatYmd(to)}`;

  const hint = !draft.from
    ? t('orders.select_start_date', 'Select a start date')
    : !draft.to
      ? t('orders.select_end_date', 'Select an end date')
      : draft.from === draft.to
        ? formatYmd(draft.from)
        : `${formatYmd(draft.from)} – ${formatYmd(draft.to)}`;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger data-active={hasRange} className={cn(FILTER_CONTROL_CLASS, 'sm:min-w-60', className)}>
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays className="size-4 shrink-0 opacity-60" />
          <span className={cn('truncate', !hasRange && 'text-muted-foreground')}>{triggerLabel}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-auto max-w-[calc(100vw-1rem)] rounded-lg p-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-wrap gap-1 border-b pb-3 sm:w-32 sm:flex-col sm:flex-nowrap sm:border-r sm:border-b-0 sm:pr-3 sm:pb-0">
            {PRESETS.map((preset) => {
              const [a, b] = preset.range();
              const active = a === from && b === to;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                    active && 'bg-accent font-medium text-primary'
                  )}
                >
                  {t(preset.labelKey, preset.label)}
                </button>
              );
            })}
          </div>

          <div>
            <div className="flex gap-4">
              {Array.from({ length: monthCount }).map((_, i) => {
                const m = new Date(view.getFullYear(), view.getMonth() + i, 1);
                return (
                  <Month
                    key={`${m.getFullYear()}-${m.getMonth()}`}
                    year={m.getFullYear()}
                    month={m.getMonth()}
                    draft={draft}
                    today={today}
                    onPick={pickDay}
                    showPrev={i === 0}
                    showNext={i === monthCount - 1}
                    onNav={(step) => setView((v) => new Date(v.getFullYear(), v.getMonth() + step, 1))}
                  />
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
              <p className="truncate text-xs text-muted-foreground">{hint}</p>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" className="h-8 px-3 text-sm" onClick={clear}>
                  {t('common.clear', 'Clear')}
                </Button>
                <Button type="button" className={cn('h-8 px-3 text-sm', PRIMARY_BUTTON_CLASS)} onClick={done}>
                  {t('common.done', 'Done')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DateRangePicker;
