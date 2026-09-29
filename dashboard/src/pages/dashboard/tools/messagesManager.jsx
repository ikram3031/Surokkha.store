import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import {
  Mail,
  MailOpen,
  Send,
  Star,
  Trash2,
  Inbox,
  Clock,
  User,
  Phone,
  Search,
  RefreshCw,
  CornerDownRight,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Copy,
  Plus,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/utils/dateHelper';

// Calculates relative time strings
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
};



// Encapsulated Email HTML Preview with Auto-Height and Zero CSS Leaks
const EmailHtmlPreview = ({ html }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const adjustHeight = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          const body = doc.body;
          const htmlEl = doc.documentElement;
          const scrollHeight = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            htmlEl.clientHeight,
            htmlEl.scrollHeight,
            htmlEl.offsetHeight
          );
          iframe.style.height = `${Math.max(scrollHeight + 20, 200)}px`;
        }
      } catch (e) {
        // safe fallback
      }
    };

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.head) {
          const style = doc.createElement('style');
          style.textContent = `
            html, body {
              margin: 0;
              padding: 16px;
              box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              word-break: break-word;
            }
            img { max-width: 100% !important; height: auto !important; }
            table { max-width: 100% !important; width: 100% !important; table-layout: auto !important; }
            a { color: #800020; }
          `;
          doc.head.appendChild(style);
        }
        adjustHeight();
        setTimeout(adjustHeight, 150);
        setTimeout(adjustHeight, 500);
      } catch (err) {
        // ignore
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [html]);

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-white shadow-xs">
      <iframe
        ref={iframeRef}
        srcDoc={html}
        title="Email message preview"
        sandbox="allow-same-origin allow-popups"
        className="w-full min-w-full border-0 block min-h-[260px] transition-[height] duration-200"
      />
    </div>
  );
};

