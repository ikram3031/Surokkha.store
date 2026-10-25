import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RANGE_OPTIONS } from '@/lib/dashboard-range';

const todayStr = () => {
  // BD-local (+06:00) calendar date as YYYY-MM-DD
  return new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

// Date range dropdown for the dashboard header; "Custom Range" reveals from/to date inputs
export const DashboardRangePicker = ({ value, onChange }) => {
  const { t } = useTranslation();

  const handleRange = (range) => {
    if (range === 'custom') {
      const today = todayStr();
      onChange({ range, from: value.from || today, to: value.to || today });
    } else {
      onChange({ range });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select value={value.range} onValueChange={handleRange}>
        <SelectTrigger className="h-9 w-[150px] text-sm font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RANGE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{t(o.key, o.label)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value.range === 'custom' && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="h-9 w-[140px] text-sm"
            value={value.from || ''}
            max={value.to || undefined}
            onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })}
          />
          <span className="text-sm text-muted-foreground">–</span>
          <Input
            type="date"
            className="h-9 w-[140px] text-sm"
            value={value.to || ''}
            min={value.from || undefined}
            onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardRangePicker;
