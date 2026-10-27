import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Image as ImageIcon, Save, UploadCloud, Loader2, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
import { toast } from 'sonner';

const buttonClass =
  'cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90';

// Home page sections whose background image can be set from here.
// The key is stored in the CMS item's `badge` field; the storefront looks sections up by it.
const SECTIONS = [
  { key: 'categories', label: 'Categories — "কী খুঁজছেন?"', hint: 'Behind the category boxes, right under the featured carousel.' },
  { key: 'hero', label: 'Home hero — main image', hint: 'The large rounded image on the right of the homepage hero (portrait works best, about 1200×1500 px).' },
  { key: 'care', label: 'Home — "Care without judgement" image', hint: 'The square image on the left of the Products / Delivery / Support tabs section.' },
  { key: 'login', label: 'Account page — login / sign up image', hint: 'Shown on the left of the customer login, sign up and forgot password page.' },
  { key: 'safe-use', label: 'Safe use — "নিরাপদ ব্যবহারের তিনটি কথা"', hint: 'Behind the three safe-use tips section.' },
];

const QUERY_KEY = (site) => ['cms-content', 'section-bg', 'home', site];

// Dashboard editor for homepage section background images (CMSContent type "section-bg")
const SectionBackgroundsPage = ({ site = 'store' }) => {
  const queryClient = useQueryClient();
  const fileInputRefs = useRef({});
  const [docId, setDocId] = useState(null);
  const [images, setImages] = useState({});
  const [uploadingKey, setUploadingKey] = useState(null);
  const [dirty, setDirty] = useState(false);

  const { data: doc, isLoading } = useQuery({
    queryKey: QUERY_KEY(site),
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/cms-content', { params: { type: 'section-bg', page: 'home', site } });
      return res.data?.data?.[0] || null;
    },
  });

  useEffect(() => {
    if (isLoading) return;
    setDocId(doc?._id || null);
    setImages(Object.fromEntries((doc?.items || []).map((item) => [item.badge, item.image || ''])));
    setDirty(false);
  }, [doc, isLoading]);

  const setImage = (key, path) => {
    setImages((prev) => ({ ...prev, [key]: path }));
    setDirty(true);
  };

  const handleUpload = async (e, key) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setUploadingKey(key);
    try {
      const formData = new FormData();
      // The section key names the saved file (e.g. categories.webp); fields must come before the file
      formData.append('name', key);
      formData.append('file', file);
      const res = await apiClient.post('/api/v1/cms-content/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImage(key, res.data?.data?.path || '');
      toast.success(`Saved as ${res.data?.data?.filename || key + '.webp'} — press Save to publish`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingKey(null);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: 'Home Section Backgrounds',
        page: 'home',
        site,
        type: 'section-bg',
        isActive: true,
        items: SECTIONS.map((s) => ({
          badge: s.key,
          image: images[s.key] || '',
          imageAlt: s.label,
          isActive: !!images[s.key],
        })),
      };
      const res = docId
        ? await apiClient.put(`/api/v1/cms-content/${docId}`, body)
        : await apiClient.post('/api/v1/cms-content', body);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Backgrounds saved');
      setDocId(res.data?._id || docId);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(site) });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save backgrounds'),
  });

  if (isLoading) {
    return (
      <div className="page-container flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Section Backgrounds</h1>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 bg-muted">
              {site === 'store' ? 'surokkha.store' : 'Shop'}
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            Set a background image for homepage sections. Sections without an image keep their plain colour.
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !dirty} className={`h-9 gap-1.5 ${buttonClass}`}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{dirty ? 'Save Changes' : 'Saved'}</span>
        </Button>
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p>
          Use a wide, high-resolution image (about 2400×1000 px or larger). The storefront lays a light veil over it so the
          text stays readable, so soft or light images work best. Images are converted to high-quality WebP on upload (max 10MB) and saved under the section name, e.g. categories.webp.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {SECTIONS.map((section) => {
          const image = images[section.key];
          return (
            <Card key={section.key} className="border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base">{section.label}</CardTitle>
                <CardDescription className="text-xs">{section.hint}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => (fileInputRefs.current[section.key] = el)}
                  onChange={(e) => handleUpload(e, section.key)}
                />
                <div
                  onClick={() => fileInputRefs.current[section.key]?.click()}
                  className="relative aspect-[16/7] rounded-xl border border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
                >
                  {uploadingKey === section.key ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : image ? (
                    <img src={resolveImageUrl(image)} alt={section.label} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-center p-4 text-muted-foreground">
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <p className="text-xs font-semibold">Click to upload</p>
                      <p className="text-[10px] mt-0.5">Wide image recommended · max 10MB</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className={`h-8 flex-1 gap-1 text-xs ${buttonClass}`} onClick={() => fileInputRefs.current[section.key]?.click()}>
                    <UploadCloud className="h-3.5 w-3.5" /> {image ? 'Replace' : 'Upload'}
                  </Button>
                  {image && (
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:text-destructive cursor-pointer" onClick={() => setImage(section.key, '')}>
                      Remove
                    </Button>
                  )}
                </div>
                {image && (
                  <p className="truncate text-[11px] text-muted-foreground">File: {image.split('?')[0].split('/').pop()}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SectionBackgroundsPage;
