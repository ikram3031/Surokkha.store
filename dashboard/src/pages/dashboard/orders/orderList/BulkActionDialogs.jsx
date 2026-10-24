import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// Confirmation dialogs for bulk status / payment change and bulk delete. Used by both views.
export function BulkActionDialogs({ list }) {
  const { t } = useTranslation();
  const { bulk, selection } = list;
  const count = selection.ids.length;

  return (
    <>
      <Dialog open={!!bulk.statusTarget} onOpenChange={(open) => !open && bulk.closeStatus()}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{t('orders.change_status', 'Confirm Order Status Change')}</DialogTitle>
            <DialogDescription>
              {t('orders.change_status_desc', `Are you sure you want to update the Order Status of ${count} selected orders to "${bulk.statusTarget}"?`)}
            </DialogDescription>
          </DialogHeader>
          {bulk.statusTarget === 'Return' && (
            <div className="py-4">
              <label className="text-sm font-medium mb-1 block">Return Fee</label>
              <Input
                type="number"
                value={bulk.returnFee}
                onChange={(e) => bulk.setReturnFee(e.target.value)}
                placeholder="Enter return fee"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="cancel" onClick={bulk.closeStatus} disabled={bulk.isUpdating}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={bulk.confirmStatus}
              disabled={bulk.isUpdating}
            >
              {bulk.isUpdating ? t('common.updating', 'Updating...') : t('common.confirm', 'Yes, Change Status')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!bulk.paymentTarget} onOpenChange={(open) => !open && bulk.setPaymentTarget(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{t('orders.change_status', 'Confirm Payment Status Change')}</DialogTitle>
            <DialogDescription>
              {t('orders.change_status_desc', `Are you sure you want to update the Payment Status of ${count} selected orders to "${bulk.paymentTarget}"?`)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="cancel" onClick={() => bulk.setPaymentTarget(null)} disabled={bulk.isUpdating}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={bulk.confirmPayment}
              disabled={bulk.isUpdating}
            >
              {bulk.isUpdating ? t('common.updating', 'Updating...') : t('common.confirm', 'Yes, Change Status')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={bulk.deleteOpen}
        onOpenChange={bulk.setDeleteOpen}
        onConfirm={bulk.confirmDelete}
        isDeleting={bulk.isDeleting}
        title={t('common.delete', 'Delete Selected Orders')}
        description={`${t('common.confirm_delete_desc', 'Are you sure you want to permanently delete the selected orders?')} (${count})`}
      />
    </>
  );
}

export default BulkActionDialogs;
