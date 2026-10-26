import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import {
  GalleryHorizontal,
  Plus,
  Save,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  UploadCloud,
  Loader2,
  Info,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
import { toast } from 'sonner';

const buttonClass =
  'cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90';

const DEFAULT_SETTINGS = {
  autoplay: true,
  speedMs: 5000,
  transitionMs: 700,
  pauseOnHover: true,
  showArrows: true,
  showDots: true,
};

const newSlide = () => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  isActive: true,
  badge: '',
  titleDark: '',
  titleAccent: '',
  tagline: '',
  subtitle: '',
  chips: [],
  ctaLabel: 'Order Now',
  ctaLink: '',
  ctaNote: '',
  footnote: '',
  image: '',
  imageAlt: '',
});

// Converts a stored slide into editable form state
const toFormSlide = (item) => ({
  ...newSlide(),
  ...item,
  key: item._id || newSlide().key,
  tagline: Array.isArray(item.tagline) ? item.tagline.join(', ') : '',
  chips: Array.isArray(item.chips) ? item.chips : [],
});

// Converts form state back into the API payload
const toPayloadSlide = ({ key, tagline, ...rest }) => ({
  ...rest,
  _id: /^[0-9a-fA-F]{24}$/.test(key) ? key : undefined,
  tagline: tagline.split(',').map((s) => s.trim()).filter(Boolean),
});

