import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getWebSocketUrl } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, ShoppingBag, Mail, CheckCheck, Clock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Renders the real-time notification bell and dropdown list
export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  // Real-time WebSocket connection for live notification alerts
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    let ws = null;
    let reconnectTimeout = null;

    // Connects to server websocket for real-time notifications
    const connectWs = () => {
      try {
        const wsUrl = `${getWebSocketUrl()}?token=${encodeURIComponent(token)}`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.event === 'NEW_NOTIFICATION') {
              queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
              queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
              queryClient.invalidateQueries({ queryKey: ['orders'] });
              toast.info(msg.data?.log?.description || 'New order placed!');
            } else if (msg.event === 'NOTIFICATION_READ_UPDATE') {
              queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
            }
          } catch (_) {}
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 10000);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (_) {}
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [user, queryClient]);

  // Poll notification logs with fallback
  const { data: notificationData } = useQuery({
    queryKey: ['notification-logs'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/logs/notifications');
      return res.data;
    },
    enabled: Boolean(user),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const logs = notificationData?.data || [];
  const unreadCount = notificationData?.unreadCount || 0;

  // Marks all unread notifications as read
  const handleMarkAllRead = async (e) => {
    e?.stopPropagation();
    setIsMarkingRead(true);
    try {
      await apiClient.put('/api/v1/logs/mark-read', {});
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark notifications as read.');
    } finally {
      setIsMarkingRead(false);
    }
  };

  // Handles clicking a notification item and redirects to the appropriate dashboard view
  const handleNotificationClick = async (log) => {
    if (!log.readStatus) {
      try {
        await apiClient.put('/api/v1/logs/mark-read', { ids: [log.id || log._id] });
        queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      } catch {
        // silent
      }
    }
    setIsOpen(false);
    if (log.type === 'contactMessage' || log.type === 'webmailMessage') {
      navigate('/dashboard/tools/messages');
    } else {
      navigate('/dashboard/orders');
    }
  };

  // Calculates and formats relative time string
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="relative cursor-pointer hover:bg-muted/60 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-xs animate-in zoom-in">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-80 md:w-96 p-0 shadow-lg border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground">Notifications</h4>
            {unreadCount > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {unreadCount} new
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isMarkingRead}
              className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification Items List */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-border/40 py-1">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
              <Bell className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1.5" />
              <p className="font-semibold text-foreground">No new notifications</p>
              <p className="text-[11px]">When customers place orders or send messages, they will appear here.</p>
            </div>
          ) : (
            logs.map((log) => {
              const isUnread = !log.readStatus;
              const isMail = log.type === 'contactMessage' || log.type === 'webmailMessage';

              return (
                <DropdownMenuItem
                  key={log.id || log._id}
                  onClick={() => handleNotificationClick(log)}
                  className={`p-3 flex items-start gap-3 cursor-pointer transition-colors focus:bg-muted/50 ${
                    isUnread ? 'bg-primary/[0.04]' : 'opacity-80'
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                      isUnread
                        ? isMail
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isMail ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      <ShoppingBag className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p
                      className={`text-xs leading-snug truncate ${
                        isUnread ? 'font-semibold text-foreground' : 'text-foreground/80'
                      }`}
                    >
                      {log.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTimeAgo(log.createdAt)}
                      </span>
                      {isUnread && (
                        <span className="h-1.5 w-1.5 rounded bg-primary" />
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* Footer */}
        <div className="p-2 bg-muted/10 text-center">
          <Link
            to="/dashboard/activity-logs"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1"
          >
            View all activity logs
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

