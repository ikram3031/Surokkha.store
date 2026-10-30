import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CircleCheck, CircleX, Eye, Plus, Search, Send, TriangleAlert, Upload, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/dashboard/rich-text-editor';
import { Field, NativeSelect, PageHeader, TabBar, ToneBadge, scoreTone } from '@/components/dashboard/blog/blog-ui';
import { blogPosts, categories } from './data';

const SITE_URL = 'surokkha.store';

const slugify = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

// Fill bar for the meta title / description length meters
const LengthMeter = ({ length, min, limit }) => {
  const ok = length >= min && length <= limit;
  return (
    <div className="mt-1.5 h-1 overflow-hidden rounded bg-muted">
      <div
        className={`h-full transition-all ${length === 0 ? 'bg-muted' : ok ? 'bg-emerald-500' : 'bg-amber-500'}`}
        style={{ width: `${Math.min(100, (length / limit) * 100)}%` }}
      />
    </div>
  );
};

// Google-style result preview that updates as the SEO fields change
const SerpPreview = ({ title, description, slug }) => {
  const [device, setDevice] = useState('desktop');
  return (
    <div className="rounded-lg border bg-background p-4">
      <TabBar
        tabs={[{ value: 'desktop', label: 'Desktop' }, { value: 'mobile', label: 'Mobile' }]}
        value={device}
        onChange={setDevice}
      />
      <div className={`mt-3 ${device === 'mobile' ? 'max-w-[360px]' : 'max-w-[600px]'}`}>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">S</span>
          <div>
            <p className="leading-tight">Surokkha</p>
            <p className="leading-tight text-muted-foreground">https://{SITE_URL} › blog › {slug || 'your-post'}</p>
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
  const post = useMemo(() => blogPosts.find((p) => String(p.id) === id), [id]);

  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaTitle, setMetaTitle] = useState(post ? `${post.title} | Surokkha` : '');
  const [metaDescription, setMetaDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(post ? [post.category] : []);
  const [tagList, setTagList] = useState(post ? ['attar', 'guide'] : []);
  const [tagDraft, setTagDraft] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [featured, setFeatured] = useState(false);

  const onTitleChange = (value) => {
    setTitle(value);
    if (!post) setSlug(slugify(value));
  };

  const addTag = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const tag = tagDraft.trim().toLowerCase();
    if (tag && !tagList.includes(tag)) setTagList([...tagList, tag]);
    setTagDraft('');
  };

  const toggleCategory = (name, checked) =>
    setSelectedCategories((prev) => (checked ? [...prev, name] : prev.filter((c) => c !== name)));

  const keyword = focusKeyword.trim().toLowerCase();
  const checks = [
    { ok: !!keyword && metaTitle.toLowerCase().includes(keyword), label: 'Focus keyword appears in the meta title' },
    { ok: !!keyword && metaDescription.toLowerCase().includes(keyword), label: 'Focus keyword appears in the meta description' },
    { ok: metaTitle.length >= 30 && metaTitle.length <= 60, label: 'Meta title length is between 30 and 60 characters' },
    { ok: metaDescription.length >= 80 && metaDescription.length <= 160, label: 'Meta description length is between 80 and 160 characters' },
    { ok: !!slug, label: 'Permalink is set' },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader title={post ? 'Edit Post' : 'New Post'} description={post ? post.title : 'Write something worth ranking for.'}>
        <Link to="/blog/posts" className={buttonVariants({ variant: 'outline' })}><ArrowLeft />Back</Link>
        <Button variant="outline"><Eye />Preview</Button>
        <Button variant="outline">Save Draft</Button>
        <Button onClick={() => navigate('/blog/posts')}><Send />Publish</Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <Field label="Title">
                <Input className="!h-10 !text-base font-semibold" placeholder="Enter post title…" value={title} onChange={(e) => onTitleChange(e.target.value)} />
              </Field>
              <Field label="Permalink">
                <div className="flex items-center overflow-hidden rounded-lg border border-input text-sm">
                  <span className="bg-muted px-2.5 py-1.5 font-mono text-xs text-muted-foreground">{SITE_URL}/blog/</span>
                  <input className="h-8 min-w-0 flex-1 bg-transparent px-2.5 font-mono text-xs outline-none" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
                </div>
              </Field>
              <Field label="Content">
                <RichTextEditor value={content} onChange={setContent} />
              </Field>
              <Field label="Excerpt">
                <Textarea rows={3} placeholder="Short summary shown on blog cards…" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
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
                <Input placeholder="e.g. signature attar" value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} />
              </Field>
              <Field label="Meta title" right={<span className="text-[11px] text-muted-foreground">{metaTitle.length} / 60</span>}>
                <Input placeholder="e.g. How to Choose Your Signature Attar | Surokkha" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                <LengthMeter length={metaTitle.length} min={30} limit={60} />
              </Field>
              <Field label="Meta description" right={<span className="text-[11px] text-muted-foreground">{metaDescription.length} / 160</span>}>
                <Textarea rows={3} placeholder="Brief summary for search engine results…" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                <LengthMeter length={metaDescription.length} min={80} limit={160} />
              </Field>
              <Field label="Search preview">
                <SerpPreview title={metaTitle || title} description={metaDescription || excerpt} slug={slug} />
              </Field>
              <Field label="SEO checklist">
                <ul className="space-y-1.5 text-xs">
                  {checks.map((c) => (
                    <li key={c.label} className="flex items-center gap-2">
                      {c.ok ? <CircleCheck className="h-4 w-4 text-emerald-500" /> : <TriangleAlert className="h-4 w-4 text-amber-500" />}
                      {c.label}
                    </li>
                  ))}
                  <li className="flex items-center gap-2"><CircleX className="h-4 w-4 text-destructive" />Featured image needs alt text</li>
                </ul>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Canonical URL"><Input placeholder="https://…" /></Field>
                <Field label="Robots">
                  <NativeSelect defaultValue="index,follow">
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
                <ToneBadge tone="gray" className="capitalize">{post?.status || 'draft'}</ToneBadge>
              </div>
              <Field label="Visibility">
                <NativeSelect><option>Public</option><option>Private</option><option>Password protected</option></NativeSelect>
              </Field>
              <Field label="Publish date"><Input type="datetime-local" /></Field>
              <label className="flex cursor-pointer items-center gap-2 text-xs"><Checkbox checked={allowComments} onCheckedChange={setAllowComments} />Allow comments</label>
              <label className="flex cursor-pointer items-center gap-2 text-xs"><Checkbox checked={featured} onCheckedChange={setFeatured} />Feature on homepage</label>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" className="flex-1">Save Draft</Button>
              <Button className="flex-1" onClick={() => navigate('/blog/posts')}>Publish</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader><CardTitle>Featured Image</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Upload className="h-5 w-5" />
                <span className="text-xs font-medium">Click or drop an image</span>
                <span className="text-[10px]">1200 × 630 recommended</span>
              </div>
              <Field label="Alt text"><Input placeholder="Describe the image" /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Category</CardTitle>
              <Link to="/blog/categories" className={buttonVariants({ variant: 'ghost', size: 'sm' })}><Plus />New</Link>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {categories.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2">
                  <Checkbox checked={selectedCategories.includes(c.name)} onCheckedChange={(checked) => toggleCategory(c.name, checked)} />
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
                {tagList.map((tag) => (
                  <ToneBadge key={tag} tone="gold">
                    {tag}
                    <button type="button" aria-label={`Remove ${tag}`} className="cursor-pointer" onClick={() => setTagList(tagList.filter((t) => t !== tag))}><X /></button>
                  </ToneBadge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Author</CardTitle></CardHeader>
            <CardContent>
              <NativeSelect defaultValue={post?.author || 'Rafi'}><option>Rafi</option><option>Nadia</option></NativeSelect>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;
