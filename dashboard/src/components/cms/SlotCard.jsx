import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadCloud, Download, Copy, Trash2, Check, Loader2, Video } from 'lucide-react';
import { resolveImageUrl } from '@/lib/api-client';
import { formatBytes } from '@/lib/use-cms-assets';

const SlotCard = ({ slot, currentAsset, cms }) => {
  const isVideoSlot = slot.type === 'video' || slot.filename?.endsWith('.mp4') || slot.key?.includes('video');
  const isVideoAsset = currentAsset?.filename?.match(/\.(mp4|webm|mov)$/i);
  const isUploadingThisSlot = cms.uploadMutation.isPending && cms.activeUploadingSlot === slot.key;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-sm">
      <input
        type="file"
        ref={(el) => (cms.fileInputRefs.current[slot.key] = el)}
        accept={isVideoSlot ? "video/mp4,video/webm,video/quicktime,video/*" : "image/*,.ico"}
        className="hidden"
        onChange={(e) => cms.handleFileChange(e, slot)}
      />

      <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          {isVideoSlot && <Video className="h-4 w-4 text-primary shrink-0" />}
          <div>
            <h4 className="text-xs font-bold text-foreground">{slot.label}</h4>
            <p className="text-[11px] font-mono text-muted-foreground truncate">{slot.filename}</p>
          </div>
        </div>
        {slot.recommendedSize && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground">
            {slot.recommendedSize}
          </Badge>
        )}
      </div>

      <div className="relative aspect-16/9 bg-muted/40 flex items-center justify-center overflow-hidden border-b border-border/60 group">
        {isUploadingThisSlot ? (
          <div className="flex flex-col items-center justify-center p-4 text-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              {isVideoSlot ? 'Compressing video & saving...' : 'Compressing to WebP & saving...'}
            </span>
          </div>
        ) : cms.isAssetsLoading ? (
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
                  slot.key === 'logo' || slot.key === 'favicon' || slot.filename?.includes('logo')
                    ? "h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                    : "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                }
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white pointer-events-none">
              <span>{currentAsset.sizeFormatted || formatBytes(currentAsset.size)}</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
          </>
        ) : (
          <div
            onClick={() => cms.handleSlotClick(slot.key)}
            className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-muted/70 transition-colors w-full h-full"
          >
            {isVideoSlot ? (
              <Video className="h-8 w-8 text-muted-foreground/60 mb-2" />
            ) : (
              <UploadCloud className="h-8 w-8 text-muted-foreground/60 mb-2" />
            )}
            <p className="text-xs font-semibold text-foreground">Click to upload {slot.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isVideoSlot ? 'Max 100MB • Auto H.264 compression' : 'Max 10MB • Auto WebP compression'}
            </p>
          </div>
        )}
      </div>

      <div className="p-3 flex items-center justify-between gap-1.5 bg-card mt-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={() => cms.handleSlotClick(slot.key)}
          disabled={isUploadingThisSlot}
          className="h-8 text-xs font-medium gap-1 flex-1 cursor-pointer hover:bg-primary hover:text-primary-foreground"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span>{currentAsset ? 'Replace' : 'Upload'}</span>
        </Button>
        {currentAsset && (
          <>
            <Button
              size="icon" variant="ghost"
              onClick={() => cms.handleCopyUrl(currentAsset.relativePath, slot.key)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Copy URL"
            >
              {cms.copiedKey === slot.key ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="icon" variant="ghost"
              onClick={() => cms.handleDownload(currentAsset.filename)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon" variant="ghost"
              onClick={() => cms.setDeleteTarget(currentAsset.filename)}
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default SlotCard;
