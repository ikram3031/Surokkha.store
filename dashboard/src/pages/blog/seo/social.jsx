import { useState } from 'react';
import { CodeXml, Save, Share2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, NativeSelect, PageHeader, ToggleRow } from '@/components/dashboard/blog/blog-ui';

// Open Graph, Twitter cards and JSON-LD defaults
const SeoSocial = () => {
  const [og, setOg] = useState(true);
  const [twitter, setTwitter] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState(true);
  const [productSchema, setProductSchema] = useState(true);
  const [orgName, setOrgName] = useState('Surokkha');
  const [postType, setPostType] = useState('BlogPosting');

  const jsonLd = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': postType,
      headline: 'How to choose your signature attar',
      author: { '@type': 'Person', name: 'Rafi' },
      publisher: { '@type': 'Organization', name: orgName },
      datePublished: '2026-10-28',
    },
    null,
    2
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Social & Schema" description="Control how links look when shared and how search engines read your content.">
        <Button><Save />Save changes</Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" />Open Graph & Twitter</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ToggleRow title="Enable Open Graph tags" checked={og} onCheckedChange={setOg} />
            <ToggleRow title="Enable Twitter cards" checked={twitter} onCheckedChange={setTwitter} />
            <Field label="Default share image">
              <div className="flex items-center gap-3">
                <div className="h-14 w-24 rounded-md bg-gradient-to-br from-primary/60 to-primary/20" />
                <Button variant="outline"><Upload />Replace</Button>
              </div>
            </Field>
            <Field label="Twitter card type">
              <NativeSelect><option>Summary with large image</option><option>Summary</option></NativeSelect>
            </Field>
            <Field label="Facebook App ID"><Input placeholder="Optional" /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Share preview</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border bg-background">
              <div className="aspect-[1.91/1] bg-gradient-to-br from-primary/70 to-primary/20" />
              <div className="space-y-0.5 p-3">
                <p className="text-[11px] uppercase text-muted-foreground">surokkha.store</p>
                <p className="text-sm font-semibold">How to Choose Your Signature Attar</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">Learn how to pick an attar that matches your skin and style.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><CodeXml className="h-4 w-4 text-primary" />Structured Data (Schema.org)</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Field label="Organization name"><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} /></Field>
              <Field label="Logo URL"><Input placeholder="https://…" /></Field>
              <Field label="Default blog post type">
                <NativeSelect value={postType} onChange={(e) => setPostType(e.target.value)}>
                  <option>Article</option><option>BlogPosting</option><option>NewsArticle</option>
                </NativeSelect>
              </Field>
              <ToggleRow title="Breadcrumb schema" checked={breadcrumbs} onCheckedChange={setBreadcrumbs} />
              <ToggleRow title="Product & review schema" checked={productSchema} onCheckedChange={setProductSchema} />
            </div>
            <Field label="JSON-LD preview">
              <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-[11px] leading-relaxed">{jsonLd}</pre>
            </Field>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeoSocial;
