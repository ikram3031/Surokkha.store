import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Eye, FileText, MessageSquare, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, LoadingBlocks, PageHeader, StatCard, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { useBlogOverview } from '@/hooks/use-blog';
import { timeAgo } from '@/lib/blog-seo';

const STATUS_TONE = { published: 'green', scheduled: 'amber', draft: 'gray', trash: 'red' };
const PIPELINE = [
  { key: 'published', label: 'Published', dot: 'bg-emerald-500' },
  { key: 'scheduled', label: 'Scheduled', dot: 'bg-amber-500' },
  { key: 'draft', label: 'Draft', dot: 'bg-muted-foreground' },
  { key: 'trash', label: 'Trash', dot: 'bg-destructive' },
];

// Blog landing page: headline numbers, traffic and content pipeline
const BlogOverview = () => {
  const { data, isLoading, isError } = useBlogOverview();
  const overview = data?.data;

  if (isLoading) return <LoadingBlocks rows={4} />;
  if (isError || !overview) return <EmptyState>Could not load the blog overview.</EmptyState>;

  const maxViews = Math.max(1, ...overview.dailyViews.map((d) => d.count));

  return (
    <div className="space-y-6">
      <PageHeader title="Blog Overview" description="Performance of your articles at a glance.">
        <Link to="/blog/posts/new" className={buttonVariants()}><Plus />New Post</Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Posts" value={overview.counts.all.toLocaleString()} icon={FileText} note={`${overview.counts.published} published`} />
        <StatCard title="Total Views" value={overview.totalViews.toLocaleString()} icon={Eye} note="All time" />
        <StatCard title="Avg. Reading Time" value={overview.avgReadingMinutes ? `${overview.avgReadingMinutes} min` : '—'} icon={Clock} note="Per post" />
        <StatCard title="Pending Comments" value={overview.pendingComments} icon={MessageSquare} note={overview.pendingComments ? 'Needs moderation' : 'All caught up'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Views by Day</CardTitle>
            <CardDescription>Blog traffic, last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-2">
              {overview.dailyViews.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${day.day}: ${day.count} views`}>
                  <div className="w-full rounded-t bg-primary/70 transition-all hover:bg-primary" style={{ height: `${Math.max(2, (day.count / maxViews) * 100)}%` }} />
                  <span className="text-[10px] text-muted-foreground">{day.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Posts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {overview.topPosts.length === 0 && <p className="text-sm text-muted-foreground">No views recorded yet.</p>}
            {overview.topPosts.map((post, i) => (
              <div key={post.id} className="flex items-center gap-3">
                <span className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${i < 3 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <Link to={`/blog/posts/${post.id}`} className="block truncate text-sm font-medium hover:text-primary">{post.title}</Link>
                  <p className="text-xs text-muted-foreground">{post.views.toLocaleString()} views</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link to="/blog/posts" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>View all<ArrowRight /></Link>
          </CardHeader>
          {overview.recent.length === 0 ? (
            <EmptyState>No posts yet. Write your first one.</EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Post</TableHead><TableHead>Author</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Updated</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {overview.recent.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium"><Link to={`/blog/posts/${post.id}`} className="hover:text-primary">{post.title}</Link></TableCell>
                    <TableCell className="text-muted-foreground">{post.authorName || '—'}</TableCell>
                    <TableCell><ToneBadge tone={STATUS_TONE[post.status]} className="capitalize">{post.status}</ToneBadge></TableCell>
                    <TableCell className="text-right text-muted-foreground">{timeAgo(post.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Content Pipeline</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {PIPELINE.map((row) => (
              <div key={row.key} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${row.dot}`} />{row.label}</span>
                <b>{overview.counts[row.key] || 0}</b>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlogOverview;
