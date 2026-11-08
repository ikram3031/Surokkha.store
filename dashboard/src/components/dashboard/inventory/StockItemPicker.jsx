import { useStockItems } from '@/hooks/use-stock-items';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default StockItemPicker;
