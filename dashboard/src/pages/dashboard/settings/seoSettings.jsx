import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Globe, Save, Sparkles, CheckCircle2, Eye, Share2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Manages global storefront Search Engine Optimization, OpenGraph metadata, and crawler indexing
const SEOSettingsPage = () => {
  const queryClient = useQueryClient();

  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [siteName, setSiteName] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [canonicalBaseUrl, setCanonicalBaseUrl] = useState('');
  const [robotsTxt, setRobotsTxt] = useState('');
  const [gscVerificationCode, setGscVerificationCode] = useState('');

  const { data: seoData, isLoading } = useQuery({
    queryKey: ['seo-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/settings/seo');
      return res.data?.data || {};
    },
  });

  useEffect(() => {
    if (seoData) {
      setMetaTitle(seoData.metaTitle || '');
      setMetaDescription(seoData.metaDescription || '');
      setKeywords(Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : (seoData.keywords || ''));
      setOgImage(seoData.ogImage || '');
      setSiteName(seoData.siteName || '');
      setTwitterHandle(seoData.twitterHandle || '');
      setCanonicalBaseUrl(seoData.canonicalBaseUrl || '');
      setRobotsTxt(seoData.robotsTxt || 'User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /api/');
      setGscVerificationCode(seoData.gscVerificationCode || '');
    }
  }, [seoData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
        ogImage: ogImage.trim(),
        siteName: siteName.trim(),
        twitterHandle: twitterHandle.trim(),
        canonicalBaseUrl: canonicalBaseUrl.trim(),
        robotsTxt: robotsTxt.trim(),
        gscVerificationCode: gscVerificationCode.trim(),
      };
      const res = await apiClient.put('/api/v1/settings/seo', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('SEO settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['seo-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save SEO settings');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const displayUrl = canonicalBaseUrl || 'https://yourstore.com';

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Search className="h-7 w-7 text-emerald-500" />
            Search Engine Optimization (SEO)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure default storefront meta tags, search snippets, social share previews, and crawler indexing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active Meta Headers
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Storefront Metadata</CardTitle>
                <CardDescription className="text-xs">
                  Primary title and description presented in search engine result pages (SERPs).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Default Meta Title</label>
                    <span className="text-[10px] text-muted-foreground">{metaTitle.length}/60 chars</span>
                  </div>
                  <Input
                    placeholder="e.g. Decantre | Premium Perfumes & Fragrances Bangladesh"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-[11px] text-muted-foreground">Recommended length: 50-60 characters.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Default Meta Description</label>
                    <span className="text-[10px] text-muted-foreground">{metaDescription.length}/160 chars</span>
                  </div>
                  <Textarea
                    rows={3}
                    placeholder="e.g. Explore authentic designer decants, luxury fragrances, and perfumes delivered nationwide across Bangladesh."
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-[11px] text-muted-foreground">Recommended length: 140-160 characters.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Focus Keywords (Comma separated)</label>
                  <Input
                    placeholder="e.g. perfume, fragrance, decant, bd perfume store"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Social Share & Indexing</CardTitle>
                <CardDescription className="text-xs">
                  Social graph cards and search engine crawler instructions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Site Name</label>
                    <Input
                      placeholder="e.g. Decantre"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Twitter / X Handle</label>
                    <Input
                      placeholder="e.g. @decantrebd"
                      value={twitterHandle}
                      onChange={(e) => setTwitterHandle(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Canonical Base URL</label>
                  <Input
                    placeholder="https://decantrebd.com"
                    value={canonicalBaseUrl}
                    onChange={(e) => setCanonicalBaseUrl(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">OpenGraph Social Share Image URL</label>
                  <Input
                    placeholder="https://server.decantrebd.com/uploads/assets/og_banner.webp"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Google Search Console Verification Code</label>
                  <Input
                    placeholder="e.g. google-site-verification=xxxxxx"
                    value={gscVerificationCode}
                    onChange={(e) => setGscVerificationCode(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Robots.txt Rules</label>
                  <Textarea
                    rows={3}
                    className="font-mono text-xs"
                    value={robotsTxt}
                    onChange={(e) => setRobotsTxt(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold"
              >
                <Save className="h-4 w-4" />
                <span>Save SEO Settings</span>
              </Button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Eye className="h-4 w-4 text-primary" />
                <span>Google Search Result Preview</span>
              </CardTitle>
              <CardDescription className="text-xs">
                How your storefront snippet appears in Google search queries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl border border-border/80 bg-background space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="truncate">{displayUrl}</span>
                </div>
                <h3 className="text-base text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer line-clamp-1">
                  {metaTitle || 'Your Store Name - Tagline Here'}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {metaDescription || 'Your store meta description will appear here as a helpful preview snippet for searching customers.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Share2 className="h-4 w-4 text-primary" />
                <span>Social Share Card Preview</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Preview of links shared on Facebook, WhatsApp, LinkedIn, or Twitter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border/80 overflow-hidden bg-card">
                <div className="aspect-16/9 bg-muted flex items-center justify-center overflow-hidden">
                  {ogImage ? (
                    <img src={ogImage} alt="OG Preview" className="h-full w-full object-cover" onError={(e) => (e.target.style.display = 'none')} />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                      <Globe className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-[11px]">1200 x 630 px Social Banner</span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-muted/30 border-t border-border/60 space-y-1">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wide">
                    {displayUrl.replace(/^https?:\/\//, '')}
                  </p>
                  <p className="text-xs font-bold text-foreground line-clamp-1">
                    {metaTitle || 'Your Store Name'}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {metaDescription || 'Social share description snippet.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SEOSettingsPage;
