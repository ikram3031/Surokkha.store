import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Building2, RefreshCw } from 'lucide-react';
import { useCmsAssets } from '@/lib/use-cms-assets';
import SlotCard from '@/components/cms/SlotCard';
import { PageHeader } from '@/components/ui/page-header';

const BUSINESS_SLOTS = [
  { key: 'logo', label: 'Business Logo', filename: 'logo.webp', recommendedSize: '500x200' },
  { key: 'favicon', label: 'Site Icon (Favicon)', filename: 'favicon.ico', recommendedSize: '64x64' },
];

const CmsBusinessPage = () => {
  const cms = useCmsAssets();

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Business"
        icon={<Building2 />}
        description="Upload your business logo and site icon (favicon). These appear across your storefront and browser tabs."
        actions={
          <>
            <Button
          variant="outline" size="sm"
          onClick={() => cms.refetchAssets()}
          disabled={cms.isAssetsFetching}
          className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${cms.isAssetsFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
          </>
        }
      />

      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Brand Identity</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Store logo and browser favicon. Images are auto-compressed on upload.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono font-medium">
              {BUSINESS_SLOTS.length} Assets
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {BUSINESS_SLOTS.map((slot) => (
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

export default CmsBusinessPage;
