import { useState } from 'react';
import { Loader2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Hand changes that can be undone; purchase changes are corrected from the purchase in Plexivia
export const UNDOABLE_TYPES = ['manual_add', 'manual_remove', 'manual_set'];
export const canUndo = (m) => UNDOABLE_TYPES.includes(m?.type) && !m?.undoneAt;

// Pack sizes bigger than one unit, biggest first (Carton 200, Packet 10)
const bigPacks = (packs = []) => [...packs].filter((p) => Number(p.unitsPerPack) > 1).sort((a, b) => b.unitsPerPack - a.unitsPerPack);

// Splits a unit count into whole packs (biggest first) and loose units: 234 → Carton 1, Packet 3, loose 4
export const splitIntoPacks = (quantity, packs = []) => {
  const parts = {};
  let left = Math.max(0, Math.round(Number(quantity) || 0));
  bigPacks(packs).forEach((p) => {
    parts[p.label] = Math.floor(left / p.unitsPerPack);
    left -= parts[p.label] * p.unitsPerPack;
  });
  return { parts, loose: Number(quantity) < 0 ? Math.round(Number(quantity)) : left };
};

const partsTotal = (parts, loose, packs) => bigPacks(packs).reduce((s, p) => s + (Number(parts[p.label]) || 0) * p.unitsPerPack, 0) + (Number(loose) || 0);

// Count typed as packets plus loose units; onChange gets the total in units
export function PackCountInput({ initial = 0, packs = [], unit = 'pcs', onChange, allowNegative = false }) {
  const [state, setState] = useState(() => splitIntoPacks(initial, packs));
  const update = (next) => {
    setState(next);
    onChange?.(partsTotal(next.parts, next.loose, packs));
  };
  const total = partsTotal(state.parts, state.loose, packs);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {bigPacks(packs).map((p) => (
          <label key={p.label} className="flex items-center gap-1.5 text-sm">
            <Input
              type="number"
              min={0}
              step={1}
              className="w-20"
              value={state.parts[p.label] ?? 0}
              onChange={(e) => update({ ...state, parts: { ...state.parts, [p.label]: e.target.value === '' ? '' : Math.max(0, Math.round(Number(e.target.value) || 0)) } })}
            />
            <span className="text-muted-foreground">{p.label} <span className="text-xs">({p.unitsPerPack})</span></span>
            <span className="text-muted-foreground">+</span>
          </label>
        ))}
        <label className="flex items-center gap-1.5 text-sm">
          <Input
            type="number"
            min={allowNegative ? undefined : 0}
            step={1}
            className="w-20"
            value={state.loose}
            onChange={(e) => update({ ...state, loose: e.target.value === '' ? '' : Math.round(Number(e.target.value) || 0) })}
          />
          <span className="text-muted-foreground">{unit}</span>
        </label>
      </div>
      {bigPacks(packs).length > 0 && <p className="text-xs text-muted-foreground">= {total} {unit}</p>}
    </div>
  );
}

// "+10" / "−4" with colour
export const DeltaText = ({ delta, unit }) => (
  <span className={`font-semibold ${delta < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{delta > 0 ? '+' : ''}{delta} {unit || ''}</span>
);

// Undo for one hand change, with a confirm step; onUndo returns a promise
export function UndoMovementButton({ movement, unit = 'pcs', onUndo, size = 'sm' }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!canUndo(movement)) {
    return movement?.undoneAt ? <span className="text-xs text-muted-foreground">Undone</span> : null;
  }
  // Runs the undo and closes the confirm on success
  const confirm = async () => {
    setBusy(true);
    try {
      await onUndo(movement);
      setOpen(false);
    } catch {
      // the caller already showed the error; keep the dialog open
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button type="button" size={size} variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => setOpen(true)}>
        <Undo2 className="h-3.5 w-3.5" /> Undo
      </Button>
      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Undo this change?</DialogTitle>
            <DialogDescription>
              {movement.name}: <DeltaText delta={movement.delta} unit={unit} /> on {new Date(movement.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              {movement.note ? ` (${movement.note})` : ''}. Undo moves the stock back by <DeltaText delta={-movement.delta} unit={unit} />.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Keep it</Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={confirm}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Undo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Latest hand changes of one item with Undo next to each
export function RecentHandChanges({ rows = [], unit = 'pcs', onUndo, loading }) {
  const hand = rows.filter((m) => UNDOABLE_TYPES.includes(m.type) || m.type === 'manual_undo').slice(0, 5);
  if (loading) return <p className="text-xs text-muted-foreground">Loading recent changes…</p>;
  if (!hand.length) return null;
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-semibold">Recent changes made here</p>
      <div className="min-w-0 divide-y overflow-hidden rounded-md border">
        {hand.map((m) => (
          <div key={m.id} className="flex min-w-0 items-center gap-2 px-2.5 py-1.5 text-xs" title={m.note || ''}>
            <span className="shrink-0"><DeltaText delta={m.delta} unit={unit} /></span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {new Date(m.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
              {m.note ? ` · ${m.note}` : ''}
              {m.createdBy ? ` · ${m.createdBy}` : ''}
            </span>
            {m.type === 'manual_undo' ? <span className="text-muted-foreground">Undo</span> : <UndoMovementButton movement={m} unit={unit} onUndo={onUndo} />}
          </div>
        ))}
      </div>
    </div>
  );
}
