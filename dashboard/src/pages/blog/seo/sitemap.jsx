import { useEffect, useState } from 'react';
import { Bot, Copy, ExternalLink, Map, RefreshCw, RotateCcw, Save, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LoadingBlocks, PageHeader, ToggleRow, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { useRegenerateSitemap, useSitemapInfo, useUpdateSeoSettings } from '@/hooks/use-blog';
import { timeAgo } from '@/lib/blog-seo';

// XML sitemap sections and robots.txt editor
const SeoSitemap = () => {
  const { data, isLoading } = useSitemapInfo();
  const save = useUpdateSeoSettings();
  const regenerate = useRegenerateSitemap();
  const [robots, setRobots] = useState('');
  const info = data?.data;

  useEffect(() => {
    if (info) setRobots(info.robots);
  }, [info]);

  if (isLoading || !info) return <LoadingBlocks rows={2} className="h-48" />;

  const toggle = (key, value) => save.mutate({ sitemap: { [key]: value } });
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(info.url);
      toast.success('Sitemap URL copied');
    } catch (_) {
      toast.error('Could not copy the URL');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Sitemap & Robots" description="Help crawlers discover and index your blog content." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Map className="h-4 w-4 text-primary" />XML Sitemap</CardTitle>
            <ToneBadge tone="green">Active</ToneBadge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{info.url}</span>
              <Button variant="ghost" size="icon" title="Copy" onClick={copyUrl}><Copy /></Button>
              <a href={info.url} target="_blank" rel="noreferrer" title="Open"><Button variant="ghost" size="icon" tabIndex={-1}><ExternalLink /></Button></a>
            </div>
            {info.sections.map((s) => (
              <ToggleRow key={s.key} title={s.title} description={`${s.urls} URLs`} checked={s.enabled} onCheckedChange={(v) => toggle(s.key, v)} />
            ))}
          </CardContent>
          <CardFooter className="gap-2">
            <span className="flex-1 text-xs text-muted-foreground">{info.lastGeneratedAt ? `Last generated ${timeAgo(info.lastGeneratedAt)}` : 'Generated live on every request'}</span>
            <Button variant="outline" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}><RefreshCw className={regenerate.isPending ? 'animate-spin' : ''} />Regenerate</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" />robots.txt</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setRobots(info.defaultRobots)}><RotateCcw />Reset</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={12} className="font-mono text-xs leading-relaxed" value={robots} onChange={(e) => setRobots(e.target.value)} />
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Changes take effect immediately. A wrong rule can hide your whole site from search engines.
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => save.mutate({ robots })} disabled={save.isPending || robots === info.robots}><Save />Save robots.txt</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SeoSitemap;
