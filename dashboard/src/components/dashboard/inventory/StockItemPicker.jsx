import { useStockItems } from '@/hooks/use-stock-items';
import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// API/form extra links -> [{ stockItem: id, stockQty }], rows without an inventory item dropped
export const toExtraStockForm = (list) =>
  (Array.isArray(list) ? list : [])
    .map((l) => {
      const s = l?.stockItem;
      return { stockItem: s ? String(s._id || s.id || s) : null, stockQty: Math.max(1, Math.round(Number(l?.stockQty) || 1)) };
    })
    .filter((l) => l.stockItem);

const NONE = 'none';

// Picks the inventory piece a product/variant sells; "No link" means no stock is tracked for it
export const StockItemPicker = ({ value, onChange, className = 'w-full', disabled = false, noneLabel = 'No inventory link' }) => {
  const { data } = useStockItems({ status: 'active' });
  const items = data?.data || [];
  const options = [
    { value: NONE, label: noneLabel },
    ...items.map((s) => ({ value: s.id, label: `${s.shortName}${s.name ? ` · ${s.name}` : ''} (${Number(s.quantity || 0)} ${s.unit || 'pcs'})` })),
  ];
  // Keep showing a linked item even if it was made inactive
  if (value && !items.some((s) => s.id === value)) options.push({ value, label: 'Linked item (inactive)' });

  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? null : v, items.find((s) => s.id === v) || null)} items={options} disabled={disabled}>
      <SelectTrigger className={className}><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
};

// How many pieces of the linked inventory item one sale takes; pack buttons fill it in (1 Packet = 10)
export const StockQtyInput = ({ stockItemId, value, onChange, onCommit, disabled = false }) => {
  const { data } = useStockItems({ status: 'active' });
  const piece = (data?.data || []).find((s) => s.id === stockItemId);
  const packs = (piece?.packs || []).filter((p) => p.unitsPerPack > 1);
  const unit = piece?.unit || 'pcs';
  const [text, setText] = useState(String(value || 1));
  useEffect(() => setText(String(value || 1)), [value]);
  const commit = (v) => {
    const n = Math.max(1, Math.round(Number(v) || 1));
    setText(String(n));
    if (n !== Number(value || 1)) {
      onChange?.(n);
      onCommit?.(n);
    }
  };
  if (!stockItemId) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Each sale takes</span>
      <Input
        type="number"
        min={1}
        step={1}
        className="h-8 w-20"
        value={text}
        disabled={disabled}
        onChange={(e) => { setText(e.target.value); if (!onCommit && Number(e.target.value) >= 1) onChange?.(Math.round(Number(e.target.value))); }}
        onBlur={(e) => commit(e.target.value)}
      />
      <span className="text-xs text-muted-foreground">{unit}</span>
      {packs.map((p) => (
        <button
          key={p.label}
          type="button"
          disabled={disabled}
          onClick={() => commit(p.unitsPerPack)}
          className={`cursor-pointer rounded-full border px-2 py-0.5 text-[11px] ${Number(value) === p.unitsPerPack ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          1 {p.label} = {p.unitsPerPack}
        </button>
      ))}
    </div>
  );
};

// More inventory pieces one sale also takes, under the main link; the green + adds another row.
// qtyOnCommit: report piece counts only when the input is left (for pages that save on every change).
export const ExtraStockRows = ({ value = [], onChange, disabled = false, qtyOnCommit = false, pickerClassName = 'h-9 w-full bg-background sm:w-96' }) => {
  const rows = Array.isArray(value) ? value : [];
  const setRow = (i, patch) => onChange?.(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i) => onChange?.(rows.filter((_, idx) => idx !== i));
  const addRow = () => onChange?.([...rows, { stockItem: null, stockQty: 1 }]);

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="space-y-1.5 rounded-lg border border-dashed border-border p-2">
          <div className="flex items-center gap-2">
            <StockItemPicker
              className={pickerClassName}
              value={r.stockItem || null}
              noneLabel="Select inventory item"
              disabled={disabled}
              onChange={(id) => setRow(i, { stockItem: id })}
            />
            <button
              type="button"
              aria-label="Remove inventory item"
              title="Remove"
              disabled={disabled}
              onClick={() => removeRow(i)}
              className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <StockQtyInput
            stockItemId={r.stockItem || null}
            value={r.stockQty || 1}
            disabled={disabled}
            {...(qtyOnCommit ? { onCommit: (n) => setRow(i, { stockQty: n }) } : { onChange: (n) => setRow(i, { stockQty: n }) })}
          />
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={addRow}
        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" /> Add inventory item
      </button>
    </div>
  );
};

export default StockItemPicker;