// Full Webmail and Messaging Management Component
const MessagesManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeFolder, setActiveFolder] = useState('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [checkedIds, setCheckedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [showCc, setShowCc] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch folder stats
  const { data: folderStatsResponse, refetch: refetchFolders } = useQuery({
    queryKey: ['webmail-folders'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/webmail/folders');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const folderList = folderStatsResponse?.data || [
    { id: 'INBOX', name: 'Inbox', unread: 0, total: 0 },
    { id: 'Starred', name: 'Starred', unread: 0, total: 0 },
    { id: 'Sent', name: 'Sent', unread: 0, total: 0 },
    { id: 'Inquiries', name: 'Website Inquiries', unread: 0, total: 0 },
    { id: 'Trash', name: 'Trash', unread: 0, total: 0 },
  ];

  // Fetch emails or contact inquiries depending on selected folder
  const isWebsiteInquiryFolder = activeFolder === 'Inquiries';

  const {
    data: messagesResponse,
    isLoading: isLoadingMessages,
    isRefetching: isRefetchingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['webmail-messages', activeFolder, searchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', '25');
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      if (isWebsiteInquiryFolder) {
        const res = await apiClient.get(`/api/v1/contact/messages?${params.toString()}`);
        return res.data;
      } else {
        params.append('folder', activeFolder);
        const res = await apiClient.get(`/api/v1/webmail/messages?${params.toString()}`);
        return res.data;
      }
    },
  });

  const messages = messagesResponse?.data || [];
  const pagination = messagesResponse?.pagination || { page: 1, total: 0, totalPages: 1 };

  // Fetch single active message details
  const { data: activeDetailResponse, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['webmail-detail', activeFolder, selectedMessageId],
    queryFn: async () => {
      if (!selectedMessageId) return null;
      if (isWebsiteInquiryFolder) {
        const res = await apiClient.get(`/api/v1/contact/messages/${selectedMessageId}`);
        queryClient.invalidateQueries({ queryKey: ['webmail-folders'] });
        queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
        return res.data;
      } else {
        const res = await apiClient.get(`/api/v1/webmail/messages/${selectedMessageId}`);
        queryClient.invalidateQueries({ queryKey: ['webmail-folders'] });
        queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
        return res.data;
      }
    },
    enabled: Boolean(selectedMessageId),
  });

  const activeMessage =
    activeDetailResponse?.data ||
    messages.find((m) => m.id === selectedMessageId || m.did === selectedMessageId) ||
    null;

  // Trigger manual IMAP mailbox sync
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/v1/webmail/sync');
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Mailbox synchronized with mail server.');
      queryClient.invalidateQueries({ queryKey: ['webmail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['webmail-folders'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
    onError: () => {
      toast.error('Sync failed. Please verify IMAP connection.');
    },
  });

  // Toggle star mutation
  const toggleStarMutation = useMutation({
    mutationFn: async ({ id, isStarred }) => {
      const res = await apiClient.patch(`/api/v1/webmail/messages/${id}/flags`, { isStarred });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webmail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['webmail-detail', activeFolder, selectedMessageId] });
      queryClient.invalidateQueries({ queryKey: ['webmail-folders'] });
    },
  });

  // Batch action mutation
  const batchActionMutation = useMutation({
    mutationFn: async ({ ids, action }) => {
      const res = await apiClient.post('/api/v1/webmail/messages/batch', { ids, action });
      return res.data;
    },
    onSuccess: () => {
      setCheckedIds([]);
      toast.success('Messages updated.');
      queryClient.invalidateQueries({ queryKey: ['webmail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['webmail-folders'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
    onError: () => {
      toast.error('Failed to execute batch action.');
    },
  });

  // Send new email from Compose modal
  const composeMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.post('/api/v1/webmail/send', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Email sent successfully to ${composeTo}!`);
      setIsComposeOpen(false);
      setComposeTo('');
      setComposeCc('');
      setComposeSubject('');
      setComposeBody('');
      queryClient.invalidateQueries({ queryKey: ['webmail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['webmail-folders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to send email. Check SMTP settings.');
    },
  });

  // Send reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ id, text }) => {
      if (isWebsiteInquiryFolder) {
        const res = await apiClient.post(`/api/v1/contact/messages/${id}/reply`, {
          message: text,
        });
        return res.data;
      } else {
        const res = await apiClient.post('/api/v1/webmail/send', {
          to: activeMessage.from?.address || activeMessage.from,
          subject: activeMessage.subject?.startsWith('Re:')
            ? activeMessage.subject
            : `Re: ${activeMessage.subject}`,
          bodyText: text,
          inReplyTo: activeMessage.messageId || activeMessage.did,
          threadId: activeMessage.threadId || activeMessage.messageId,
        });
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success('Reply sent successfully!');
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['webmail-detail', activeFolder, selectedMessageId] });
      queryClient.invalidateQueries({ queryKey: ['webmail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['webmail-folders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to send reply email.');
    },
  });

  // Handles sending direct reply
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeMessage) return;
    replyMutation.mutate({
      id: activeMessage.id || activeMessage.did,
      text: replyText.trim(),
    });
  };

  // Handles sending new composed email
  const handleSendCompose = (e) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      toast.error('Recipient email is required.');
      return;
    }
    composeMutation.mutate({
      to: composeTo.trim(),
      cc: composeCc.trim() ? composeCc.trim() : undefined,
      subject: composeSubject.trim() || '(No Subject)',
      bodyText: composeBody.trim(),
      bodyHtml: `<p>${composeBody.trim().replace(/\n/g, '<br>')}</p>`,
    });
  };

  // Handles single delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      if (isWebsiteInquiryFolder) {
        await apiClient.delete(`/api/v1/contact/messages/${deleteTargetId}`);
      } else {
        await apiClient.delete(`/api/v1/webmail/messages/${deleteTargetId}`);
      }
      toast.success('Message moved to trash.');
      if (selectedMessageId === deleteTargetId) {
        setSelectedMessageId(null);
      }
      queryClient.invalidateQueries({ queryKey: ['webmail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['webmail-folders'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    } catch {
      toast.error('Failed to delete message.');
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  // Select all or deselect all checkboxes
  const handleToggleSelectAll = () => {
    if (checkedIds.length === messages.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(messages.map((m) => m.id || m.did));
    }
  };

  // Copies text to clipboard
  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Webmail & Inquiries
            </h1>
            <p className="text-xs text-muted-foreground">
              Official store webmail client and customer communication desk.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsComposeOpen(true)}
            className="h-8.5 text-xs gap-1.5 cursor-pointer font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Compose
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="h-8.5 text-xs gap-1.5 cursor-pointer"
            title="Sync with IMAP Mail Server"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing...' : 'Sync Mailbox'}
          </Button>
        </div>
      </div>

      {/* Main Webmail 3-Pane / Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[640px] rounded-xl border border-border bg-card overflow-hidden shadow-xs w-full min-w-0 max-w-full">
        {/* Left Navigation: Folders Sidebar */}
        <div className="lg:col-span-3 xl:col-span-2 border-r border-border bg-muted/20 p-3 flex flex-col justify-between min-w-0 shrink-0">
          <div className="space-y-1">
            <Button
              onClick={() => setIsComposeOpen(true)}
              className="w-full justify-start gap-2 h-9 text-xs mb-3 font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Compose Email
            </Button>

            {folderList.map((folder) => {
              const isActive = activeFolder === folder.id;
              const IconComponent =
                folder.id === 'INBOX'
                  ? Inbox
                  : folder.id === 'Sent'
                  ? Send
                  : folder.id === 'Starred'
                  ? Star
                  : folder.id === 'Inquiries'
                  ? MessageSquare
                  : Trash2;

              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setActiveFolder(folder.id);
                    setSelectedMessageId(null);
                    setCheckedIds([]);
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <IconComponent className="h-4 w-4 shrink-0" />
                    <span>{folder.name}</span>
                  </span>

                  {folder.unread > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {folder.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mailbox Status Footer */}
          <div className="pt-4 border-t border-border/50 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">SSL IMAP / Hostinger</span>
          </div>
        </div>

        {/* Middle Pane: Email List */}
        <div
          className={`lg:col-span-4 xl:col-span-4 border-r border-border flex flex-col bg-background min-w-0 ${
            selectedMessageId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* List Search & Batch Action Bar */}
          <div className="p-3 border-b border-border bg-muted/10 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search sender, subject, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 pl-8 text-xs bg-background"
              />
            </div>

            {/* Batch Toolbar */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={messages.length > 0 && checkedIds.length === messages.length}
                  onCheckedChange={handleToggleSelectAll}
                  aria-label="Select all"
                />

                {checkedIds.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => batchActionMutation.mutate({ ids: checkedIds, action: 'markRead' })}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Mark as Read"
                    >
                      <MailOpen className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => batchActionMutation.mutate({ ids: checkedIds, action: 'markUnread' })}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Mark as Unread"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => batchActionMutation.mutate({ ids: checkedIds, action: 'trash' })}
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      title="Move to Trash"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {activeFolder}
                  </span>
                )}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span>
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 hover:text-foreground disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= pagination.totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1 hover:text-foreground disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Email Item Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-[620px]">
            {isLoadingMessages ? (
              <div className="p-3 space-y-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="p-3 space-y-2 rounded-lg bg-muted/20">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="py-20 px-4 text-center space-y-2">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-sm font-semibold text-foreground">No messages</p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? 'No matching results found.'
                    : `No emails currently in ${activeFolder}.`}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessageId === (msg.id || msg.did);
                const isUnread = isWebsiteInquiryFolder ? msg.status === 'unread' : !msg.isRead;
                const isStarred = msg.isStarred;
                const senderName = isWebsiteInquiryFolder
                  ? msg.name
                  : msg.from?.name || msg.from?.address || 'Unknown';

                return (
                  <div
                    key={msg.id || msg.did}
                    onClick={() => setSelectedMessageId(msg.id || msg.did)}
                    className={`p-3 cursor-pointer transition-colors relative flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : isUnread
                        ? 'bg-primary/[0.04] hover:bg-muted/40 font-semibold'
                        : 'hover:bg-muted/30 opacity-90'
                    }`}
                  >
                    {/* Select Checkbox */}
                    <div
                      className="pt-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        const id = msg.id || msg.did;
                        setCheckedIds((prev) =>
                          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                        );
                      }}
                    >
                      <Checkbox checked={checkedIds.includes(msg.id || msg.did)} />
                    </div>

                    {/* Star Toggle */}
                    {!isWebsiteInquiryFolder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarMutation.mutate({
                            id: msg.id || msg.did,
                            isStarred: !isStarred,
                          });
                        }}
                        className={`pt-0.5 cursor-pointer ${
                          isStarred ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-muted-foreground'
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-amber-500' : ''}`} />
                      </button>
                    )}

                    {/* Content Preview */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs truncate ${
                            isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground/80'
                          }`}
                        >
                          {senderName}
                        </span>

                        <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1 font-normal">
                          {formatTimeAgo(msg.date || msg.createdAt)}
                        </span>
                      </div>

                      <p
                        className={`text-xs truncate ${
                          isUnread ? 'font-semibold text-foreground' : 'text-foreground/75 font-normal'
                        }`}
                      >
                        {msg.subject || (isWebsiteInquiryFolder ? msg.subject || 'Website Inquiry' : '(No Subject)')}
                      </p>

                      <p className="text-[11px] text-muted-foreground truncate font-normal">
                        {msg.snippet || msg.message}
                      </p>
                    </div>

                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Reading & Conversation Thread */}
        <div
          className={`lg:col-span-5 xl:col-span-6 flex flex-col bg-background min-w-0 overflow-hidden ${
            !selectedMessageId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeMessage ? (
            <div className="flex flex-col h-full min-w-0">
              {/* Message Header Bar */}
              <div className="p-4 border-b border-border flex items-start justify-between gap-3 bg-muted/10 min-w-0">
                <div className="flex items-start gap-3 overflow-hidden min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedMessageId(null)}
                    className="lg:hidden shrink-0 h-8 w-8 -ml-1 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    {(isWebsiteInquiryFolder ? activeMessage.name : activeMessage.from?.name || activeMessage.from?.address || 'U')
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="space-y-1 overflow-hidden min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-foreground truncate">
                        {isWebsiteInquiryFolder
                          ? activeMessage.name
                          : activeMessage.from?.name || activeMessage.from?.address}
                      </h2>

                      {isWebsiteInquiryFolder ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0"
                        >
                          Website Inquiry
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {activeFolder}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono truncate max-w-full">
                        <Mail className="h-3 w-3 shrink-0" />
                        <a
                          href={`mailto:${isWebsiteInquiryFolder ? activeMessage.email : activeMessage.from?.address}`}
                          className="hover:text-primary hover:underline truncate"
                        >
                          {isWebsiteInquiryFolder ? activeMessage.email : activeMessage.from?.address}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              isWebsiteInquiryFolder ? activeMessage.email : activeMessage.from?.address,
                              'Email'
                            )
                          }
                          className="p-0.5 hover:text-foreground cursor-pointer shrink-0"
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </button>
                      </span>

                      <span className="flex items-center gap-1 text-[11px] shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(activeMessage.date || activeMessage.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isWebsiteInquiryFolder && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleStarMutation.mutate({
                          id: activeMessage.id || activeMessage.did,
                          isStarred: !activeMessage.isStarred,
                        })
                      }
                      className={`h-8 w-8 cursor-pointer ${
                        activeMessage.isStarred ? 'text-amber-500' : 'text-muted-foreground'
                      }`}
                    >
                      <Star className={`h-4 w-4 ${activeMessage.isStarred ? 'fill-amber-500' : ''}`} />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTargetId(activeMessage.id || activeMessage.did)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    title="Delete Message"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Message Subject and Body Content */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[580px] min-w-0">
                <h3 className="text-base font-bold text-foreground break-words">
                  {activeMessage.subject || (isWebsiteInquiryFolder ? activeMessage.subject || 'Website Inquiry' : '(No Subject)')}
                </h3>

                {/* Message Body Content */}
                {activeMessage.bodyHtml ? (
                  <EmailHtmlPreview html={activeMessage.bodyHtml} />
                ) : (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border text-sm leading-relaxed text-foreground shadow-xs overflow-x-auto min-w-0">
                    <p className="whitespace-pre-wrap break-words">{activeMessage.bodyText || activeMessage.message}</p>
                  </div>
                )}

                {/* Attachments list if any */}
                {activeMessage.attachments && activeMessage.attachments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" />
                      Attachments ({activeMessage.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeMessage.attachments.map((att, idx) => (
                        <div
                          key={att.did || idx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/60 border border-border text-xs"
                        >
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium truncate max-w-[150px]">{att.filename}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({Math.round((att.size || 0) / 1024)} KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Thread replies history */}
                {activeMessage.thread && activeMessage.thread.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Conversation History ({activeMessage.thread.length})
                    </p>

                    {activeMessage.thread.map((tMsg) => (
                      <div key={tMsg.id || tMsg.did} className="p-3.5 rounded-lg bg-muted/20 border border-border text-xs space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {tMsg.from?.name || tMsg.from?.address}
                          </span>
                          <span>{formatDateTime(tMsg.date)}</span>
                        </div>
                        <p className="text-foreground/90 whitespace-pre-wrap">
                          {tMsg.bodyText || tMsg.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Reply Composer Box */}
              <div className="p-4 border-t border-border bg-muted/15">
                <form onSubmit={handleSendReply} className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <CornerDownRight className="h-3.5 w-3.5 text-primary" />
                      Reply to {isWebsiteInquiryFolder ? activeMessage.name : activeMessage.from?.name || activeMessage.from?.address}
                    </span>
                    <span className="text-[11px]">Delivered via Hostinger SMTP</span>
                  </div>

                  <Textarea
                    placeholder="Type your response here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    disabled={replyMutation.isPending}
                    className="text-xs bg-background resize-none"
                  />

                  <div className="flex items-center justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!replyText.trim() || replyMutation.isPending}
                      className="gap-1.5 cursor-pointer"
                    >
                      {replyMutation.isPending ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* Empty selection placeholder */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-muted-foreground">
              <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/50 mb-1">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">No Message Selected</h3>
              <p className="text-xs max-w-sm text-muted-foreground leading-relaxed">
                Choose an email or inquiry from the list to view the full message body, attachments, and send replies.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              New Email Message
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSendCompose} className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">To:</label>
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    + Add CC
                  </button>
                )}
              </div>
              <Input
                type="email"
                required
                placeholder="recipient@example.com"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="text-xs"
              />
            </div>

            {showCc && (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">CC:</label>
                <Input
                  type="email"
                  placeholder="cc@example.com"
                  value={composeCc}
                  onChange={(e) => setComposeCc(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Subject:</label>
              <Input
                placeholder="Subject line"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Message:</label>
              <Textarea
                placeholder="Type your email body..."
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                rows={7}
                className="text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Sent from official Hostinger SMTP
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsComposeOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={composeMutation.isPending}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {composeMutation.isPending ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Move to Trash"
        description="Are you sure you want to move this message to Trash?"
      />
    </div>
  );
};

export default MessagesManager;

