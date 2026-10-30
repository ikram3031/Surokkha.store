import { useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, Field, NativeSelect, PageHeader, RowActions, SearchBox } from '@/components/dashboard/blog/blog-ui';
import { useBlogCategories, useDeleteCategory, useSaveCategory } from '@/hooks/use-blog';
import { slugify } from '@/lib/blog-seo';

const EMPTY = { id: '', name: '', slug: '', parent: '', description: '', seoTitle: '' };

// Category list with an add/edit form
const BlogCategories = () => {
  const { data, isLoading } = useBlogCategories();
  const save = useSaveCategory();
  const remove = useDeleteCategory();
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const categories = data?.data || [];
  const editing = Boolean(form.id);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const reset = () => {
    setForm(EMPTY);
    setSlugTouched(false);
  };

  const onName = (value) => setForm((f) => ({ ...f, name: value, slug: slugTouched || editing ? f.slug : slugify(value) }));
  const edit = (category) => {
    setForm({ id: category.id, name: category.name, slug: category.slug, parent: category.parent || '', description: category.description || '', seoTitle: category.seoTitle || '' });
    setSlugTouched(true);
  };
  const submit = () => save.mutate(form, { onSuccess: reset });

  const nameOf = (id) => categories.find((c) => c.id === id)?.name;
  const visible = categories.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Organise posts into topics." />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="self-start">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editing ? 'Edit Category' : 'Add Category'}</CardTitle>
            {editing && <Button variant="ghost" size="sm" onClick={reset}><X />Cancel</Button>}
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Name"><Input placeholder="e.g. Care Tips" value={form.name} onChange={(e) => onName(e.target.value)} /></Field>
            <Field label="Slug"><Input className="font-mono text-xs" placeholder="care-tips" value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Parent">
              <NativeSelect value={form.parent} onChange={(e) => set('parent', e.target.value)}>
                <option value="">None</option>
                {categories.filter((c) => !c.parent && c.id !== form.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="SEO title"><Input value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} /></Field>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={submit} disabled={!form.name.trim() || save.isPending}>
              {editing ? <Save /> : <Plus />}{editing ? 'Save Category' : 'Add Category'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="!gap-0 !py-0">
          <div className="flex items-center gap-2 border-b p-3">
            <SearchBox placeholder="Search categories…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Parent</TableHead><TableHead className="text-right">Posts</TableHead><TableHead className="w-24" /></TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="text-muted-foreground">{nameOf(c.parent) || '—'}</TableCell>
                  <TableCell className="text-right">{c.postCount}</TableCell>
                  <TableCell>
                    <RowActions>
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => edit(c)}><Pencil /></Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive" title="Delete" onClick={() => setToDelete(c)}><Trash2 /></Button>
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {isLoading && <EmptyState>Loading categories…</EmptyState>}
          {!isLoading && visible.length === 0 && <EmptyState>{query ? 'No categories match your search.' : 'No categories yet. Add your first one.'}</EmptyState>}
        </Card>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete "${toDelete?.name || ''}"?`}
        description="Posts in this category stay published but lose this category. Child categories become top-level."
        isDeleting={remove.isPending}
        onConfirm={() => remove.mutateAsync(toDelete.id)}
      />
    </div>
  );
};

export default BlogCategories;
