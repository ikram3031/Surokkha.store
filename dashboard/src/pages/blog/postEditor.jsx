import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CircleCheck, Eye, Plus, Search, Send, TriangleAlert, Upload, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/dashboard/rich-text-editor';
import { Field, LoadingBlocks, NativeSelect, PageHeader, TabBar, ToneBadge, scoreTone } from '@/components/dashboard/blog/blog-ui';
import { useBlogCategories, useBlogPost, useSavePost, useUploadBlogImage } from '@/hooks/use-blog';
import { clientConfig } from '@/clientConfig';
import { resolveImageUrl } from '@/lib/api-client';
import { computeSeoScore, countWords, getSeoChecks, slugify, toLocalInput } from '@/lib/blog-seo';

const EMPTY_FORM = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  coverImageUrl: '',
  coverImageAlt: '',
  categories: [],
  tags: [],
  visibility: 'public',
  allowComments: true,
  isFeatured: false,
  publishAt: '',
  status: 'draft',
  focusKeyword: '',
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  robots: 'index,follow',
};

// Maps a loaded post onto the editor's form shape
const toForm = (post) => ({
  title: post.title || '',
  slug: post.slug || '',
  content: post.content || '',
  excerpt: post.excerpt || '',
  coverImageUrl: post.coverImageUrl || '',
  coverImageAlt: post.coverImageAlt || '',
  categories: (post.categories || []).map((c) => c.id || c._id),
  tags: post.tags || [],
  visibility: post.visibility || 'public',
  allowComments: post.allowComments !== false,
  isFeatured: Boolean(post.isFeatured),
  publishAt: post.status === 'scheduled' ? toLocalInput(post.scheduledAt) : '',
  status: post.status || 'draft',
  focusKeyword: post.seo?.focusKeyword || '',
  metaTitle: post.seo?.metaTitle || '',
  metaDescription: post.seo?.metaDescription || '',
  canonicalUrl: post.seo?.canonicalUrl || '',
  robots: post.seo?.robots || 'index,follow',
});

// Fill bar for the meta title / description length meters
const LengthMeter = ({ length, min, limit }) => {
  const ok = length >= min && length <= limit;
  return (
    <div className="mt-1.5 h-1 overflow-hidden rounded bg-muted">
      <div className={`h-full transition-all ${length === 0 ? 'bg-muted' : ok ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, (length / limit) * 100)}%` }} />
    </div>
  );
};

