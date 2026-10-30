import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, CircleX, Eye, Link2, Map, MousePointerClick, ScanSearch, TrendingUp, TriangleAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, StatCard, ToneBadge, scoreTone } from '@/components/dashboard/blog/blog-ui';
import { seoIssues, topKeywords } from '../data';

const HEALTH = 82;

// SEO landing page: health score, search traffic and the most important issues
const SeoOverview = () => (
  <div className="space-y-6">
    <PageHeader title="SEO Overview" description="Search health of surokkha.store.">
      <Button variant="outline"><Link2 />Search Console</Button>
      <Link to="/blog/seo/audit" className={buttonVariants()}><ScanSearch />Run Audit</Link>
    </PageHeader>

    <div className="grid gap-4 lg:grid-cols-4">
      <Card className="items-center justify-center text-center">
        <div
          className="relative flex h-28 w-28 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(var(--primary) ${HEALTH}%, var(--muted) 0)` }}
        >
          <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-card">
            <span className="text-3xl font-extrabold leading-none">{HEALTH}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</span>
          </div>
        </div>
        <p className="mt-1 text-sm font-semibold">SEO Health</p>
        <ToneBadge tone={scoreTone(HEALTH)}>Good</ToneBadge>
      </Card>
      <StatCard title="Organic Clicks" value="12,480" icon={MousePointerClick} note="+9.2% from last month" noteTone="up" />
      <StatCard title="Impressions" value="214K" icon={Eye} note="+14.8% from last month" noteTone="up" />
      <StatCard title="Avg. Position" value="14.3" icon={TrendingUp} note="-1.6 improved" noteTone="up" />
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Organic Traffic</CardTitle>
            <CardDescription>Clicks vs impressions, 28 days</CardDescription>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Clicks</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/50" />Impressions</span>
          </div>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 600 180" className="h-48 w-full" preserveAspectRatio="none">
            <g stroke="var(--border)" strokeWidth="1">
              <line x1="0" y1="45" x2="600" y2="45" />
              <line x1="0" y1="90" x2="600" y2="90" />
              <line x1="0" y1="135" x2="600" y2="135" />
            </g>
            <polyline fill="none" stroke="var(--muted-foreground)" strokeOpacity=".5" strokeWidth="2" points="0,120 50,110 100,115 150,95 200,100 250,80 300,85 350,65 400,70 450,50 500,55 550,35 600,40" />
            <polygon fill="var(--primary)" fillOpacity=".15" points="0,160 0,150 50,142 100,148 150,128 200,132 250,112 300,118 350,98 400,104 450,84 500,90 550,70 600,76 600,160" />
            <polyline fill="none" stroke="var(--primary)" strokeWidth="2.5" points="0,150 50,142 100,148 150,128 200,132 250,112 300,118 350,98 400,104 450,84 500,90 550,70 600,76" />
          </svg>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Indexing</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="mb-1 flex justify-between"><span>Indexed pages</span><b>412 / 438</b></div>
            <div className="h-1.5 overflow-hidden rounded bg-muted"><div className="h-full w-[94%] bg-emerald-500" /></div>
          </div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><CircleCheck className="h-4 w-4 text-emerald-500" />Valid</span><b>412</b></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><TriangleAlert className="h-4 w-4 text-amber-500" />Excluded</span><b>19</b></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><CircleX className="h-4 w-4 text-destructive" />Errors</span><b>7</b></div>
          <Link to="/blog/seo/sitemap" className={buttonVariants({ variant: 'outline', className: 'w-full' })}><Map />Manage sitemap</Link>
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Issues</CardTitle>
          <Link to="/blog/seo/audit" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>View all<ArrowRight /></Link>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          {seoIssues.map((issue) => (
            <div key={issue.id} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                {issue.tone === 'red' ? <CircleX className="h-4 w-4 text-destructive" /> : <TriangleAlert className="h-4 w-4 text-amber-500" />}
                {issue.label}
              </span>
              <ToneBadge tone={issue.tone}>{issue.count}</ToneBadge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Keywords</CardTitle>
          <Link to="/blog/seo/keywords" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>View all<ArrowRight /></Link>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Keyword</TableHead><TableHead className="text-right">Position</TableHead><TableHead className="text-right">Clicks</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {topKeywords.map((k) => (
              <TableRow key={k.keyword}>
                <TableCell>{k.keyword}</TableCell>
                <TableCell className="text-right"><ToneBadge tone={k.position <= 10 ? 'green' : 'amber'}>{k.position}</ToneBadge></TableCell>
                <TableCell className="text-right">{k.clicks.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  </div>
);

export default SeoOverview;
