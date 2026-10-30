import { useState } from 'react';
import { GitMerge, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Input } from '@/components/ui/input';
import { EmptyState, Field, PageHeader, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { useBlogTags, useCreateTag, useDeleteTag, useMergeTags } from '@/hooks/use-blog';
import { slugify } from '@/lib/blog-seo';

// Tag cloud with quick add, merge and delete
const BlogTags = () => {
  const { data, isLoading } = useBlogTags();
  const create = useCreateTag();
  const remove = useDeleteTag();
  const merge = useMergeTags();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [picked, setPicked] = useState([]);
  const [target, setTarget] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const tags = data?.data || [];
  const togglePick = (tagName) => setPicked((prev) => (prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]));

  const add = () =>
    create.mutate(
      { name, slug },
      {
        onSuccess: () => {
          setName('');
          setSlug('');
          setSlugTouched(false);
        },
      }
    );

  const runMerge = () =>
    merge.mutate(
      { from: picked, into: target.trim() || picked[0] },
      {
        onSuccess: () => {
          setPicked([]);
          setTarget('');
        },
      }
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Tags" description="Fine-grained labels for related posts. Click tags to select them for merging." />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="self-start">
          <CardHeader><CardTitle>Add Tag</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Name"><Input value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} /></Field>
            <Field label="Slug"><Input className="font-mono text-xs" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} /></Field>
          </CardContent>
          <CardFooter><Button className="w-full" onClick={add} disabled={!name.trim() || create.isPending}><Plus />Add Tag</Button></CardFooter>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Tags <span className="text-muted-foreground">({tags.length})</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {picked.length >= 2 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground">Merge {picked.length} tags into</span>
                <Input className="!h-7 !w-44 text-xs" placeholder={picked[0]} value={target} onChange={(e) => setTarget(e.target.value)} />
                <Button size="sm" onClick={runMerge} disabled={merge.isPending}><GitMerge />Merge</Button>
                <Button size="sm" variant="ghost" onClick={() => setPicked([])}>Clear</Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag.id} className="inline-flex items-center gap-1">
                  <button type="button" onClick={() => togglePick(tag.name)} className="cursor-pointer">
                    <ToneBadge tone={picked.includes(tag.name) ? 'gold' : 'gray'} className={`!h-7 !px-3 !text-sm ${picked.includes(tag.name) ? 'ring-1 ring-primary' : ''}`}>
                      {tag.name}<b className="ml-1 text-xs opacity-70">{tag.count}</b>
                    </ToneBadge>
                  </button>
                  <button type="button" aria-label={`Delete ${tag.name}`} className="cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => setToDelete(tag)}><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
            {isLoading && <EmptyState>Loading tags…</EmptyState>}
            {!isLoading && tags.length === 0 && <EmptyState>No tags yet. They appear here as you tag posts.</EmptyState>}
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete tag "${toDelete?.name || ''}"?`}
        description="The tag is removed from every post that uses it."
        isDeleting={remove.isPending}
        onConfirm={() => remove.mutateAsync(toDelete.id)}
      />
    </div>
  );
};

export default BlogTags;
