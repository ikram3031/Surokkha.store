import { useState } from 'react';
import { GitMerge, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, PageHeader, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { tags as seed } from './data';

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

// Tag cloud with a quick-add form
const BlogTags = () => {
  const [items, setItems] = useState(seed);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const add = () => {
    const label = name.trim().toLowerCase();
    if (!label || items.some((t) => t.name === label)) return;
    setItems([{ name: label, count: 0 }, ...items]);
    setName('');
    setSlug('');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tags" description="Fine-grained labels for related posts.">
        <Button variant="outline"><GitMerge />Merge tags</Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="self-start">
          <CardHeader><CardTitle>Add Tag</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Name"><Input value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} /></Field>
            <Field label="Slug"><Input className="font-mono text-xs" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} /></Field>
          </CardContent>
          <CardFooter><Button className="w-full" onClick={add} disabled={!name.trim()}><Plus />Add Tag</Button></CardFooter>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Tags <span className="text-muted-foreground">({items.length})</span></CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {items.map((tag) => (
              <ToneBadge key={tag.name} tone={tag.hot ? 'gold' : 'gray'} className="!h-7 !px-3 !text-sm">
                {tag.name}<b className="ml-1 text-xs opacity-70">{tag.count}</b>
              </ToneBadge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlogTags;
