import { useState } from 'react';
import { Check, Reply, ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, PageHeader, TabBar, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { useBlogComments, useDeleteComment, useReplyComment, useUpdateComment } from '@/hooks/use-blog';
import { timeAgo } from '@/lib/blog-seo';

// Comment moderation queue
const BlogComments = () => {
  const [tab, setTab] = useState('pending');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const { data, isLoading } = useBlogComments({ status: tab, limit: 50 });
  const update = useUpdateComment();
  const reply = useReplyComment();
  const remove = useDeleteComment();

  const comments = data?.data || [];
  const counts = data?.meta?.counts || {};
  const tabs = [
    { value: 'pending', label: 'Pending', count: counts.pending },
    { value: 'approved', label: 'Approved', count: counts.approved },
    { value: 'spam', label: 'Spam', count: counts.spam },
  ];

  const sendReply = () =>
    reply.mutate(
      { id: replyTo, body: replyText },
      {
        onSuccess: () => {
          setReplyTo(null);
          setReplyText('');
        },
      }
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Comments" description="Moderate reader discussions." />

      <Card className="!gap-0 !py-0">
        <TabBar tabs={tabs} value={tab} onChange={setTab} />
        <div className="divide-y">
          {comments.map((c) => (
            <div key={c.id} className="space-y-3 p-4">
              <div className="flex flex-wrap gap-3 sm:flex-nowrap">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">{c.authorName.charAt(0).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-sm">
                    <b>{c.authorName}</b>
                    {c.isStaff && <ToneBadge tone="gold">Staff</ToneBadge>}
                    {c.status === 'spam' && <ToneBadge tone="red">Spam</ToneBadge>}
                    <span className="text-xs text-muted-foreground">{[c.authorEmail, timeAgo(c.createdAt)].filter(Boolean).join(' · ')}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">{c.body}</p>
                  {c.postTitle && <p className="mt-1 text-xs text-muted-foreground">On: <span className="text-primary">{c.postTitle}</span></p>}
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  {c.status !== 'approved' && <Button variant="outline" onClick={() => update.mutate({ id: c.id, status: 'approved' })} disabled={update.isPending}><Check />Approve</Button>}
                  {c.status !== 'spam' && <Button variant="outline" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}><Reply />Reply</Button>}
                  {c.status === 'pending' && <Button variant="destructive" onClick={() => update.mutate({ id: c.id, status: 'spam' })} disabled={update.isPending}><ShieldAlert />Spam</Button>}
                  <Button variant="cancel" size="icon" title="Delete" onClick={() => remove.mutate(c.id)} disabled={remove.isPending}><Trash2 /></Button>
                </div>
              </div>
              {replyTo === c.id && (
                <div className="ml-12 space-y-2">
                  <Textarea rows={3} placeholder="Write a reply…" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                  <div className="flex gap-2">
                    <Button onClick={sendReply} disabled={!replyText.trim() || reply.isPending}>Post reply</Button>
                    <Button variant="ghost" onClick={() => setReplyTo(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && <EmptyState>Loading comments…</EmptyState>}
          {!isLoading && comments.length === 0 && <EmptyState>Nothing in this queue.</EmptyState>}
        </div>
      </Card>
    </div>
  );
};

export default BlogComments;
