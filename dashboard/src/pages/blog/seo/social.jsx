import { useEffect, useRef, useState } from 'react';
import { CodeXml, Save, Share2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, LoadingBlocks, NativeSelect, PageHeader, ToggleRow } from '@/components/dashboard/blog/blog-ui';
import { useSeoSettings, useUpdateSeoSettings, useUploadBlogImage } from '@/hooks/use-blog';
import { resolveImageUrl } from '@/lib/api-client';

// Open Graph, Twitter cards and JSON-LD defaults
const SeoSocial = () => {
  const { data, isLoading } = useSeoSettings();
  const save = useUpdateSeoSettings();
  const upload = useUploadBlogImage();
  const fileInput = useRef(null);
  const [social, setSocial] = useState(null);
  const [structured, setStructured] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setSocial(data.data.social);
      setStructured(data.data.structuredData);
    }
  }, [data]);

  if (isLoading || !social || !structured) return <LoadingBlocks rows={2} className="h-48" />;

  const setS = (key, value) => setSocial((s) => ({ ...s, [key]: value }));
  const setD = (key, value) => setStructured((d) => ({ ...d, [key]: value }));
  const onImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const response = await upload.mutateAsync(file);
    setS('defaultImage', response?.data?.url || '');
  };

  const jsonLd = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': structured.postType,
      headline: 'Your post title',
      author: { '@type': 'Person', name: 'Author name' },
      publisher: { '@type': 'Organization', name: structured.organizationName, ...(structured.logoUrl ? { logo: { '@type': 'ImageObject', url: structured.logoUrl } } : {}) },
      datePublished: new Date().toISOString().slice(0, 10),
    },
    null,
    2
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Social & Schema" description="Control how links look when shared and how search engines read your content.">
        <Button onClick={() => save.mutate({ social, structuredData: structured })} disabled={save.isPending}><Save />Save changes</Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" />Open Graph & Twitter</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ToggleRow title="Enable Open Graph tags" checked={social.ogEnabled !== false} onCheckedChange={(v) => setS('ogEnabled', v)} />
            <ToggleRow title="Enable Twitter cards" checked={social.twitterEnabled !== false} onCheckedChange={(v) => setS('twitterEnabled', v)} />
            <Field label="Default share image">
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onImage} />
              <div className="flex items-center gap-3">
                {social.defaultImage ? (
                  <img src={resolveImageUrl(social.defaultImage)} alt="" className="h-14 w-24 rounded-md object-cover" />
                ) : (
                  <div className="h-14 w-24 rounded-md bg-gradient-to-br from-primary/60 to-primary/20" />
                )}
                <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={upload.isPending}><Upload />{upload.isPending ? 'Uploading…' : social.defaultImage ? 'Replace' : 'Upload'}</Button>
              </div>
            </Field>
            <Field label="Twitter card type">
              <NativeSelect value={social.twitterCard} onChange={(e) => setS('twitterCard', e.target.value)}>
                <option value="summary_large_image">Summary with large image</option>
                <option value="summary">Summary</option>
              </NativeSelect>
            </Field>
            <Field label="Facebook App ID"><Input placeholder="Optional" value={social.facebookAppId} onChange={(e) => setS('facebookAppId', e.target.value)} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Share preview</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border bg-background">
              {social.defaultImage ? (
                <img src={resolveImageUrl(social.defaultImage)} alt="" className="aspect-[1.91/1] w-full object-cover" />
              ) : (
                <div className="aspect-[1.91/1] bg-gradient-to-br from-primary/70 to-primary/20" />
              )}
              <div className="space-y-0.5 p-3">
                <p className="text-[11px] uppercase text-muted-foreground">{structured.organizationName || 'yoursite.com'}</p>
                <p className="text-sm font-semibold">Your post title appears here</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">The meta description of the post is used as the preview text.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><CodeXml className="h-4 w-4 text-primary" />Structured Data (Schema.org)</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Field label="Organization name"><Input value={structured.organizationName} onChange={(e) => setD('organizationName', e.target.value)} /></Field>
              <Field label="Logo URL"><Input placeholder="https://…" value={structured.logoUrl} onChange={(e) => setD('logoUrl', e.target.value)} /></Field>
              <Field label="Default blog post type">
                <NativeSelect value={structured.postType} onChange={(e) => setD('postType', e.target.value)}>
                  <option>Article</option><option>BlogPosting</option><option>NewsArticle</option>
                </NativeSelect>
              </Field>
              <ToggleRow title="Breadcrumb schema" checked={structured.breadcrumbs !== false} onCheckedChange={(v) => setD('breadcrumbs', v)} />
              <ToggleRow title="Product & review schema" checked={structured.productSchema !== false} onCheckedChange={(v) => setD('productSchema', v)} />
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
