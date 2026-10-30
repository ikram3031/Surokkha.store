import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, LoadingBlocks, PageHeader, TabBar, ToggleRow, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { useSeoSettings, useUpdateSeoSettings } from '@/hooks/use-blog';
import { cn } from '@/lib/utils';

const TABS = [
  { value: 'general', label: 'General' },
  { value: 'posts', label: 'Blog Posts' },
];
const SEPARATORS = ['|', '–', '·', '»'];
const VARIABLES = ['%post_title%', '%excerpt%', '%category%', '%author%', '%sep%', '%site_name%', '%year%'];

// Default title and description templates for blog posts
const SeoMeta = () => {
  const { data, isLoading } = useSeoSettings();
  const save = useUpdateSeoSettings();
  const [tab, setTab] = useState('general');
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (data?.data?.meta) setMeta(data.data.meta);
  }, [data]);

  if (isLoading || !meta) return <LoadingBlocks rows={2} className="h-48" />;

  const set = (key, value) => setMeta((m) => ({ ...m, [key]: value }));
  const example = meta.postTitleTemplate
    .replaceAll('%post_title%', 'How to choose your signature attar')
    .replaceAll('%site_name%', meta.siteName)
    .replaceAll('%sep%', meta.separator)
    .replaceAll('%category%', 'Guides')
    .replaceAll('%author%', 'Rafi')
    .replaceAll('%excerpt%', '')
    .replaceAll('%year%', String(new Date().getFullYear()))
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div className="space-y-6">
      <PageHeader title="Meta & Titles" description="Default title and description templates. A post's own meta fields always win.">
        <Button onClick={() => save.mutate({ meta })} disabled={save.isPending}><Save />Save changes</Button>
      </PageHeader>

      <Card className="!gap-0 !py-0">
        <TabBar tabs={TABS} value={tab} onChange={setTab} />
        <div className="space-y-5 p-4">
          {tab === 'general' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Site name"><Input value={meta.siteName} onChange={(e) => set('siteName', e.target.value)} /></Field>
              <Field label="Title separator">
                <div className="flex gap-2">
                  {SEPARATORS.map((s) => (
                    <Button key={s} type="button" variant="outline" size="icon" className={cn(meta.separator === s && 'border-primary')} onClick={() => set('separator', s)}>{s}</Button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {tab === 'posts' && (
            <>
              <Field label="Blog post title template">
                <Input className="font-mono text-xs" value={meta.postTitleTemplate} onChange={(e) => set('postTitleTemplate', e.target.value)} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {VARIABLES.map((v) => (
                    <button key={v} type="button" onClick={() => set('postTitleTemplate', `${meta.postTitleTemplate} ${v}`.trim())}>
                      <ToneBadge tone="gray" className="cursor-pointer font-mono">{v}</ToneBadge>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Blog post description template">
                <Textarea rows={2} className="font-mono" value={meta.postDescriptionTemplate} onChange={(e) => set('postDescriptionTemplate', e.target.value)} />
              </Field>
              <Field label="Blog archive title">
                <Input className="font-mono text-xs" value={meta.archiveTitle} onChange={(e) => set('archiveTitle', e.target.value)} />
              </Field>
              <div className="rounded-lg border bg-background p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live example</p>
                <p className="text-xl leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{example || 'Your title'}</p>
              </div>
              <ToggleRow title="Show posts in search results" description="Turn off to add noindex to every blog post." checked={meta.indexPosts !== false} onCheckedChange={(v) => set('indexPosts', v)} />
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SeoMeta;
