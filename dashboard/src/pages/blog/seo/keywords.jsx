import { useState } from 'react';
import { KeyRound, Plus, Trophy, Trash2, TrendingUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NativeSelect, PageHeader, RowActions, SearchBox, Sparkline, StatCard, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { keywordRows } from '../data';

const positionTone = (p) => (p <= 10 ? 'green' : p <= 20 ? 'amber' : 'red');

// Rank tracker for target keywords
const SeoKeywords = () => {
  const [rows, setRows] = useState(keywordRows);
  const [query, setQuery] = useState('');
  const visible = rows.filter((r) => r.keyword.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Keywords" description="Track rankings for the terms that matter.">
        <Button variant="outline"><Upload />Import</Button>
        <Button><Plus />Add keyword</Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Tracked" value="86" icon={KeyRound} />
        <StatCard title="In top 10" value="21" icon={Trophy} note="+4 this month" noteTone="up" />
        <StatCard title="Avg. position" value="14.3" icon={TrendingUp} />
      </div>

      <Card className="!gap-0 !py-0">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <SearchBox placeholder="Search keywords…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <NativeSelect className="!w-auto"><option>All countries</option><option>Bangladesh</option></NativeSelect>
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
            {visible.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.keyword}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.page}</TableCell>
                <TableCell className="text-right"><ToneBadge tone={positionTone(r.position)}>{r.position}</ToneBadge></TableCell>
                <TableCell className={`text-right ${r.change > 0 ? 'text-emerald-500' : r.change < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {r.change > 0 ? `▲ ${r.change}` : r.change < 0 ? `▼ ${Math.abs(r.change)}` : '—'}
                </TableCell>
                <TableCell className="text-right">{r.volume.toLocaleString()}</TableCell>
                <TableCell><Sparkline points={r.trend} /></TableCell>
                <TableCell>
                  <RowActions>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" title="Stop tracking" onClick={() => setRows(rows.filter((x) => x.id !== r.id))}><Trash2 /></Button>
                  </RowActions>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default SeoKeywords;
