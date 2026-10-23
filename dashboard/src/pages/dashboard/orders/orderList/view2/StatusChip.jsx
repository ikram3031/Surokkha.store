import { useTranslation } from 'react-i18next';
import { getOrderStatusMeta, getPaymentStatusMeta, statusChipClass } from '../constants';

// Fixed-size status chip (same width/height for every status). kind: 'order' | 'payment'
export function StatusChip({ kind = 'order', status, className }) {
  const { t } = useTranslation();
  const meta = kind === 'payment' ? getPaymentStatusMeta(status) : getOrderStatusMeta(status);
  const label = meta.labelKey ? t(meta.labelKey, meta.label) : meta.label;

  return (
    <span className={statusChipClass(meta.tone, className)} title={label}>
      <span className="truncate">{label}</span>
    </span>
  );
}

export default StatusChip;
