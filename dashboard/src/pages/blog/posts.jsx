import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, NativeSelect, PageHeader, RowActions, ScoreBadge, SearchBox, TabBar, ToneBadge, useDebounced } from '@/components/dashboard/blog/blog-ui';
import { useBlogCategories, useBlogPosts, useBulkPosts, useDeletePost } from '@/hooks/use-blog';
import { clientConfig } from '@/clientConfig';
import { formatDate } from '@/lib/blog-seo';

const LIMIT = 15;
const STATUS_TONE = { published: 'green', scheduled: 'amber', draft: 'gray', trash: 'red' };
const COVER_TONES = ['from-primary/60 to-primary/20', 'from-sky-500/50 to-sky-500/10', 'from-emerald-500/50 to-emerald-500/10', 'from-violet-500/50 to-violet-500/10', 'from-rose-500/50 to-rose-500/10'];

// Post list with status tabs, filters and bulk actions
const BlogPosts = () => {
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const search = useDebounced(query);

  useEffect(() => {
    setPage(1);
    setSelected([]);
  }, [status, search, category, sort]);

  const { data, isLoading, isFetching } = useBlogPosts({ status, q: search, category, sort, page, limit: LIMIT });
  const { data: categoryData } = useBlogCategories();
  const bulk = useBulkPosts();
  const remove = useDeletePost();

  const rows = data?.data || [];
  const meta = data?.meta;
  const counts = meta?.counts || {};
  const pages = Math.max(1, Math.ceil((meta?.total || 0) / LIMIT));
  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id));
  const toggleAll = (checked) => setSelected(checked ? rows.map((row) => row.id) : []);
  const toggleOne = (id, checked) => setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  const viewUrl = (slug) => `${String(clientConfig?.storefrontUrl || '').replace(/\/$/, '')}/blog/${slug}`;

  const tabs = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'published', label: 'Published', count: counts.published },
    { value: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { value: 'draft', label: 'Draft', count: counts.draft },
    { value: 'trash', label: 'Trash', count: counts.trash },
  ];

  const runBulk = (action) => bulk.mutate({ ids: selected, action }, { onSuccess: () => setSelected([]) });

  return (
    <div className="space-y-6">
      <PageHeader title="All Posts" description="Create, edit and schedule your articles.">
        <Link to="/blog/posts/new" className={buttonVariants()}><Plus />New Post</Link>
      </PageHeader>

      <Card className="!gap-0 !py-0">
        <TabBar tabs={tabs} value={status} onChange={setStatus} />
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <SearchBox placeholder="Search posts…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <NativeSelect className="!w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {(categoryData?.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </NativeSelect>
          <NativeSelect className="!w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="views">Most viewed</option>
            <option value="title">Title A–Z</option>
          </NativeSelect>
          {selected.length > 0 && (
            <span className="ml-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {selected.length} selected
              {status !== 'trash' && <Button variant="outline" size="sm" onClick={() => runBulk('publish')} disabled={bulk.isPending}>Publish</Button>}
              {status === 'trash' ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => runBulk('restore')} disabled={bulk.isPending}><RotateCcw />Restore</Button>
                  <Button variant="destructive" size="sm" onClick={() => setConfirm({ type: 'bulk' })} disabled={bulk.isPending}><Trash2 />Delete forever</Button>
                </>
              ) : (
                <Button variant="cancel" size="sm" onClick={() => runBulk('trash')} disabled={bulk.isPending}><Trash2 />Move to trash</Button>
              )}
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
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((post, index) => (
              <TableRow key={post.id}>
                <TableCell><Checkbox checked={selected.includes(post.id)} onCheckedChange={(c) => toggleOne(post.id, c)} aria-label={`Select ${post.title}`} /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {post.coverImageUrl ? (
                      <img src={post.coverImageUrl} alt={post.coverImageAlt || ''} className="h-10 w-10 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className={`h-10 w-10 shrink-0 rounded-md bg-gradient-to-br ${COVER_TONES[index % COVER_TONES.length]}`} />
                    )}
                    <div className="min-w-0">
                      <Link to={`/blog/posts/${post.id}`} className="block max-w-[260px] truncate font-medium hover:text-primary">{post.title}</Link>
                      <p className="font-mono text-[11px] text-muted-foreground">/blog/{post.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{post.categories?.map((c) => c.name).join(', ') || '—'}</TableCell>
                <TableCell>{post.authorName || '—'}</TableCell>
                <TableCell><ScoreBadge score={post.seo?.score || 0} /></TableCell>
                <TableCell><ToneBadge tone={STATUS_TONE[post.status]} className="capitalize">{post.status}</ToneBadge></TableCell>
                <TableCell className="text-right">{post.views ? post.views.toLocaleString() : '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(post.publishedAt || post.createdAt)}</TableCell>
                <TableCell>
                  <RowActions>
                    {post.status === 'published' && clientConfig?.storefrontUrl && (
                      <a href={viewUrl(post.slug)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'ghost', size: 'icon' })} title="View on site"><ExternalLink /></a>
                    )}
                    <Link to={`/blog/posts/${post.id}`} className={buttonVariants({ variant: 'ghost', size: 'icon' })} title="Edit"><Pencil /></Link>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" title={post.status === 'trash' ? 'Delete forever' : 'Move to trash'} onClick={() => (post.status === 'trash' ? setConfirm({ type: 'one', id: post.id }) : remove.mutate(post.id))}><Trash2 /></Button>
                  </RowActions>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!isLoading && rows.length === 0 && <EmptyState>{search || category ? 'No posts match your filters.' : 'No posts here yet.'}</EmptyState>}
        {isLoading && <EmptyState>Loading posts…</EmptyState>}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
          <span>{meta ? `Showing ${rows.length} of ${meta.total}` : ''}{isFetching && !isLoading ? ' · updating…' : ''}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
            <span className="px-2">Page {page} of {pages}</span>
            <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
          </div>
        </div>
      </Card>

      <ConfirmDeleteDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Delete permanently?"
        description="This removes the post and its comments for good. This cannot be undone."
        isDeleting={bulk.isPending || remove.isPending}
        onConfirm={async () => {
          if (confirm?.type === 'bulk') await bulk.mutateAsync({ ids: selected, action: 'delete' });
          else if (confirm?.id) await remove.mutateAsync(confirm.id);
          setSelected([]);
        }}
      />
    </div>
  );
};

export default BlogPosts;
