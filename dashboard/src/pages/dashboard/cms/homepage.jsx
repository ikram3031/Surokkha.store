import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Home, RefreshCw, Plus, Info } from 'lucide-react';
import { useCmsAssets } from '@/lib/use-cms-assets';
import SlotCard from '@/components/cms/SlotCard';

const DEFAULT_SLIDER_SLOTS = [
  { key: 'slider-1', label: 'Slide 1', filename: 'slider-1.webp', recommendedSize: '1920x650' },
  { key: 'slider-2', label: 'Slide 2', filename: 'slider-2.webp', recommendedSize: '1920x650' },
  { key: 'slider-3', label: 'Slide 3', filename: 'slider-3.webp', recommendedSize: '1920x650' },
];

const CmsHomepagePage = () => {
  const cms = useCmsAssets();
  const [extraSliderCount, setExtraSliderCount] = useState(0);

  const dynamicSliders = useMemo(() => {
    const existingSliderAssets = cms.assets.filter((a) =>
      /^slider-\d+\.(webp|jpg|jpeg|png)$/i.test(a.filename)
    );

    const existingNumbers = new Set();
    existingSliderAssets.forEach((a) => {
      const match = a.filename.match(/^slider-(\d+)\./i);
      if (match) existingNumbers.add(parseInt(match[1], 10));
    });

    for (let i = 1; i <= 3; i++) existingNumbers.add(i);

    const maxExisting = Math.max(...existingNumbers, 3);
    const totalSlots = maxExisting + extraSliderCount;

    const slots = [];
    for (let i = 1; i <= totalSlots; i++) {
      slots.push({
        key: `slider-${i}`,
        label: `Slide ${i}`,
        filename: `slider-${i}.webp`,
        recommendedSize: '1920x650',
      });
    }
    return slots;
  }, [cms.assets, extraSliderCount]);

  const handleAddSlide = () => {
    setExtraSliderCount((prev) => prev + 1);
  };

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Home className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Homepage
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            Manage the hero slider carousel displayed on your storefront homepage.
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => cms.refetchAssets()}
          disabled={cms.isAssetsFetching}
          className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${cms.isAssetsFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">Dynamic Slider System</p>
          <p>
            3 default slides are always available. Add more slides as needed — each uploads as{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono text-primary">slider-N.webp</code>{' '}
            and your storefront picks them up automatically.
          </p>
        </div>
      </div>

      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Hero Slider Carousel</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Main sliding banner carousel displayed on homepage (Recommended: 1920x650 px)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-mono font-medium">
                {dynamicSliders.length} Slides
              </Badge>
              <Button
                size="sm" variant="outline"
                onClick={handleAddSlide}
                className="h-8 text-xs gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Slide
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dynamicSliders.map((slot) => (
              <SlotCard key={slot.key} slot={slot} currentAsset={cms.findAsset(slot)} cms={cms} />
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={Boolean(cms.deleteTarget)}
        onOpenChange={(open) => { if (!open) cms.setDeleteTarget(null); }}
        title="Delete this slide?"
        description="This will permanently remove the slide image from the server."
        isDeleting={cms.deleteMutation.isPending}
        onConfirm={() => { if (cms.deleteTarget) cms.deleteMutation.mutate(cms.deleteTarget); }}
      />
    </div>
  );
};

export default CmsHomepagePage;
