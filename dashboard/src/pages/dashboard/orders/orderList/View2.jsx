import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Download, Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { SendOrderInvoiceModal } from '@/components/dashboard/orders/SendOrderInvoiceModal';
import { cn } from '@/lib/utils';
import { BulkActionDialogs } from './BulkActionDialogs';
import { LIGHT_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from './constants';
import { OrdersPagination } from './view2/OrdersPagination';
import { OrdersTableV2 } from './view2/OrdersTableV2';
import { OrderQuickView } from './view2/OrderQuickView';
import { PathaoSyncPill } from './view2/PathaoSyncPill';
import { StatCards } from './view2/StatCards';
import { Toolbar } from './view2/Toolbar';

// View 2 — card-style layout with quick view sheet, fixed-width table and compact pagination.
// Mobile: title + New order on one row, no Pathao bar / stats / Export, filters in a 2-column grid.
// All state and actions come from useOrderList via `list`.
const View2 = ({ list }) => {
  const { t } = useTranslation();
  const { newOrderAction, exporter, pathao, stats, data, pagination, orderActions } = list;

  return (
    <div className="flex-1 space-y-5 p-4 pt-6 md:p-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('nav.orders', 'Orders')}</h2>
          <div className="flex gap-2">
            {newOrderAction && (
              <Button
                nativeButton={false}
                render={<Link to={newOrderAction.to} />}
                className={cn('h-9 gap-2 px-3 text-sm sm:px-4', PRIMARY_BUTTON_CLASS)}
              >
                <PlusCircle className="size-4" />
                {t(newOrderAction.labelKey, newOrderAction.label)}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={exporter.run}
              disabled={exporter.isExporting}
              className={cn('hidden h-9 gap-2 px-4 text-sm sm:inline-flex', LIGHT_BUTTON_CLASS)}
            >
              {exporter.isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {t('common.export', 'Export')}
            </Button>
          </div>
        </div>
        <PathaoSyncPill pathao={pathao} className="hidden sm:inline-flex" />
      </div>

      <StatCards stats={stats} />

      <Toolbar list={list} />

      <div className="overflow-hidden rounded-lg border bg-card">
        <OrdersTableV2 list={list} />
      </div>

      <OrdersPagination pagination={pagination} shownCount={data.orders.length} />

      <OrderQuickView list={list} />

      <BulkActionDialogs list={list} />

      <ConfirmDeleteDialog
        open={!!orderActions.deleteTarget}
        onOpenChange={(open) => !open && orderActions.setDeleteTarget(null)}
        onConfirm={orderActions.confirmDelete}
        isDeleting={orderActions.isDeleting}
        title={t('common.delete', 'Delete Order')}
        description={`${t('common.confirm_delete', 'Are you sure you want to delete order')} ${orderActions.deleteTarget?.orderNumber ?? ''}?`}
      />

      <SendOrderInvoiceModal
        open={!!orderActions.invoiceTarget}
        onOpenChange={(open) => !open && orderActions.setInvoiceTarget(null)}
        order={orderActions.invoiceTarget}
      />
    </div>
  );
};

export default View2;
