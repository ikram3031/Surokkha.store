import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, CircleX, FileText, Link2, Map, ScanSearch, TriangleAlert } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, LoadingBlocks, PageHeader, StatCard, ToneBadge, scoreTone } from '@/components/dashboard/blog/blog-ui';
import { useSeoOverview } from '@/hooks/use-blog';

// SEO landing page: health score, indexing and the most important issues
const SeoOverview = () => {
  const { data, isLoading, isError } = useSeoOverview();
  const overview = data?.data;

  if (isLoading) return <LoadingBlocks rows={3} />;
  if (isError || !overview) return <EmptyState>Could not load the SEO overview.</EmptyState>;

  const indexedShare = overview.pages ? Math.round((overview.indexedPosts / overview.pages) * 100) : 0;
  const tone = scoreTone(overview.healthScore);

  return (
    <div className="space-y-6">
      <PageHeader title="SEO Overview" description="Search health of your blog content.">
        <Link to="/blog/seo/audit" className={buttonVariants()}><ScanSearch />Run Audit</Link>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="items-center justify-center text-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${overview.healthScore}%, var(--muted) 0)` }}>
            <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-card">
              <span className="text-3xl font-extrabold leading-none">{overview.healthScore}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</span>
            </div>
          </div>
          <p className="mt-1 text-sm font-semibold">SEO Health</p>
          <ToneBadge tone={tone}>{tone === 'green' ? 'Good' : tone === 'amber' ? 'Needs work' : 'Poor'}</ToneBadge>
        </Card>
        <StatCard title="Posts Audited" value={overview.pages} icon={FileText} note="Average score across all posts" />
        <StatCard title="Live in Search" value={overview.indexedPosts} icon={Map} note={`${indexedShare}% of posts are public`} />
        <StatCard title="Broken Links (404)" value={overview.notFoundCount} icon={Link2} note={overview.notFoundCount ? 'Create redirects for these' : 'Nothing broken'} noteTone={overview.notFoundCount ? 'down' : 'up'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Search Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
              <Link2 className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">Google Search Console is not connected</p>
              <p className="max-w-sm text-xs text-muted-foreground">Clicks, impressions and average position will appear here once Search Console reporting is connected. Until then, track rankings by hand in Keywords.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Indexing</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="mb-1 flex justify-between"><span>Public posts</span><b>{overview.indexedPosts} / {overview.pages}</b></div>
              <div className="h-1.5 overflow-hidden rounded bg-muted"><div className="h-full bg-emerald-500" style={{ width: `${indexedShare}%` }} /></div>
            </div>
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><CircleCheck className="h-4 w-4 text-emerald-500" />Tracked keywords</span><b>{overview.keywordCount}</b></div>
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><CircleX className="h-4 w-4 text-destructive" />404 pages</span><b>{overview.notFoundCount}</b></div>
            <Link to="/blog/seo/sitemap" className={buttonVariants({ variant: 'outline', className: 'w-full' })}><Map />Manage sitemap</Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Issues</CardTitle>
            <Link to="/blog/seo/audit" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>View all<ArrowRight /></Link>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {overview.issues.length === 0 && <p className="text-muted-foreground">No issues found. Nice work.</p>}
            {overview.issues.map((issue) => (
              <div key={issue.issue} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {issue.severity === 'error' ? <CircleX className="h-4 w-4 text-destructive" /> : <TriangleAlert className="h-4 w-4 text-amber-500" />}
                  {issue.issue}
                </span>
                <ToneBadge tone={issue.severity === 'error' ? 'red' : 'amber'}>{issue.count} {issue.count === 1 ? 'post' : 'posts'}</ToneBadge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Keywords</CardTitle>
            <Link to="/blog/seo/keywords" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>View all<ArrowRight /></Link>
          </CardHeader>
          {overview.topKeywords.length === 0 ? (
            <EmptyState>No keywords tracked yet.</EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Keyword</TableHead><TableHead className="text-right">Position</TableHead><TableHead className="text-right">Volume</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {overview.topKeywords.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell>{k.keyword}</TableCell>
                    <TableCell className="text-right"><ToneBadge tone={k.position <= 10 ? 'green' : 'amber'}>{k.position}</ToneBadge></TableCell>
                    <TableCell className="text-right">{k.volume ? k.volume.toLocaleString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SeoOverview;
