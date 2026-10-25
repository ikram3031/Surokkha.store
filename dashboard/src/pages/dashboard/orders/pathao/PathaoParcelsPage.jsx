import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PathaoHeader from './PathaoHeader';
import ParcelsTab from './ParcelsTab';

// Every Pathao consignment, filterable by the panel's delivery buckets and settlement state
export default function PathaoParcelsPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState({ from: '', to: '' });

  return (
    <div className="page-container flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PathaoHeader
        title={t('nav.pathao_parcels', 'Pathao Parcels')}
        description="Parcel status, courier charges and payouts."
        range={range}
        onRangeChange={setRange}
      />
      <ParcelsTab range={range} />
    </div>
  );
}
