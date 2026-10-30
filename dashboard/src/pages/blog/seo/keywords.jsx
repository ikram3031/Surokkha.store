import { useState } from 'react';
import { KeyRound, Plus, Trash2, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, Field, PageHeader, RowActions, SearchBox, Sparkline, StatCard, ToneBadge, useDebounced } from '@/components/dashboard/blog/blog-ui';
import { useCreateKeyword, useDeleteKeyword, useSeoKeywords, useUpdateKeyword } from '@/hooks/use-blog';

const EMPTY = { keyword: '', page: '', position: '', volume: '' };
const positionTone = (p) => (!p ? 'gray' : p <= 10 ? 'green' : p <= 20 ? 'amber' : 'red');

// Rank tracker for target keywords, positions are entered by hand
const SeoKeywords = () => {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(EMPTY);
  const q = useDebounced(query);
  const { data, isLoading } = useSeoKeywords({ q });
  const create = useCreateKeyword();
  const update = useUpdateKeyword();
  const remove = useDeleteKeyword();

  const rows = data?.data || [];
  const stats = data?.meta || {};
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const add = () => create.mutate(form, { onSuccess: () => setForm(EMPTY) });
  const savePosition = (row, value) => {
    if (value === '' || Number(value) === row.position) return;
    update.mutate({ id: row.id, position: Number(value) });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Keywords" description="Track rankings for the terms that matter. Update positions as you check them." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Tracked" value={stats.tracked ?? 0} icon={KeyRound} />
        <StatCard title="In top 10" value={stats.top10 ?? 0} icon={Trophy} />
        <StatCard title="Avg. position" value={stats.avgPosition || '—'} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader><CardTitle>Add keyword</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.4fr_1.4fr_110px_110px_auto] md:items-end">
          <Field label="Keyword"><Input placeholder="e.g. best attar in bangladesh" value={form.keyword} onChange={(e) => set('keyword', e.target.value)} /></Field>
          <Field label="Target page"><Input className="font-mono text-xs" placeholder="/blog/your-post" value={form.page} onChange={(e) => set('page', e.target.value)} /></Field>
          <Field label="Position"><Input type="number" min="0" value={form.position} onChange={(e) => set('position', e.target.value)} /></Field>
          <Field label="Volume"><Input type="number" min="0" value={form.volume} onChange={(e) => set('volume', e.target.value)} /></Field>
          <Button className="!h-8" onClick={add} disabled={!form.keyword.trim() || create.isPending}><Plus />Add</Button>
        </CardContent>
      </Card>

      <Card className="!gap-0 !py-0">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <SearchBox placeholder="Search keywords…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead><TableHead>Target page</TableHead>
              <TableHead className="text-right">Position</TableHead><TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">Volume</TableHead><TableHead>Trend</TableHead><TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.keyword}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.page || '—'}</TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-2">
                    <ToneBadge tone={positionTone(r.position)}>{r.position || '—'}</ToneBadge>
                    <Input key={`${r.id}-${r.position}`} type="number" min="0" defaultValue={r.position} aria-label={`Position for ${r.keyword}`} className="!h-7 !w-16 text-xs" onBlur={(e) => savePosition(r, e.target.value)} />
                  </span>
                </TableCell>
                <TableCell className={`text-right ${r.change > 0 ? 'text-emerald-500' : r.change < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {r.change > 0 ? `▲ ${r.change}` : r.change < 0 ? `▼ ${Math.abs(r.change)}` : '—'}
                </TableCell>
                <TableCell className="text-right">{r.volume ? r.volume.toLocaleString() : '—'}</TableCell>
                <TableCell>{r.trend.length > 1 ? <Sparkline points={r.trend} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell><RowActions><Button variant="ghost" size="icon" className="hover:text-destructive" title="Stop tracking" onClick={() => remove.mutate(r.id)}><Trash2 /></Button></RowActions></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {isLoading && <EmptyState>Loading keywords…</EmptyState>}
        {!isLoading && rows.length === 0 && <EmptyState>{query ? 'No keywords match your search.' : 'No keywords tracked yet. Add your first one above.'}</EmptyState>}
      </Card>
    </div>
  );
};

export default SeoKeywords;
