import { useState } from 'react';
import { ArrowRightLeft, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Field, NativeSelect, PageHeader, RowActions, TabBar, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { notFoundRows, redirectRows } from '../data';

const typeTone = { 301: 'blue', 302: 'amber', 410: 'red' };

// Redirect rules and a monitor of recent 404s
const SeoRedirects = () => {
  const [rules, setRules] = useState(redirectRows);
  const [tab, setTab] = useState('redirects');
  const [form, setForm] = useState({ from: '', to: '', type: '301' });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const add = () => {
    if (!form.from.trim()) return;
    setRules((prev) => [{ id: Date.now(), from: form.from.trim(), to: form.to.trim(), type: Number(form.type), hits: 0, active: true }, ...prev]);
    setForm({ from: '', to: '', type: '301' });
    setTab('redirects');
  };

  const tabs = [
    { value: 'redirects', label: 'Redirects', count: rules.length },
    { value: '404', label: '404 Monitor', count: notFoundRows.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Redirects & 404s" description="Keep link equity when URLs change.">
        <Button variant="outline"><Upload />Import CSV</Button>
      </PageHeader>

      <Card>
        <CardHeader><CardTitle>Add redirect</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto] md:items-end">
          <Field label="From"><Input className="font-mono text-xs" placeholder="/old-url" value={form.from} onChange={(e) => set('from', e.target.value)} /></Field>
          <Field label="To"><Input className="font-mono text-xs" placeholder="/new-url" value={form.to} onChange={(e) => set('to', e.target.value)} /></Field>
          <Field label="Type">
            <NativeSelect value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="301">301 Permanent</option><option value="302">302 Temporary</option><option value="410">410 Gone</option>
            </NativeSelect>
          </Field>
          <Button className="!h-8" onClick={add} disabled={!form.from.trim()}><Plus />Add</Button>
        </CardContent>
      </Card>

      <Card className="!gap-0 !py-0">
        <TabBar tabs={tabs} value={tab} onChange={setTab} />
        {tab === 'redirects' ? (
          <Table>
            <TableHeader>
              <TableRow><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Hits</TableHead><TableHead>Status</TableHead><TableHead className="w-20" /></TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.from}</TableCell>
                  <TableCell className="font-mono text-xs">{r.to || '—'}</TableCell>
                  <TableCell><ToneBadge tone={typeTone[r.type]}>{r.type}</ToneBadge></TableCell>
                  <TableCell className="text-right">{r.hits.toLocaleString()}</TableCell>
                  <TableCell><ToneBadge tone={r.active ? 'green' : 'gray'}>{r.active ? 'Active' : 'Paused'}</ToneBadge></TableCell>
                  <TableCell>
                    <RowActions>
                      <Button variant="ghost" size="icon" title="Edit"><Pencil /></Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive" title="Delete" onClick={() => setRules(rules.filter((x) => x.id !== r.id))}><Trash2 /></Button>
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <>
            <CardHeader className="border-b py-4">
              <CardTitle>Recent 404 errors</CardTitle>
              <CardDescription>Pages visitors tried to open but could not find.</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow><TableHead>URL</TableHead><TableHead>Referrer</TableHead><TableHead className="text-right">Hits</TableHead><TableHead>Last seen</TableHead><TableHead className="w-40" /></TableRow>
              </TableHeader>
              <TableBody>
                {notFoundRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.url}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.referrer}</TableCell>
                    <TableCell className="text-right">{r.hits}</TableCell>
                    <TableCell className="text-muted-foreground">{r.last}</TableCell>
                    <TableCell>
                      <RowActions>
                        <Button variant="outline" size="sm" onClick={() => { setForm({ from: r.url, to: '', type: '301' }); setTab('redirects'); }}><ArrowRightLeft />Create redirect</Button>
                      </RowActions>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Card>
    </div>
  );
};

export default SeoRedirects;
