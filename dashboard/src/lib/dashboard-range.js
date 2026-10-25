// Shared date-range filter for the dashboard overview.
// A filter is { range, from?, to? } where range is today | month | 7days | 30days | custom and from/to are YYYY-MM-DD (custom only).

export const RANGE_OPTIONS = [
  { value: 'today', key: 'overview.today', label: 'Today' },
  { value: 'month', key: 'overview.this_month_range', label: 'This Month' },
  { value: '7days', key: 'overview.last_7_days', label: 'Last 7 Days' },
  { value: '30days', key: 'overview.last_30_days', label: 'Last 30 Days' },
  { value: 'custom', key: 'overview.custom_range', label: 'Custom Range' },
];

export const DEFAULT_RANGE_FILTER = { range: 'month' };

// Accepts a filter object or a plain range string and returns the API query params
export const toRangeParams = (filter) => {
  const f = typeof filter === 'string' ? { range: filter } : filter || DEFAULT_RANGE_FILTER;
  if (f.range === 'custom' && f.from && f.to) return { range: 'custom', from: f.from, to: f.to };
  return { range: f.range === 'custom' ? DEFAULT_RANGE_FILTER.range : f.range || DEFAULT_RANGE_FILTER.range };
};
