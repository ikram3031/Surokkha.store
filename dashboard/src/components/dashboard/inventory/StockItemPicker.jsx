import { useStockItems } from '@/hooks/use-stock-items';
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

export default StockItemPicker;
