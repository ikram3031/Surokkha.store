import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NativeSelect, PageHeader, RowActions, ScoreBadge, SearchBox, TabBar, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { blogPosts, categories, postStatusTone } from './data';

const STATUS_TABS = [
  { value: 'all', label: 'All', count: 128 },
  { value: 'published', label: 'Published', count: 112 },
  { value: 'scheduled', label: 'Scheduled', count: 6 },
  { value: 'draft', label: 'Draft', count: 9 },
];

// Post list with status tabs, filters and bulk selection
const BlogPosts = () => {
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState([]);

  const rows = useMemo(
    () =>
      blogPosts.filter(
        (p) =>
          (status === 'all' || p.status === status) &&
          (!category || p.category === category) &&
          p.title.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [status, query, category]
  );

  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleAll = (checked) => setSelected(checked ? rows.map((r) => r.id) : []);
  const toggleOne = (id, checked) => setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

  return (
    <div className="space-y-6">
      <PageHeader title="All Posts" description="Create, edit and schedule your articles.">
        <Button variant="outline"><Download />Export</Button>
        <Link to="/blog/posts/new" className={buttonVariants()}><Plus />New Post</Link>
      </PageHeader>

      <Card className="!gap-0 !py-0">
        <TabBar tabs={STATUS_TABS} value={status} onChange={setStatus} />
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <SearchBox placeholder="Search posts…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <NativeSelect className="!w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </NativeSelect>
          {selected.length > 0 && (
            <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              {selected.length} selected
              <Button variant="cancel" size="sm"><Trash2 />Move to trash</Button>
            </span>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" /></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>SEO</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((post) => (
              <TableRow key={post.id}>
                <TableCell><Checkbox checked={selected.includes(post.id)} onCheckedChange={(c) => toggleOne(post.id, c)} aria-label={`Select ${post.title}`} /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 shrink-0 rounded-md bg-gradient-to-br ${post.tone}`} />
                    <div className="min-w-0">
                      <Link to={`/blog/posts/${post.id}`} className="block max-w-[260px] truncate font-medium hover:text-primary">{post.title}</Link>
                      <p className="font-mono text-[11px] text-muted-foreground">/blog/{post.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{post.category}</TableCell>
                <TableCell>{post.author}</TableCell>
                <TableCell><ScoreBadge score={post.seo} /></TableCell>
                <TableCell><ToneBadge tone={postStatusTone[post.status]} className="capitalize">{post.status}</ToneBadge></TableCell>
                <TableCell className="text-right">{post.views ? post.views.toLocaleString() : '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{post.date}</TableCell>
                <TableCell>
                  <RowActions>
                    <Button variant="ghost" size="icon" title="View"><Eye /></Button>
                    <Link to={`/blog/posts/${post.id}`} className={buttonVariants({ variant: 'ghost', size: 'icon' })} title="Edit"><Pencil /></Link>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" title="Trash"><Trash2 /></Button>
                  </RowActions>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No posts match your filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
          <span>Showing {rows.length} of 128</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" disabled><ChevronLeft /></Button>
            <Button size="icon">1</Button>
            <Button variant="outline" size="icon">2</Button>
            <Button variant="outline" size="icon">3</Button>
            <Button variant="outline" size="icon"><ChevronRight /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BlogPosts;
