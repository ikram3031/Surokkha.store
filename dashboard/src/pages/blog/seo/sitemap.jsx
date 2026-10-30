import { useState } from 'react';
import { Bot, Copy, ExternalLink, Map, RefreshCw, RotateCcw, Save, Send, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, ToggleRow, ToneBadge } from '@/components/dashboard/blog/blog-ui';

const SITEMAP_URL = 'https://surokkha.store/sitemap.xml';
const DEFAULT_ROBOTS = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /checkout/
Disallow: /cart/

Sitemap: ${SITEMAP_URL}`;

const SECTIONS = [
  { key: 'posts', title: 'Blog posts', urls: 128 },
  { key: 'taxonomy', title: 'Categories & tags', urls: 56 },
  { key: 'products', title: 'Products', urls: 212 },
  { key: 'pages', title: 'Static pages', urls: 42 },
];

// XML sitemap sections and robots.txt editor
const SeoSitemap = () => {
  const [included, setIncluded] = useState({ posts: true, taxonomy: true, products: true, pages: true });
  const [robots, setRobots] = useState(DEFAULT_ROBOTS);

  const copyUrl = () => navigator.clipboard?.writeText(SITEMAP_URL);

  return (
    <div className="space-y-6">
      <PageHeader title="Sitemap & Robots" description="Help crawlers discover and index your content.">
        <Button><Save />Save changes</Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Map className="h-4 w-4 text-primary" />XML Sitemap</CardTitle>
            <ToneBadge tone="green">Active</ToneBadge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{SITEMAP_URL}</span>
              <Button variant="ghost" size="icon" title="Copy" onClick={copyUrl}><Copy /></Button>
              <a href={SITEMAP_URL} target="_blank" rel="noreferrer" title="Open"><Button variant="ghost" size="icon" tabIndex={-1}><ExternalLink /></Button></a>
            </div>
            {SECTIONS.map((s) => (
              <ToggleRow
                key={s.key}
                title={s.title}
                description={`${s.urls} URLs`}
                checked={included[s.key]}
                onCheckedChange={(v) => setIncluded((prev) => ({ ...prev, [s.key]: v }))}
              />
            ))}
          </CardContent>
          <CardFooter className="gap-2">
            <span className="flex-1 text-xs text-muted-foreground">Last generated 2 hours ago</span>
            <Button variant="outline"><RefreshCw />Regenerate</Button>
            <Button><Send />Ping Google</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" />robots.txt</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setRobots(DEFAULT_ROBOTS)}><RotateCcw />Reset</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={12} className="font-mono text-xs leading-relaxed" value={robots} onChange={(e) => setRobots(e.target.value)} />
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Changes take effect immediately. A wrong rule can hide your whole site from search engines.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeoSitemap;
