import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, Eye, FileText, MessageSquare, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, StatCard, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { blogPosts, dailyViews, pipeline, postStatusTone, topPosts } from './data';

// Blog landing page: headline numbers, traffic and content pipeline
const BlogOverview = () => (
  <div className="space-y-6">
    <PageHeader title="Blog Overview" description="Performance of your articles at a glance.">
      <Button variant="outline"><Calendar />Last 30 days</Button>
      <Link to="/blog/posts/new" className={buttonVariants()}><Plus />New Post</Link>
    </PageHeader>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Posts" value="128" icon={FileText} note="+12 from last month" noteTone="up" />
      <StatCard title="Total Views" value="48.2K" icon={Eye} note="+18.4% from last month" noteTone="up" />
      <StatCard title="Avg. Read Time" value="3m 42s" icon={Clock} note="-0.2% from last month" noteTone="down" />
      <StatCard title="Pending Comments" value="4" icon={MessageSquare} note="Needs moderation" />
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Views by Day</CardTitle>
          <CardDescription>Blog traffic, last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-end gap-2">
            {dailyViews.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" title={`Day ${i + 1}`}>
                <div className="w-full rounded-t bg-primary/70 transition-all hover:bg-primary" style={{ height: `${v}%` }} />
                <span className="text-[10px] text-muted-foreground">{i + 1}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top Posts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {topPosts.map((post, i) => (
            <div key={post.title} className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${i < 3 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{post.title}</p>
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
        <Table>
          <TableHeader>
            <TableRow><TableHead>Post</TableHead><TableHead>Author</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Updated</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {blogPosts.slice(2, 5).map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell className="text-muted-foreground">{post.author}</TableCell>
                <TableCell><ToneBadge tone={postStatusTone[post.status]} className="capitalize">{post.status}</ToneBadge></TableCell>
                <TableCell className="text-right text-muted-foreground">{post.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader><CardTitle>Content Pipeline</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {pipeline.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${row.dot}`} />{row.label}</span>
              <b>{row.value}</b>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);

export default BlogOverview;
