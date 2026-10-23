import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Megaphone, RefreshCw } from 'lucide-react';
import { useCmsAssets } from '@/lib/use-cms-assets';
import SlotCard from '@/components/cms/SlotCard';

const BANNER_SLOTS = [
  { key: 'banner-main', label: 'Offer Banner (Desktop)', filename: 'banner-main.webp', recommendedSize: '1200x400' },
  { key: 'banner-top', label: 'Offer Banner (Mobile)', filename: 'banner-top.webp', recommendedSize: '1920x100' },
];

const VIDEO_SLOTS = [
  { key: 'promo-video', label: 'Promo Video (Desktop)', filename: 'promo-video.mp4', recommendedSize: '1080p / 720p MP4', type: 'video' },
  { key: 'promo-video-mobile', label: 'Promo Video (Mobile)', filename: 'promo-video-mobile.mp4', recommendedSize: '9:16 vertical MP4', type: 'video' },
];

const CmsOffersPage = () => {
  const cms = useCmsAssets();

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Megaphone className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Offers
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            Manage promotional banners and promo videos for your storefront.
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

      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Offer Banners</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Desktop and mobile promotional banners displayed on the storefront.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono font-medium">
              {BANNER_SLOTS.length} Slots
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {BANNER_SLOTS.map((slot) => (
              <SlotCard key={slot.key} slot={slot} currentAsset={cms.findAsset(slot)} cms={cms} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Promo Videos</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Desktop and mobile promotional videos with automated H.264 web compression.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono font-medium">
              {VIDEO_SLOTS.length} Slots
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {VIDEO_SLOTS.map((slot) => (
              <SlotCard key={slot.key} slot={slot} currentAsset={cms.findAsset(slot)} cms={cms} />
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={Boolean(cms.deleteTarget)}
        onOpenChange={(open) => { if (!open) cms.setDeleteTarget(null); }}
        title="Delete this asset?"
        description="This will permanently remove it from the server."
        isDeleting={cms.deleteMutation.isPending}
        onConfirm={() => { if (cms.deleteTarget) cms.deleteMutation.mutate(cms.deleteTarget); }}
      />
    </div>
  );
};

export default CmsOffersPage;
