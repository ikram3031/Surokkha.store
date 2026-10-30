import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const TONES = {
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  red: 'bg-destructive/10 text-destructive',
  gray: 'bg-muted text-muted-foreground',
  gold: 'bg-primary/15 text-primary',
};

// Soft-tinted badge used for statuses, scores and counts across the blog workspace
export const ToneBadge = ({ tone = 'gray', className, children, ...props }) => (
  <Badge variant="secondary" className={cn(TONES[tone], className)} {...props}>
    {children}
  </Badge>
);

// Colours an SEO score: 80+ good, 50+ needs work, below that poor
export const scoreTone = (score) => (score >= 80 ? 'green' : score >= 50 ? 'amber' : 'red');

// Badge showing an SEO score in its matching tone
export const ScoreBadge = ({ score }) => <ToneBadge tone={scoreTone(score)}>{score}</ToneBadge>;

// Page title row with optional action buttons on the right
export const PageHeader = ({ title, description, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 className="text-xl font-bold">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </div>
);

// Labelled form control wrapper matching the SEO overview card labels
export const Field = ({ label, right, className, children }) => (
  <div className={className}>
    {(label || right) && (
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-muted-foreground">{label}</label>
        {right}
      </div>
    )}
    {children}
  </div>
);

// Native select styled like <Input>
export const NativeSelect = ({ className, children, ...props }) => (
  <select
    className={cn(
      'h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:[&>option]:bg-popover',
      className
    )}
    {...props}
  >
    {children}
  </select>
);

// Search input with leading icon
export const SearchBox = ({ className, ...props }) => (
  <div className={cn('relative min-w-[200px] flex-1 sm:max-w-xs', className)}>
    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    <Input className="pl-8" {...props} />
  </div>
);

// Underline tab bar (state-driven, used for list filters)
export const TabBar = ({ tabs, value, onChange }) => (
  <div className="flex flex-wrap gap-x-1 border-b px-2">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        type="button"
        onClick={() => onChange(tab.value)}
        className={cn(
          '-mb-px cursor-pointer whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors',
          value === tab.value
            ? 'border-primary font-semibold text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
      >
        {tab.label}
        {tab.count !== undefined && <span className="ml-1 text-muted-foreground">{tab.count}</span>}
      </button>
    ))}
  </div>
);

// Label + description with a switch on the right
export const ToggleRow = ({ title, description, checked, onCheckedChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
    <span>
      <span className="block text-sm font-medium">{title}</span>
      {description && <span className="block text-xs text-muted-foreground">{description}</span>}
    </span>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </label>
);

// KPI tile; `note` is the small line beneath the value
export const StatCard = ({ title, value, icon: Icon, note, noteTone = 'muted' }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {note && (
        <p
          className={cn(
            'mt-1 text-xs',
            noteTone === 'up' && 'text-emerald-500',
            noteTone === 'down' && 'text-destructive',
            noteTone === 'muted' && 'text-muted-foreground'
          )}
        >
          {note}
        </p>
      )}
    </CardContent>
  </Card>
);

// Square icon avatar for counters
export const IconTile = ({ icon: Icon, className }) => (
  <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', className)}>
    <Icon className="h-5 w-5" />
  </span>
);

// Row of icon buttons shown at the end of a table row
export const RowActions = ({ children }) => <div className="flex justify-end gap-1">{children}</div>;

// Small sparkline for keyword trends
export const Sparkline = ({ points }) => {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const coords = points.map((p, i) => `${(i / (points.length - 1)) * 60},${18 - ((p - min) / span) * 16}`).join(' ');
  return (
    <svg viewBox="0 0 60 20" className="h-5 w-16">
      <polyline fill="none" stroke="var(--primary)" strokeWidth="2" points={coords} />
    </svg>
  );
};
