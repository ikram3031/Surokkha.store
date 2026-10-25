import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { formatDate } from '@/utils/dateHelper';

const LIMIT = 6;

// Calculates relative time strings
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diffMins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays < 7 ? `${diffDays}d ago` : formatDate(dateStr);
};

// Latest inbox emails on the overview, linking to the webmail page
export const RecentMailsCard = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['webmail-messages-recent'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/webmail/messages', { params: { folder: 'INBOX', page: 1, limit: LIMIT } });
      return res.data?.data || [];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
  });
  const mails = (data || []).slice(0, LIMIT);

  return (
    <Card className="col-span-1 min-w-0 flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="space-y-1">
          <CardTitle>{t('overview.recent_mails', 'Recent Mails')}</CardTitle>
          <CardDescription>{t('overview.recent_mails_desc', 'Latest emails in your inbox.')}</CardDescription>
        </div>
        <Link to="/dashboard/tools/messages" className="shrink-0 text-xs font-medium text-primary hover:underline">
          {t('common.view_all', 'View all')}
        </Link>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {isLoading ? (
          Array.from({ length: LIMIT }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
        ) : mails.length > 0 ? (
          mails.map((mail) => {
            const sender = mail.from?.name || mail.from?.address || 'Unknown';
            return (
              <Link
                key={mail.id || mail.did}
                to="/dashboard/tools/messages"
                className="flex items-start gap-2.5 rounded-md hover:bg-muted/40"
              >
                <span className="mt-1.5 flex h-2 w-2 shrink-0">
                  {!mail.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${mail.isRead ? 'font-medium' : 'font-bold'}`}>{sender}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{formatTimeAgo(mail.date || mail.createdAt)}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{mail.subject || '(No Subject)'}</p>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Mail className="h-6 w-6 opacity-50" />
            {t('overview.no_recent_mails', 'No emails found.')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentMailsCard;
