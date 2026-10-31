import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// YYYY-MM-DD of the local calendar day (toISOString would shift it to UTC, i.e. the previous day in Bangladesh)
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const getDateRangeBounds = (preset) => {
  const now = new Date();
  const todayStr = ymd(now);

  if (preset === 'today') {
    return { startDate: todayStr, endDate: todayStr, label: 'Today' };
  }
  if (preset === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yStr = ymd(yesterday);
    return { startDate: yStr, endDate: yStr, label: 'Yesterday' };
  }
  if (preset === '7days') {
    const d = new Date(now);
    d.setDate(now.getDate() - 7);
    return { startDate: ymd(d), endDate: todayStr, label: 'Last 7 Days' };
  }
  if (preset === '30days') {
    const d = new Date(now);
    d.setDate(now.getDate() - 30);
    return { startDate: ymd(d), endDate: todayStr, label: 'Last 30 Days' };
  }
  if (preset === 'thisMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: ymd(firstDay), endDate: todayStr, label: 'This Month' };
  }
  if (preset === 'lastMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: ymd(firstDay),
      endDate: ymd(lastDay),
      label: 'Last Month',
    };
  }
  if (preset === 'thisYear') {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    return { startDate: ymd(firstDay), endDate: todayStr, label: 'This Year' };
  }
  return { startDate: '', endDate: '', label: 'All Time' };
};

export const DateRangeFilter = ({
  value = 'all',
  onChange,
  className = '',
  size = 'default',
}) => {
  const [selectedPreset, setSelectedPreset] = useState(value);
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    if (preset === 'custom') {
      setCustomOpen(true);
      return;
    }
    const bounds = getDateRangeBounds(preset);
    if (onChange) {
      onChange({
        preset,
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        label: bounds.label,
      });
    }
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return;
    setCustomOpen(false);
    if (onChange) {
      onChange({
        preset: 'custom',
        startDate: customStart,
        endDate: customEnd,
        label: `${customStart} → ${customEnd}`,
      });
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={selectedPreset} onValueChange={handleSelectPreset}>
        <SelectTrigger className={`h-9 text-xs sm:w-44 bg-card ${size === 'sm' ? 'h-8 text-[11px]' : ''}`}>
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
          <span className="truncate">
            Date: {selectedPreset === 'custom' ? 'Custom' : getDateRangeBounds(selectedPreset).label}
          </span>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="7days">Last 7 Days</SelectItem>
          <SelectItem value="30days">Last 30 Days</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
          <SelectItem value="lastMonth">Last Month</SelectItem>
          <SelectItem value="thisYear">This Year</SelectItem>
          <SelectItem value="custom">Custom Date Range...</SelectItem>
        </SelectContent>
      </Select>

      {selectedPreset === 'custom' && customStart && customEnd && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCustomOpen(true)}
          className="h-9 text-xs gap-1.5 bg-muted/40 font-mono text-muted-foreground hover:text-foreground"
        >
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>{customStart} → {customEnd}</span>
        </Button>
      )}

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Custom Date Range Filter
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Start Date</label>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">End Date</label>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="cancel"
              size="sm"
              onClick={() => {
                setCustomOpen(false);
                if (!customStart && !customEnd) setSelectedPreset('all');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApplyCustom}
              disabled={!customStart || !customEnd}
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DateRangeFilter;
