import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import NotFound from '@/components/NotFound';
import PathaoHeader from './PathaoHeader';
import WebhookEventsTab from './WebhookEventsTab';

// Raw Pathao webhook deliveries (Owner/Admin only, like the webhook API)
export default function PathaoWebhookPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  if (role !== 'owner' && role !== 'admin') return <NotFound />;

  return (
    <div className="page-container flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PathaoHeader title={t('nav.pathao_webhook', 'Pathao Webhook')} description="Events Pathao has pushed to the store." />
      <WebhookEventsTab />
    </div>
  );
}