const Field = ({ label, hint, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    <Label className="text-xs font-semibold">{label}</Label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

// Dashboard editor for the storefront hero slider (CMSContent type "slider")
const HeroSliderPage = ({ site = 'shop' }) => {
  const queryClient = useQueryClient();
  const fileInputRefs = useRef({});
  const [docId, setDocId] = useState(null);
  const [name, setName] = useState('Home Hero Slider');
  const [isActive, setIsActive] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [slides, setSlides] = useState([]);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [dirty, setDirty] = useState(false);

  const { data: doc, isLoading } = useQuery({
    queryKey: ['cms-content', 'slider', 'home', site],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/cms-content', { params: { type: 'slider', page: 'home', site } });
      return res.data?.data?.[0] || null;
    },
  });

  useEffect(() => {
    if (isLoading) return;
    if (doc) {
      setDocId(doc._id);
      setName(doc.name);
      setIsActive(doc.isActive !== false);
      setSettings({ ...DEFAULT_SETTINGS, ...(doc.settings || {}) });
      setSlides((doc.items || []).map(toFormSlide));
    } else {
      setSlides([newSlide()]);
    }
    setDirty(false);
  }, [doc, isLoading]);

  const markDirty = (fn) => (...args) => {
    setDirty(true);
    return fn(...args);
  };

  const updateSlide = markDirty((index, patch) =>
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  );
  const addSlide = markDirty(() => setSlides((prev) => [...prev, newSlide()]));
  const duplicateSlide = markDirty((index) =>
    setSlides((prev) => {
      const copy = { ...prev[index], key: newSlide().key };
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    })
  );
  const moveSlide = markDirty((index, dir) =>
    setSlides((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    })
  );
  const removeSlide = markDirty((index) => setSlides((prev) => prev.filter((_, i) => i !== index)));
  const updateSetting = markDirty((patch) => setSettings((prev) => ({ ...prev, ...patch })));

  const handleUpload = async (e, index) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    const slideKey = slides[index].key;
    setUploadingKey(slideKey);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/api/v1/cms-content/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateSlide(index, { image: res.data?.data?.path || '' });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingKey(null);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: name.trim() || 'Home Hero Slider',
        page: 'home',
        site,
        type: 'slider',
        isActive,
        settings,
        items: slides.map(toPayloadSlide),
      };
      const res = docId
        ? await apiClient.put(`/api/v1/cms-content/${docId}`, body)
        : await apiClient.post('/api/v1/cms-content', body);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Slider saved');
      setDocId(res.data?._id || docId);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['cms-content', 'slider', 'home', site] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save slider'),
  });

  const activeCount = slides.filter((s) => s.isActive).length;

  if (isLoading) {
    return (
      <div className="page-container flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <GalleryHorizontal className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Hero Slider</h1>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 bg-muted">
              {site === 'store' ? 'surokkha.store' : 'Shop'} · {activeCount}/{slides.length} active
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            Manage the homepage hero slides, their content and the autoplay speed. Changes go live as soon as you save.
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !dirty} className={`h-9 gap-1.5 ${buttonClass}`}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{dirty ? 'Save Changes' : 'Saved'}</span>
        </Button>
      </div>

      {!docId && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p>
            No slider is saved yet, so the storefront is showing its built-in default banners. Add your slides and save
            to take over the homepage hero.
          </p>
        </div>
      )}

      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-lg font-bold">Slider Settings</CardTitle>
          <CardDescription className="text-xs">Controls how the slider behaves on the storefront</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Slider name">
              <Input value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} />
            </Field>
            <Field label="Slide duration (seconds)" hint="How long each slide stays before moving on (1–60)">
              <Input
                type="number"
                min={1}
                max={60}
                step={0.5}
                value={settings.speedMs / 1000}
                onChange={(e) => updateSetting({ speedMs: Math.round(Number(e.target.value || 0) * 1000) })}
              />
            </Field>
            <Field label="Transition speed (ms)" hint="Slide animation time (100–5000)">
              <Input
                type="number"
                min={100}
                max={5000}
                step={100}
                value={settings.transitionMs}
                onChange={(e) => updateSetting({ transitionMs: Number(e.target.value || 0) })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              ['Slider enabled', isActive, (v) => { setIsActive(v); setDirty(true); }],
              ['Autoplay', settings.autoplay, (v) => updateSetting({ autoplay: v })],
              ['Pause on hover', settings.pauseOnHover, (v) => updateSetting({ pauseOnHover: v })],
              ['Show arrows', settings.showArrows, (v) => updateSetting({ showArrows: v })],
              ['Show dots', settings.showDots, (v) => updateSetting({ showDots: v })],
            ].map(([label, value, onChange]) => (
              <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                <Label className="text-xs font-semibold">{label}</Label>
                <Switch checked={Boolean(value)} onCheckedChange={onChange} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Slides ({slides.length})</h2>
          <Button onClick={addSlide} className={`h-9 gap-1.5 ${buttonClass}`}>
            <Plus className="h-4 w-4" />
            <span>Add Slide</span>
          </Button>
        </div>

        {slides.length === 0 && (
          <Card className="border border-dashed shadow-none">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No slides. The storefront will fall back to its default banners.
            </CardContent>
          </Card>
        )}

        {slides.map((slide, index) => (
          <Card key={slide.key} className={`border shadow-xs ${slide.isActive ? '' : 'opacity-70'}`}>
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="font-mono">#{index + 1}</Badge>
                  <CardTitle className="text-base font-bold truncate max-w-[16rem]">
                    {[slide.titleDark, slide.titleAccent].filter(Boolean).join(' ') || 'Untitled slide'}
                  </CardTitle>
                  {!slide.isActive && <Badge variant="outline" className="text-[10px]">Hidden</Badge>}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-2 mr-2">
                    <Label className="text-xs">Active</Label>
                    <Switch checked={slide.isActive} onCheckedChange={(v) => updateSlide(index, { isActive: v })} />
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 cursor-pointer" disabled={index === 0} onClick={() => moveSlide(index, -1)} title="Move up">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 cursor-pointer" disabled={index === slides.length - 1} onClick={() => moveSlide(index, 1)} title="Move down">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 cursor-pointer" onClick={() => duplicateSlide(index)} title="Duplicate">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer" onClick={() => setDeleteIndex(index)} title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6">
                <div className="space-y-4">
                  <Field label="Badge" hint="Small pill above the title, e.g. Best Value Combo">
                    <Input value={slide.badge} onChange={(e) => updateSlide(index, { badge: e.target.value })} />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Title (dark line)" hint="e.g. Ultimate">
                      <Input value={slide.titleDark} onChange={(e) => updateSlide(index, { titleDark: e.target.value })} />
                    </Field>
                    <Field label="Title (accent line)" hint="Shown in the accent colour, e.g. 3-in-1">
                      <Input value={slide.titleAccent} onChange={(e) => updateSlide(index, { titleAccent: e.target.value })} />
                    </Field>
                  </div>

                  <Field label="Tagline words" hint="Comma separated — shown spaced out with dots, e.g. Ultra Thin, Dotted, Ribbed">
                    <Input value={slide.tagline} onChange={(e) => updateSlide(index, { tagline: e.target.value })} />
                  </Field>

                  <Field label="Subtitle">
                    <Textarea rows={2} value={slide.subtitle} onChange={(e) => updateSlide(index, { subtitle: e.target.value })} />
                  </Field>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Chips</Label>
                      <Button
                        size="sm"
                        className={`h-7 gap-1 text-xs ${buttonClass}`}
                        onClick={() => updateSlide(index, { chips: [...slide.chips, { label: '', color: '#e05578' }] })}
                      >
                        <Plus className="h-3 w-3" /> Add chip
                      </Button>
                    </div>
                    {slide.chips.map((chip, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={chip.color || '#e05578'}
                          onChange={(e) =>
                            updateSlide(index, { chips: slide.chips.map((c, i) => (i === ci ? { ...c, color: e.target.value } : c)) })
                          }
                          className="h-8 w-10 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
                          title="Dot colour"
                        />
                        <Input
                          value={chip.label}
                          placeholder="e.g. 10 pcs Ultra Thin"
                          onChange={(e) =>
                            updateSlide(index, { chips: slide.chips.map((c, i) => (i === ci ? { ...c, label: e.target.value } : c)) })
                          }
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 cursor-pointer"
                          onClick={() => updateSlide(index, { chips: slide.chips.filter((_, i) => i !== ci) })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Button text">
                      <Input value={slide.ctaLabel} onChange={(e) => updateSlide(index, { ctaLabel: e.target.value })} />
                    </Field>
                    <Field label="Button link" hint="Product slug, “shop”, “combo”, or a full URL / path">
                      <Input value={slide.ctaLink} placeholder="mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo" onChange={(e) => updateSlide(index, { ctaLink: e.target.value })} />
                    </Field>
                    <Field label="Text beside button">
                      <Input value={slide.ctaNote} onChange={(e) => updateSlide(index, { ctaNote: e.target.value })} />
                    </Field>
                    <Field label="Footnote">
                      <Input value={slide.footnote} onChange={(e) => updateSlide(index, { footnote: e.target.value })} />
                    </Field>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold">Slide image</Label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => (fileInputRefs.current[slide.key] = el)}
                    onChange={(e) => handleUpload(e, index)}
                  />
                  <div
                    onClick={() => fileInputRefs.current[slide.key]?.click()}
                    className="relative aspect-square rounded-xl border border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
                  >
                    {uploadingKey === slide.key ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : slide.image ? (
                      <img src={resolveImageUrl(slide.image)} alt={slide.imageAlt || 'Slide'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-center p-4 text-muted-foreground">
                        <UploadCloud className="h-8 w-8 mb-2" />
                        <p className="text-xs font-semibold">Click to upload</p>
                        <p className="text-[10px] mt-0.5">Square image recommended · max 10MB</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className={`h-8 flex-1 gap-1 text-xs ${buttonClass}`} onClick={() => fileInputRefs.current[slide.key]?.click()}>
                      <UploadCloud className="h-3.5 w-3.5" /> {slide.image ? 'Replace' : 'Upload'}
                    </Button>
                    {slide.image && (
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:text-destructive cursor-pointer" onClick={() => updateSlide(index, { image: '' })}>
                        Remove
                      </Button>
                    )}
                  </div>
                  <Field label="Image URL" hint="Or paste an image path / URL">
                    <Input value={slide.image} onChange={(e) => updateSlide(index, { image: e.target.value })} />
                  </Field>
                  <Field label="Image alt text">
                    <Input value={slide.imageAlt} onChange={(e) => updateSlide(index, { imageAlt: e.target.value })} />
                  </Field>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={deleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteIndex(null);
        }}
        title="Delete this slide?"
        description="The slide is removed from the slider once you save your changes."
        onConfirm={() => {
          if (deleteIndex !== null) removeSlide(deleteIndex);
        }}
      />
    </div>
  );
};

export default HeroSliderPage;
