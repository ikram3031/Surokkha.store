import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Loader2, Store, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';

// "Pickup Requested" / "pickup-requested" -> "pickup_requested"
const slugOf = (courier) =>
  String(courier?.orderStatusSlug || courier?.orderStatus || 'pending')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^order_/, '');

// Statuses before the rider has the parcel; Pathao still checks on its side when we ask
const PRE_PICKUP = new Set([
  'pending',
  'created',
  'order_created',
  'pickup_requested',
  'assigned_for_pickup',
  'pickup_failed',
  'pickup_on_hold',
  'on_hold',
  'pickup_cancelled',
  'pickup_cancel',
]);

// True while a Pathao parcel can still be cancelled from the dashboard
export const isPathaoCancellable = (courier) =>
  Boolean(courier?.consignmentId) && (courier?.provider || 'pathao') === 'pathao' && PRE_PICKUP.has(slugOf(courier));

// Pathao already cancelled it (e.g. from its own panel); our button then only frees the order
export const isPathaoPickupCancelled = (courier) => /pickup_cancel/.test(slugOf(courier));

// Read-only pickup store taken from Settings → Pathao Courier; no picker anywhere else
export function PathaoPickupStore({ config, className = '' }) {
  if (config && !config.storeId) {
    return (
      <div className={`flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 ${className}`}>
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          No default pickup store is set.{' '}
          <Link to="/settings/pathao-courier" className="underline font-semibold">Choose it in Pathao settings</Link>.
        </span>
      </div>
    );
  }
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-md border px-3 h-9 text-sm ${className}`} title={config?.storeId ? `Pathao store #${config.storeId} · change it in Pathao settings` : undefined}>
      <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="shrink-0 text-muted-foreground">Pickup:</span>
      <span className="truncate font-medium">{config?.storeName || (config ? `Store #${config.storeId}` : 'Loading…')}</span>
    </div>
  );
}

// Cancel-before-pickup button with its confirm dialog; hidden once the parcel is picked up
export function CancelPathaoParcelButton({ order, onDone, size = 'sm', className = '' }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const courier = order?.courier || {};
  if (!isPathaoCancellable(courier)) return null;
  const alreadyCancelled = isPathaoPickupCancelled(courier);

  // Asks Pathao to cancel, then refreshes everything that shows this order
  const confirm = async () => {
    setBusy(true);
    try {
      const res = await apiClient.post(`/api/v1/courier/pathao/orders/${encodeURIComponent(courier.consignmentId)}/cancel`);
      toast.success(res.data?.message || 'Pathao parcel cancelled');
      setOpen(false);
      ['orders', 'order', 'pathao-parcels', 'pathao-summary', 'pathao-undispatched'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      onDone?.(res.data?.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not cancel the Pathao parcel'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button type="button" variant="outline" size={size} onClick={() => setOpen(true)} className={`cursor-pointer gap-1.5 text-red-600 hover:text-red-700 dark:text-red-400 ${className}`}>
        <Ban className="h-3.5 w-3.5" /> {alreadyCancelled ? 'Clear cancelled parcel' : 'Cancel pickup'}
      </Button>
      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{alreadyCancelled ? 'Clear the cancelled parcel?' : 'Cancel this Pathao parcel?'}</DialogTitle>
            <DialogDescription>
              Consignment <span className="font-mono">{courier.consignmentId}</span>
              {order?.orderNumber ? <> for order #{order.orderNumber}</> : null}.{' '}
              {alreadyCancelled
                ? 'Pathao already cancelled it. The order goes back to Processing so it can be sent again.'
                : 'Pathao only allows this before the rider picks it up. The order goes back to Processing and its Pathao charge bill is removed.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="cursor-pointer" disabled={busy} onClick={() => setOpen(false)}>Keep it</Button>
            <Button type="button" variant="destructive" className="cursor-pointer" disabled={busy} onClick={confirm}>
              {busy && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {alreadyCancelled ? 'Clear parcel' : 'Cancel pickup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
