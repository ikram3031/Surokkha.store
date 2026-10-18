import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export const EMPTY_FEE = { name: '', percent: '', fixed: '' };

// Fee rows that are actually filled in (a name is required for a row to count)
export const cleanFees = (fees) =>
  (fees || [])
    .map((fee) => ({
      name: String(fee.name || '').trim(),
      percent: Math.max(0, Number(fee.percent) || 0),
      fixed: Math.max(0, Number(fee.fixed) || 0),
    }))
    .filter((fee) => fee.name);

// Charge on an amount: percent of the amount plus the fixed part
export const calculateFeeAmount = (fee, baseAmount) => {
  const percent = Number(fee?.percent) || 0;
  const fixed = Number(fee?.fixed) || 0;
  const amount = (Number(baseAmount) || 0) * (percent / 100) + fixed;
  return Math.round(amount * 100) / 100;
};

// Short label such as "1.85% + ৳5"
export const formatFeeRate = (fee) => {
  const parts = [];
  if (Number(fee?.percent) > 0) parts.push(`${Number(fee.percent)}%`);
  if (Number(fee?.fixed) > 0) parts.push(`৳${Number(fee.fixed)}`);
  return parts.join(' + ') || '0';
};

// "Add charge / fee" checkbox with dynamic rows: name, percent and/or fixed amount, plus a button to add rows
export const PaymentFeesEditor = ({ enabled, onEnabledChange, fees, onChange }) => {
  const rows = fees && fees.length > 0 ? fees : [EMPTY_FEE];

  const updateRow = (index, field, value) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => onChange([...rows, { ...EMPTY_FEE }]);

  const removeRow = (index) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [{ ...EMPTY_FEE }]);
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none w-fit">
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => {
            onEnabledChange(Boolean(checked));
            if (checked && (!fees || fees.length === 0)) onChange([{ ...EMPTY_FEE }]);
          }}
        />
        Add charge / fee
      </label>

      {enabled && (
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[1fr_90px_90px_32px] gap-2 text-[11px] font-medium text-muted-foreground px-0.5">
            <span>Fee name</span>
            <span>Percent (%)</span>
            <span>Amount (৳)</span>
            <span />
          </div>

          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_32px] sm:grid-cols-[1fr_90px_90px_32px] gap-2 items-center">
              <Input
                placeholder={index === 0 ? 'e.g. Cash Out' : 'e.g. Send Money'}
                value={row.name}
                onChange={(e) => updateRow(index, 'name', e.target.value)}
                className="text-xs col-span-3 sm:col-span-1"
                aria-invalid={index === 0 && !String(row.name || '').trim() ? true : undefined}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="%"
                value={row.percent}
                onChange={(e) => updateRow(index, 'percent', e.target.value)}
                className="text-xs font-mono"
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="৳"
                value={row.fixed}
                onChange={(e) => updateRow(index, 'fixed', e.target.value)}
                className="text-xs font-mono"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(index)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                aria-label="Remove fee"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-8 gap-1.5 text-xs cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Add fee
          </Button>
        </div>
      )}
    </div>
  );
};
