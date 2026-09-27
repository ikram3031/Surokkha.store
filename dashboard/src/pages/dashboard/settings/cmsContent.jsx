import React, { useState, useRef, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import {
  FolderArchive,
  UploadCloud,
  Download,
  Copy,
  Trash2,
  RefreshCw,
  Check,
  Sliders,
  Info,
  Loader2,
  HardDrive,
  Video,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
import clientConfig from '@/clientConfig';
import { toast } from 'sonner';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;

const DEFAULT_ASSET_SECTIONS = [
  {
    id: 'hero-sliders',
    title: 'Hero Slider Carousel',
    description: 'Main sliding banner carousel displayed on homepage (Recommended: 1920x650 px, max 10MB, optimized to < 230KB)',
    slots: [
      { key: 'slider-1', label: 'Slide 1', filename: 'slider-1.webp', recommendedSize: '1920x650' },
      { key: 'slider-2', label: 'Slide 2', filename: 'slider-2.webp', recommendedSize: '1920x650' },
      { key: 'slider-3', label: 'Slide 3', filename: 'slider-3.webp', recommendedSize: '1920x650' },
    ],
  },
  {
    id: 'promo-video',
    title: 'Promotional Video',
    description: 'Featured storefront promo video with automated H.264 web compression (Max 100MB, MP4/WebM/MOV)',
    slots: [
      {
        key: 'promo-video',
        label: 'Promo Video',
        filename: 'promo-video.mp4',
        recommendedSize: '1080p / 720p MP4',
        type: 'video',
      },
    ],
  },
  {
    id: 'promo-banners',
    title: 'Promotional Banners',
    description: 'Featured marketing campaigns and promotional banners',
    slots: [
      { key: 'banner-main', label: 'Main Promo Banner', filename: 'banner-main.webp', recommendedSize: '1200x400' },
      { key: 'banner-top', label: 'Top Announcement Banner', filename: 'banner-top.webp', recommendedSize: '1920x100' },
    ],
  },
  {
    id: 'brand-identity',
    title: 'Brand & Identity',
    description: 'Store logo, dark logo, and browser favicon files',
    slots: [
      { key: 'logo', label: 'Dashboard Logo', filename: 'logo.webp', recommendedSize: '500x200' },
      { key: 'favicon', label: 'Favicon Icon', filename: 'favicon.ico', recommendedSize: '64x64' },
    ],
  },
];

// Resolves assets list from backend
const fetchAssetsList = async () => {
  const res = await apiClient.get('/api/v1/dash/assets');
  return res.data?.data || [];
};

// Formats byte count to readable string
const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Manages storefront CMS assets, banners, sliders, and logos with automated WebP compression
const CMSContentPage = () => {
  const queryClient = useQueryClient();
  const [copiedKey, setCopiedKey] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeUploadingSlot, setActiveUploadingSlot] = useState(null);
  const fileInputRefs = useRef({});

  const sections = useMemo(() => {
    return clientConfig?.assetsConfig?.sections || DEFAULT_ASSET_SECTIONS;
  }, []);

  const {
    data: assets = [],
    isLoading: isAssetsLoading,
    isFetching: isAssetsFetching,
    refetch: refetchAssets,
  } = useQuery({
    queryKey: ['dash-assets'],
    queryFn: fetchAssetsList,
    staleTime: 1000 * 60 * 2,
  });

  const assetsMap = useMemo(() => {
    const map = new Map();
    assets.forEach((a) => {
      map.set(a.filename.toLowerCase(), a);
      const withoutExt = a.filename.replace(/\.[^/.]+$/, '').toLowerCase();
      map.set(withoutExt, a);
    });
    return map;
  }, [assets]);

  const unslottedAssets = useMemo(() => {
    const slottedFilenames = new Set();
    sections.forEach((sec) => {
      sec.slots?.forEach((slot) => {
        slottedFilenames.add(slot.filename.toLowerCase());
        const withoutExt = slot.filename.replace(/\.[^/.]+$/, '').toLowerCase();
        slottedFilenames.add(withoutExt);
        if (slot.key === 'logo') {
          slottedFilenames.add('logo.webp');
          slottedFilenames.add('logo');
        }
        if (slot.key === 'favicon') {
          slottedFilenames.add('favicon.ico');
          slottedFilenames.add('favicon');
        }
      });
    });

    return assets.filter(
      (a) =>
        !slottedFilenames.has(a.filename.toLowerCase()) &&
        !slottedFilenames.has(a.filename.replace(/\.[^/.]+$/, '').toLowerCase())
    );
  }, [assets, sections]);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, targetFilename, slotKey }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFilename', targetFilename);
      if (slotKey) {
        formData.append('slotKey', slotKey);
      }

      const res = await apiClient.post('/api/v1/dash/assets/upload-slot', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (res, vars) => {
      toast.success(res.message || `Saved as ${vars.targetFilename}`);
      setActiveUploadingSlot(null);
      const isBranding =
        vars.targetFilename?.includes('logo') ||
        vars.targetFilename?.includes('favicon') ||
        vars.slotKey === 'logo' ||
        vars.slotKey === 'favicon';
      if (isBranding) {
        const newVer = Date.now();
        try {
          localStorage.setItem('brand_logo_version', String(newVer));
        } catch {}
        window.dispatchEvent(new CustomEvent('brand-logo-updated', { detail: { timestamp: newVer, slotKey: vars.slotKey } }));
      }
      queryClient.invalidateQueries({ queryKey: ['dash-assets'] });
    },
    onError: (err) => {
      setActiveUploadingSlot(null);
      const msg = err.response?.data?.message || 'Failed to upload asset. Please try again.';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (filename) => {
      const res = await apiClient.delete(`/api/v1/dash/assets/${encodeURIComponent(filename)}`);
      return res.data;
    },
    onSuccess: (_, filename) => {
      toast.success(`Asset "${filename}" deleted from server`);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['dash-assets'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to delete asset.';
      toast.error(msg);
    },
  });

  const handleSlotClick = (slotKey) => {
    if (fileInputRefs.current[slotKey]) {
      fileInputRefs.current[slotKey].click();
    }
  };

  const handleFileChange = (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideoSlot =
      slot.type === 'video' ||
      slot.filename?.endsWith('.mp4') ||
      slot.key?.includes('video');

    const maxLimit = isVideoSlot ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
    const limitLabel = isVideoSlot ? '100MB' : '10MB';

    if (file.size > maxLimit) {
      toast.error(
        `File size (${formatBytes(file.size)}) exceeds the maximum ${limitLabel} limit. Please select a file under ${limitLabel}.`
      );
      e.target.value = '';
      return;
    }

    setActiveUploadingSlot(slot.key);
    uploadMutation.mutate({
      file,
      targetFilename: slot.filename,
      slotKey: slot.key,
    });
    e.target.value = '';
  };

  const handleCopyUrl = (relativePath, key) => {
    const fullUrl = resolveImageUrl(relativePath);
    navigator.clipboard.writeText(fullUrl);
    setCopiedKey(key);
    toast.success('Asset URL copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (filename) => {
    const downloadUrl = resolveImageUrl(`/uploads/assets/${filename}`);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FolderArchive className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              CMS Content & Assets
            </h1>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 bg-muted">
              {clientConfig?.brandName || 'Store'} Assets
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            Manage storefront banners, hero slider carousel, and brand assets stored in{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">
              /uploads/assets
            </code>
            . Upload up to 5MB images with automatic lossless WebP compression to ~230KB keeping 100% full resolution.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchAssets()}
          disabled={isAssetsFetching}
          className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isAssetsFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">
            Zero-Code Frontend Synchronization
          </p>
          <p>
            When you upload or replace an image in any slot, it automatically saves to the server with the fixed slot filename. Your live storefront reflects the new asset instantly without needing any code changes or redeployments.
          </p>
        </div>
      </div>

      {sections.map((section) => (
        <Card key={section.id} className="border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  <span>{section.title}</span>
                </CardTitle>
                {section.description && (
                  <CardDescription className="text-xs mt-0.5">
                    {section.description}
                  </CardDescription>
                )}
              </div>
              <Badge variant="outline" className="text-[11px] font-mono font-medium">
                {section.slots?.length || 0} Slots Configured
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {section.slots?.map((slot) => {
                const targetName = slot.filename.toLowerCase();
                const withoutExt = targetName.replace(/\.[^/.]+$/, '');
                const currentAsset =
                  assetsMap.get(targetName) ||
                  assetsMap.get(withoutExt) ||
                  (slot.key === 'logo' ? assetsMap.get('logo.webp') || assetsMap.get('logo') : null) ||
                  (slot.key === 'favicon' ? assetsMap.get('favicon.ico') || assetsMap.get('favicon') : null);
                const isVideoSlot =
                  slot.type === 'video' ||
                  slot.filename?.endsWith('.mp4') ||
                  slot.key?.includes('video');
                const isVideoAsset =
                  currentAsset?.filename?.match(/\.(mp4|webm|mov)$/i);
                const isUploadingThisSlot =
                  uploadMutation.isPending && activeUploadingSlot === slot.key;

                return (
                  <div
                    key={slot.key}
                    className="flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <input
                      type="file"
                      ref={(el) => (fileInputRefs.current[slot.key] = el)}
                      accept={isVideoSlot ? "video/mp4,video/webm,video/quicktime,video/*" : "image/*,.ico"}
                      className="hidden"
                      onChange={(e) => handleFileChange(e, slot)}
                    />

                    <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-muted/30">
                      <div className="flex items-center gap-2">
                        {isVideoSlot && <Video className="h-4 w-4 text-primary shrink-0" />}
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{slot.label}</h4>
                          <p className="text-[11px] font-mono text-muted-foreground truncate">
                            {slot.filename}
                          </p>
                        </div>
                      </div>
                      {slot.recommendedSize && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground"
                        >
                          {slot.recommendedSize}
                        </Badge>
                      )}
                    </div>

                    <div className="relative aspect-16/9 bg-muted/40 flex items-center justify-center overflow-hidden border-b border-border/60 group">
                      {isUploadingThisSlot ? (
                        <div className="flex flex-col items-center justify-center p-4 text-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {isVideoSlot ? 'Compressing video (H.264 Web) & saving...' : 'Compressing to WebP (<230KB) & saving...'}
                          </span>
                        </div>
                      ) : isAssetsLoading ? (
                        <Skeleton className="h-full w-full" />
                      ) : currentAsset ? (
                        <>
                          {isVideoAsset ? (
                            <video
                              src={resolveImageUrl(currentAsset.url || currentAsset.relativePath)}
                              controls
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={resolveImageUrl(currentAsset.url || currentAsset.relativePath)}
                              alt={slot.label}
                              className={
                                slot.key === 'logo' || slot.filename?.includes('logo')
                                  ? "h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                                  : "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              }
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white pointer-events-none">
                            <span>{currentAsset.sizeFormatted || formatBytes(currentAsset.size)}</span>
                            <span className="text-emerald-400 font-semibold">Active</span>
                          </div>
                        </>
                      ) : (
                        <div
                          onClick={() => handleSlotClick(slot.key)}
                          className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-muted/70 transition-colors w-full h-full"
                        >
                          {isVideoSlot ? (
                            <Video className="h-8 w-8 text-muted-foreground/60 mb-2" />
                          ) : (
                            <UploadCloud className="h-8 w-8 text-muted-foreground/60 mb-2" />
                          )}
                          <p className="text-xs font-semibold text-foreground">
                            Click to upload {slot.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {isVideoSlot ? 'Max 100MB • Auto compresses with H.264' : 'Max 10MB • Compresses to <230KB WebP'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex items-center justify-between gap-1.5 bg-card mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSlotClick(slot.key)}
                        disabled={isUploadingThisSlot}
                        className="h-8 text-xs font-medium gap-1 flex-1 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>{currentAsset ? 'Replace' : 'Upload'}</span>
                      </Button>

                      {currentAsset && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCopyUrl(currentAsset.relativePath, slot.key)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Copy Public URL"
                          >
                            {copiedKey === slot.key ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDownload(currentAsset.filename)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Download Asset"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(currentAsset.filename)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {unslottedAssets.length > 0 && (
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <span>Other Server Assets</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Additional files found in /uploads/assets outside configured slot presets
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                {unslottedAssets.length} Files
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {unslottedAssets.map((asset) => (
                <div
                  key={asset.filename}
                  className="group rounded-lg border border-border overflow-hidden bg-card flex flex-col transition-all hover:border-primary/40"
                >
                  <div className="relative aspect-square bg-muted/30 overflow-hidden flex items-center justify-center">
                    {asset.filename.match(/\.(mp4|webm|mov)$/i) ? (
                      <video
                        src={resolveImageUrl(asset.url || asset.relativePath)}
                        className="h-full w-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={resolveImageUrl(asset.url || asset.relativePath)}
                        alt={asset.filename}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <div className="p-2 flex flex-col gap-1 border-t border-border">
                    <p className="text-[11px] font-mono font-medium truncate" title={asset.filename}>
                      {asset.filename}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {asset.sizeFormatted || formatBytes(asset.size)}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(asset.relativePath, asset.filename)}
                        className="text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(asset.filename)}
                        className="text-[11px] text-destructive hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Are you sure you want to delete this?"
        description="Deleting this will remove it from our server. You will not be able to retrieve it."
        isDeleting={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget);
          }
        }}
      />
    </div>
  );
};

export default CMSContentPage;
