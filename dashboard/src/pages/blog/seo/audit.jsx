import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, CircleX, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, IconTile, NativeSelect, PageHeader, RowActions, ScoreBadge, SearchBox, ToneBadge, useDebounced } from '@/components/dashboard/blog/blog-ui';
import { useSeoAudit } from '@/hooks/use-blog';
import { timeAgo } from '@/lib/blog-seo';

// Post-by-post SEO audit with severity and URL filters
const SeoAudit = () => {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('');
  const q = useDebounced(query);
  const { data, isLoading, isFetching, refetch } = useSeoAudit({ q, severity });

  const rows = data?.data || [];
  const meta = data?.meta || {};
  const summary = [
    { label: 'Errors', value: meta.errors ?? 0, icon: CircleX, tile: 'bg-destructive/10 text-destructive' },
    { label: 'Warnings', value: meta.warnings ?? 0, icon: TriangleAlert, tile: 'bg-amber-500/10 text-amber-500' },
    { label: 'Checks passed', value: meta.passed ?? 0, icon: CircleCheck, tile: 'bg-emerald-500/10 text-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Site Audit" description={meta.crawledAt ? `Last run ${timeAgo(meta.crawledAt)} · ${meta.pages} posts checked` : 'Checks every post against the SEO rules.'}>
        <Button onClick={() => refetch()} disabled={isFetching}><RefreshCw className={isFetching ? 'animate-spin' : ''} />Re-run audit</Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3">
              <IconTile icon={s.icon} className={s.tile} />
              <div><p className="text-2xl font-bold leading-none">{s.value}</p><p className="mt-1 text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="!gap-0 !py-0">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <SearchBox placeholder="Filter by URL or title…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <NativeSelect className="!w-auto" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All severities</option><option value="error">Errors</option><option value="warning">Warnings</option>
          </NativeSelect>
        </div>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Page</TableHead><TableHead>Issue</TableHead><TableHead>Severity</TableHead><TableHead className="text-right">Post score</TableHead><TableHead className="w-24" /></TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><p className="font-medium">{r.title}</p><p className="font-mono text-xs text-muted-foreground">{r.url}</p></TableCell>
                <TableCell>{r.issue}</TableCell>
                <TableCell><ToneBadge tone={r.severity === 'error' ? 'red' : 'amber'} className="capitalize">{r.severity}</ToneBadge></TableCell>
                <TableCell className="text-right"><ScoreBadge score={r.score} /></TableCell>
                <TableCell><RowActions><Link to={`/blog/posts/${r.postId}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Fix</Link></RowActions></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {isLoading && <EmptyState>Running audit…</EmptyState>}
        {!isLoading && rows.length === 0 && <EmptyState>{query || severity ? 'No issues match your filters.' : 'No issues found. Every post passes the checks.'}</EmptyState>}
      </Card>
    </div>
  );
};

export default SeoAudit;
