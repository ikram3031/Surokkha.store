import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Field, NativeSelect, PageHeader, RowActions, SearchBox } from '@/components/dashboard/blog/blog-ui';
import { categories as seed } from './data';

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

// Category list with an inline add form
const BlogCategories = () => {
  const [items, setItems] = useState(seed);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', parent: '', description: '', seoTitle: '' });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const onName = (value) => setForm((f) => ({ ...f, name: value, slug: slugify(value) }));

  const add = () => {
    if (!form.name.trim()) return;
    const parent = items.find((c) => c.name === form.parent);
    setItems([...items, { id: Date.now(), name: form.name.trim(), slug: form.slug || slugify(form.name), posts: 0, depth: parent ? 1 : 0 }]);
    setForm({ name: '', slug: '', parent: '', description: '', seoTitle: '' });
  };

  const visible = items.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Organise posts into topics." />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="self-start">
          <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Name"><Input placeholder="e.g. Care Tips" value={form.name} onChange={(e) => onName(e.target.value)} /></Field>
            <Field label="Slug"><Input className="font-mono text-xs" placeholder="care-tips" value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} /></Field>
            <Field label="Parent">
              <NativeSelect value={form.parent} onChange={(e) => set('parent', e.target.value)}>
                <option value="">None</option>
                {items.filter((c) => c.depth === 0).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="SEO title"><Input value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} /></Field>
          </CardContent>
          <CardFooter><Button className="w-full" onClick={add} disabled={!form.name.trim()}><Plus />Add Category</Button></CardFooter>
        </Card>

        <Card className="!gap-0 !py-0">
          <div className="flex items-center gap-2 border-b p-3">
            <SearchBox placeholder="Search categories…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead className="text-right">Posts</TableHead><TableHead className="w-24" /></TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className={`font-medium ${c.depth ? 'pl-8' : ''}`}>{c.depth ? <span className="text-muted-foreground">— </span> : null}{c.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="text-right">{c.posts}</TableCell>
                  <TableCell>
                    <RowActions>
                      <Button variant="ghost" size="icon" title="Edit"><Pencil /></Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive" title="Delete" onClick={() => setItems(items.filter((x) => x.id !== c.id))}><Trash2 /></Button>
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default BlogCategories;
