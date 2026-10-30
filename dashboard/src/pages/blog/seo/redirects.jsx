import { useState } from 'react';
import { ArrowRightLeft, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, Field, NativeSelect, PageHeader, RowActions, TabBar, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { useDeleteNotFound, useDeleteRedirect, useSaveRedirect, useSeoNotFound, useSeoRedirects } from '@/hooks/use-blog';
import { timeAgo } from '@/lib/blog-seo';

const EMPTY = { id: '', from: '', to: '', type: '301' };
const TYPE_TONE = { 301: 'blue', 302: 'amber', 410: 'red' };

// Redirect rules and a monitor of recent 404s
const SeoRedirects = () => {
  const { data: redirectData, isLoading } = useSeoRedirects();
  const { data: notFoundData } = useSeoNotFound();
  const save = useSaveRedirect();
  const remove = useDeleteRedirect();
  const clearNotFound = useDeleteNotFound();
  const [tab, setTab] = useState('redirects');
  const [form, setForm] = useState(EMPTY);

  const rules = redirectData?.data || [];
  const notFound = notFoundData?.data || [];
  const editing = Boolean(form.id);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const reset = () => setForm(EMPTY);
  const submit = () => save.mutate({ ...form, id: form.id || undefined }, { onSuccess: reset });
  const edit = (rule) => {
    setForm({ id: rule.id, from: rule.from, to: rule.to, type: String(rule.type) });
    setTab('redirects');
  };
  const startFrom404 = (row) => {
    setForm({ ...EMPTY, from: row.url });
    setTab('redirects');
  };

  const tabs = [
    { value: 'redirects', label: 'Redirects', count: rules.length },
    { value: '404', label: '404 Monitor', count: notFound.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Redirects & 404s" description="Keep link equity when URLs change." />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{editing ? 'Edit redirect' : 'Add redirect'}</CardTitle>
          {(editing || form.from) && <Button variant="ghost" size="sm" onClick={reset}><X />Clear</Button>}
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto] md:items-end">
          <Field label="From"><Input className="font-mono text-xs" placeholder="/old-url" value={form.from} onChange={(e) => set('from', e.target.value)} /></Field>
          <Field label="To"><Input className="font-mono text-xs" placeholder="/new-url" disabled={form.type === '410'} value={form.to} onChange={(e) => set('to', e.target.value)} /></Field>
          <Field label="Type">
            <NativeSelect value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="301">301 Permanent</option><option value="302">302 Temporary</option><option value="410">410 Gone</option>
            </NativeSelect>
          </Field>
          <Button className="!h-8" onClick={submit} disabled={!form.from.trim() || (form.type !== '410' && !form.to.trim()) || save.isPending}>
            {editing ? <Save /> : <Plus />}{editing ? 'Save' : 'Add'}
          </Button>
        </CardContent>
      </Card>

      <Card className="!gap-0 !py-0">
        <TabBar tabs={tabs} value={tab} onChange={setTab} />
        {tab === 'redirects' ? (
          <>
            <Table>
              <TableHeader>
                <TableRow><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Hits</TableHead><TableHead>Status</TableHead><TableHead className="w-24" /></TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.from}</TableCell>
                    <TableCell className="font-mono text-xs">{r.to || '—'}</TableCell>
                    <TableCell><ToneBadge tone={TYPE_TONE[r.type]}>{r.type}</ToneBadge></TableCell>
                    <TableCell className="text-right">{r.hits.toLocaleString()}</TableCell>
                    <TableCell>
                      <button type="button" className="cursor-pointer" title="Click to toggle" onClick={() => save.mutate({ id: r.id, active: !r.active })}>
                        <ToneBadge tone={r.active ? 'green' : 'gray'}>{r.active ? 'Active' : 'Paused'}</ToneBadge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <RowActions>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => edit(r)}><Pencil /></Button>
                        <Button variant="ghost" size="icon" className="hover:text-destructive" title="Delete" onClick={() => remove.mutate(r.id)}><Trash2 /></Button>
                      </RowActions>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {isLoading && <EmptyState>Loading redirects…</EmptyState>}
            {!isLoading && rules.length === 0 && <EmptyState>No redirects yet. Renaming a published post adds one automatically.</EmptyState>}
          </>
        ) : (
          <>
            <CardHeader className="border-b py-4">
              <CardTitle>Recent 404 errors</CardTitle>
              <CardDescription>Pages visitors tried to open but could not find.</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow><TableHead>URL</TableHead><TableHead>Referrer</TableHead><TableHead className="text-right">Hits</TableHead><TableHead>Last seen</TableHead><TableHead className="w-52" /></TableRow>
              </TableHeader>
              <TableBody>
                {notFound.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.url}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.referrer || '—'}</TableCell>
                    <TableCell className="text-right">{r.hits}</TableCell>
                    <TableCell className="text-muted-foreground">{timeAgo(r.lastSeenAt)}</TableCell>
                    <TableCell>
                      <RowActions>
                        <Button variant="outline" size="sm" onClick={() => startFrom404(r)}><ArrowRightLeft />Create redirect</Button>
                        <Button variant="ghost" size="icon" title="Dismiss" onClick={() => clearNotFound.mutate(r.id)}><X /></Button>
                      </RowActions>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {notFound.length === 0 && <EmptyState>No 404 errors recorded.</EmptyState>}
          </>
        )}
      </Card>
    </div>
  );
};

export default SeoRedirects;
