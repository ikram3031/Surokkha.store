import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, CircleX, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IconTile, NativeSelect, PageHeader, RowActions, ScoreBadge, SearchBox, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { auditRows } from '../data';

const SUMMARY = [
  { label: 'Errors', value: 9, icon: CircleX, tile: 'bg-destructive/10 text-destructive' },
  { label: 'Warnings', value: 76, icon: TriangleAlert, tile: 'bg-amber-500/10 text-amber-500' },
  { label: 'Passed', value: 353, icon: CircleCheck, tile: 'bg-emerald-500/10 text-emerald-500' },
];

// Crawl results with severity and page filters
const SeoAudit = () => {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('');
  const [type, setType] = useState('');

  const rows = useMemo(
    () =>
      auditRows.filter(
        (r) =>
          r.url.toLowerCase().includes(query.trim().toLowerCase()) &&
          (!severity || r.severity === severity) &&
          (!type || r.type === type)
      ),
    [query, severity, type]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Site Audit" description="Last crawl: Oct 30, 2026 · 438 pages">
        <Button><RefreshCw />Re-run audit</Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        {SUMMARY.map((s) => (
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
          <SearchBox placeholder="Filter by URL…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <NativeSelect className="!w-auto" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All severities</option><option value="error">Errors</option><option value="warning">Warnings</option>
          </NativeSelect>
          <NativeSelect className="!w-auto" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option><option>Post</option><option>Product</option><option>Page</option>
          </NativeSelect>
        </div>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Page</TableHead><TableHead>Issue</TableHead><TableHead>Severity</TableHead><TableHead className="text-right">Score</TableHead><TableHead className="w-24" /></TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><p className="font-medium">{r.url}</p><p className="text-xs text-muted-foreground">{r.type}</p></TableCell>
                <TableCell>{r.issue}</TableCell>
                <TableCell><ToneBadge tone={r.severity === 'error' ? 'red' : 'amber'} className="capitalize">{r.severity}</ToneBadge></TableCell>
                <TableCell className="text-right"><ScoreBadge score={r.score} /></TableCell>
                <TableCell>
                  <RowActions>
                    {r.editable ? (
                      <Link to="/blog/posts" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Fix</Link>
                    ) : (
                      <Button variant="outline" size="sm">Fix</Button>
                    )}
                  </RowActions>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No issues match your filters.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default SeoAudit;