// Google-style result preview that updates as the SEO fields change
const SerpPreview = ({ title, description, slug }) => {
  const [device, setDevice] = useState('desktop');
  const host = String(clientConfig?.storefrontUrl || '').replace(/^https?:\/\//, '').replace(/\/$/, '') || 'yoursite.com';
  return (
    <div className="rounded-lg border bg-background p-4">
      <TabBar tabs={[{ value: 'desktop', label: 'Desktop' }, { value: 'mobile', label: 'Mobile' }]} value={device} onChange={setDevice} />
      <div className={`mt-3 ${device === 'mobile' ? 'max-w-[360px]' : 'max-w-[600px]'}`}>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">{host.charAt(0).toUpperCase()}</span>
          <div>
            <p className="leading-tight">{host}</p>
            <p className="leading-tight text-muted-foreground">https://{host} › blog › {slug || 'your-post'}</p>
          </div>
        </div>
        <p className="mt-1.5 text-xl leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{title || 'Page title'}</p>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">{description || 'Meta description will appear here…'}</p>
      </div>
    </div>
  );
};

// Create or edit a post, with the SEO panel alongside the content
const PostEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const { data: postData, isLoading } = useBlogPost(id);
  const { data: categoryData } = useBlogCategories();
  const save = useSavePost();
  const upload = useUploadBlogImage();

  const post = postData?.data;
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [tagDraft, setTagDraft] = useState('');

  useEffect(() => {
    if (post) {
      setForm(toForm(post));
      setSlugTouched(true);
    }
  }, [post]);

  useEffect(() => {
    if (!id) {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
    }
  }, [id]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const onTitle = (value) => setForm((f) => ({ ...f, title: value, slug: slugTouched ? f.slug : slugify(value) }));

  const checks = useMemo(() => getSeoChecks(form), [form]);
  const score = useMemo(() => computeSeoScore(form), [form]);
  const words = useMemo(() => countWords(form.content), [form.content]);
  const publishAtDate = form.publishAt ? new Date(form.publishAt) : null;
  const isFuture = Boolean(publishAtDate) && publishAtDate.getTime() > Date.now();
  const isPublished = post?.status === 'published';

  const submit = (status) => {
    const payload = {
      id: post?.id,
      title: form.title,
      slug: form.slug,
      content: form.content,
      excerpt: form.excerpt,
      coverImageUrl: form.coverImageUrl,
      coverImageAlt: form.coverImageAlt,
      categories: form.categories,
      tags: form.tags,
      visibility: form.visibility,
      allowComments: form.allowComments,
      isFeatured: form.isFeatured,
      status,
      seo: { focusKeyword: form.focusKeyword, metaTitle: form.metaTitle, metaDescription: form.metaDescription, canonicalUrl: form.canonicalUrl, robots: form.robots },
    };
    if (status === 'scheduled') payload.scheduledAt = publishAtDate?.toISOString();
    save.mutate(payload, {
      onSuccess: (response) => {
        if (!post && response?.data?.id) navigate(`/blog/posts/${response.data.id}`, { replace: true });
      },
    });
  };

  const publish = () => submit(isFuture ? 'scheduled' : 'published');
  const onCoverChosen = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const response = await upload.mutateAsync(file);
    set('coverImageUrl', response?.data?.url || '');
  };
  const addTag = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const tag = tagDraft.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) set('tags', [...form.tags, tag]);
    setTagDraft('');
  };
  const toggleCategory = (categoryId, checked) =>
    set('categories', checked ? [...form.categories, categoryId] : form.categories.filter((c) => c !== categoryId));

  if (id && isLoading) return <LoadingBlocks rows={3} className="h-40" />;
  if (id && !post) return <p className="py-10 text-center text-sm text-muted-foreground">Post not found.</p>;

  const siteBase = String(clientConfig?.storefrontUrl || '').replace(/\/$/, '');
  const canSave = form.title.trim().length > 0 && !save.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title={post ? 'Edit Post' : 'New Post'} description={post ? post.title : 'Write something worth ranking for.'}>
        <Link to="/blog/posts" className={buttonVariants({ variant: 'outline' })}><ArrowLeft />Back</Link>
        {post && siteBase && post.status === 'published' && (
          <a href={`${siteBase}/blog/${post.slug}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}><Eye />View</a>
        )}
        {!isPublished && <Button variant="outline" disabled={!canSave} onClick={() => submit('draft')}>Save Draft</Button>}
        <Button disabled={!canSave || (isFuture && !form.publishAt)} onClick={isPublished ? () => submit('published') : publish}>
          <Send />{isPublished ? 'Update' : isFuture ? 'Schedule' : 'Publish'}
        </Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <Field label="Title">
                <Input className="!h-10 !text-base font-semibold" placeholder="Enter post title…" value={form.title} onChange={(e) => onTitle(e.target.value)} />
              </Field>
              <Field label="Permalink">
                <div className="flex items-center overflow-hidden rounded-lg border border-input text-sm">
                  <span className="bg-muted px-2.5 py-1.5 font-mono text-xs text-muted-foreground">/blog/</span>
                  <input className="h-8 min-w-0 flex-1 bg-transparent px-2.5 font-mono text-xs outline-none" value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
                </div>
              </Field>
              <Field label="Content" right={<span className="text-[11px] text-muted-foreground">{words} words</span>}>
                <RichTextEditor key={post?.id || 'new'} value={form.content} onChange={(html) => set('content', html)} />
              </Field>
              <Field label="Excerpt">
                <Textarea rows={3} placeholder="Short summary shown on blog cards…" value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="flex items-center gap-2"><Search className="h-4 w-4 text-primary" />Search Engine Optimization (SEO)</CardTitle>
              <ToneBadge tone={scoreTone(score)}>Score {score}</ToneBadge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Focus keyword">
                <Input placeholder="e.g. signature attar" value={form.focusKeyword} onChange={(e) => set('focusKeyword', e.target.value)} />
              </Field>
              <Field label="Meta title" right={<span className="text-[11px] text-muted-foreground">{form.metaTitle.length} / 60</span>}>
                <Input placeholder={form.title || 'e.g. How to Choose Your Signature Attar | Brand'} value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} />
                <LengthMeter length={form.metaTitle.length} min={30} limit={60} />
              </Field>
              <Field label="Meta description" right={<span className="text-[11px] text-muted-foreground">{form.metaDescription.length} / 160</span>}>
                <Textarea rows={3} placeholder="Brief summary for search engine results…" value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} />
                <LengthMeter length={form.metaDescription.length} min={80} limit={160} />
              </Field>
              <Field label="Search preview">
                <SerpPreview title={form.metaTitle || form.title} description={form.metaDescription || form.excerpt} slug={form.slug} />
              </Field>
              <Field label="SEO checklist">
                <ul className="space-y-1.5 text-xs">
                  {checks.map((c) => (
                    <li key={c.key} className="flex items-center gap-2">
                      {c.ok ? <CircleCheck className="h-4 w-4 text-emerald-500" /> : <TriangleAlert className="h-4 w-4 text-amber-500" />}
                      {c.label}
                    </li>
                  ))}
                </ul>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Canonical URL"><Input placeholder="https://…" value={form.canonicalUrl} onChange={(e) => set('canonicalUrl', e.target.value)} /></Field>
                <Field label="Robots">
                  <NativeSelect value={form.robots} onChange={(e) => set('robots', e.target.value)}>
                    <option value="index,follow">index, follow</option>
                    <option value="noindex,follow">noindex, follow</option>
                    <option value="noindex,nofollow">noindex, nofollow</option>
                  </NativeSelect>
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Publish</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <ToneBadge tone={{ published: 'green', scheduled: 'amber', draft: 'gray', trash: 'red' }[post?.status || 'draft']} className="capitalize">{post?.status || 'draft'}</ToneBadge>
              </div>
              <Field label="Visibility">
                <NativeSelect value={form.visibility} onChange={(e) => set('visibility', e.target.value)}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </NativeSelect>
              </Field>
              {!isPublished && (
                <Field label="Schedule for">
                  <Input type="datetime-local" value={form.publishAt} onChange={(e) => set('publishAt', e.target.value)} />
                  <p className="mt-1 text-[11px] text-muted-foreground">Leave empty to publish immediately.</p>
                </Field>
              )}
              <label className="flex cursor-pointer items-center gap-2 text-xs"><Checkbox checked={form.allowComments} onCheckedChange={(v) => set('allowComments', v)} />Allow comments</label>
              <label className="flex cursor-pointer items-center gap-2 text-xs"><Checkbox checked={form.isFeatured} onCheckedChange={(v) => set('isFeatured', v)} />Feature on homepage</label>
              {post && <p className="text-xs text-muted-foreground">Author: {post.authorName || '—'}</p>}
            </CardContent>
            {isPublished && (
              <CardFooter>
                <Button variant="outline" className="w-full" disabled={!canSave} onClick={() => submit('draft')}>Unpublish</Button>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle>Featured Image</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onCoverChosen} />
              {form.coverImageUrl ? (
                <div className="relative overflow-hidden rounded-lg border">
                  <img src={resolveImageUrl(form.coverImageUrl)} alt={form.coverImageAlt || ''} className="aspect-video w-full object-cover" />
                  <Button variant="destructive" size="icon" className="absolute right-2 top-2" title="Remove image" onClick={() => set('coverImageUrl', '')}><X /></Button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInput.current?.click()} disabled={upload.isPending} className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60">
                  <Upload className="h-5 w-5" />
                  <span className="text-xs font-medium">{upload.isPending ? 'Uploading…' : 'Click to upload an image'}</span>
                  <span className="text-[10px]">1200 × 630 recommended</span>
                </button>
              )}
              <Field label="Alt text"><Input placeholder="Describe the image" value={form.coverImageAlt} onChange={(e) => set('coverImageAlt', e.target.value)} /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Category</CardTitle>
              <Link to="/blog/categories" className={buttonVariants({ variant: 'ghost', size: 'sm' })}><Plus />New</Link>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(categoryData?.data || []).length === 0 && <p className="text-xs text-muted-foreground">No categories yet.</p>}
              {(categoryData?.data || []).map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2">
                  <Checkbox checked={form.categories.includes(c.id)} onCheckedChange={(checked) => toggleCategory(c.id, checked)} />
                  {c.name}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Add tag and press Enter" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={addTag} />
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((tag) => (
                  <ToneBadge key={tag} tone="gold">
                    {tag}
                    <button type="button" aria-label={`Remove ${tag}`} className="cursor-pointer" onClick={() => set('tags', form.tags.filter((t) => t !== tag))}><X /></button>
                  </ToneBadge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;
