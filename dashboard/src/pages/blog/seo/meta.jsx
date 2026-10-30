import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, PageHeader, TabBar, ToggleRow, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { cn } from '@/lib/utils';
import { titleVariables } from '../data';

const TABS = [
  { value: 'general', label: 'General' },
  { value: 'posts', label: 'Blog Posts' },
  { value: 'taxonomy', label: 'Categories & Tags' },
  { value: 'products', label: 'Products' },
  { value: 'pages', label: 'Pages' },
];
const SEPARATORS = ['|', '–', '·', '»'];

// Default title and description templates per content type
const SeoMeta = () => {
  const [tab, setTab] = useState('general');
  const [siteName, setSiteName] = useState('Surokkha');
  const [sep, setSep] = useState('|');
  const [postTitle, setPostTitle] = useState('%post_title% %sep% %site_name%');
  const [postDescription, setPostDescription] = useState('%excerpt%');
  const [archiveTitle, setArchiveTitle] = useState('Blog %sep% %site_name%');
  const [indexPosts, setIndexPosts] = useState(true);

  const example = postTitle
    .replaceAll('%post_title%', 'How to choose your signature attar')
    .replaceAll('%site_name%', siteName)
    .replaceAll('%sep%', sep)
    .replaceAll('%category%', 'Guides')
    .replaceAll('%author%', 'Rafi')
    .replaceAll('%year%', '2026');

  return (
    <div className="space-y-6">
      <PageHeader title="Meta & Titles" description="Default title and description templates for each content type.">
        <Button><Save />Save changes</Button>
      </PageHeader>

      <Card className="!gap-0 !py-0">
        <TabBar tabs={TABS} value={tab} onChange={setTab} />
        <div className="space-y-5 p-4">
          {tab === 'general' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Site name"><Input value={siteName} onChange={(e) => setSiteName(e.target.value)} /></Field>
              <Field label="Title separator">
                <div className="flex gap-2">
                  {SEPARATORS.map((s) => (
                    <Button key={s} type="button" variant="outline" size="icon" className={cn(sep === s && 'border-primary')} onClick={() => setSep(s)}>{s}</Button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {tab === 'posts' && (
            <>
              <Field label="Blog post title template">
                <Input className="font-mono text-xs" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {titleVariables.map((v) => (
                    <button key={v} type="button" onClick={() => setPostTitle((t) => `${t} ${v}`.trim())}>
                      <ToneBadge tone="gray" className="cursor-pointer font-mono">{v}</ToneBadge>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Blog post description template">
                <Textarea rows={2} className="font-mono" value={postDescription} onChange={(e) => setPostDescription(e.target.value)} />
              </Field>
              <Field label="Blog archive title">
                <Input className="font-mono text-xs" value={archiveTitle} onChange={(e) => setArchiveTitle(e.target.value)} />
              </Field>
              <div className="rounded-lg border bg-background p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live example</p>
                <p className="text-xl leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{example}</p>
                <p className="text-xs text-muted-foreground">https://surokkha.store › blog › choose-signature-attar</p>
              </div>
              <ToggleRow title="Show posts in search results" description="Turn off to add noindex to every blog post." checked={indexPosts} onCheckedChange={setIndexPosts} />
            </>
          )}

          {tab !== 'general' && tab !== 'posts' && (
            <p className="py-8 text-center text-sm text-muted-foreground">Templates for this content type use the same variables as blog posts.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SeoMeta;
