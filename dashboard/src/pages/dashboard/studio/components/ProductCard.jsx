import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  Trash2,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Split,
} from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { downloadDataUrl, resizeImageToCanvas } from '../utils/imageUtils';

export const ProductCard = ({
  item,
  globalPrompt,
  onUpdatePrompt,
  onAnalyze,
  onRerun,
  onDelete,
  onInspect,
}) => {
  const [showPromptEdit, setShowPromptEdit] = useState(false);
  const [isSliderActive, setIsSliderActive] = useState(true);

  const effectivePrompt = item.customPromptOverride || item.prompt || globalPrompt;

  // Handle single image download using arrow function
  const handleSingleDownload = async () => {
    if (!item.resultUrl) return;
    try {
      const finalUrl = await resizeImageToCanvas(
        item.resultUrl,
        item.targetWidth,
        item.targetHeight,
        item.fitMode,
        'image/png'
      );
      const filename = `${item.name.replace(/\s+/g, '_')}_${item.targetWidth}x${item.targetHeight}.png`;
      downloadDataUrl(finalUrl, filename);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-md hover:border-primary/40 transition-all">
      {/* Top Image Preview Frame */}
      <div className="relative aspect-square w-full overflow-hidden bg-black/40">
        {item.status === 'completed' && item.resultUrl ? (
          isSliderActive ? (
            <BeforeAfterSlider
              originalSrc={item.originalUrl}
              resultSrc={item.resultUrl}
              className="h-full w-full"
            />
          ) : (
            <img
              src={item.resultUrl}
              alt={item.name}
              className="h-full w-full object-contain"
            />
          )
        ) : (
          <img
            src={item.originalUrl}
            alt={item.name}
            className="h-full w-full object-contain"
          />
        )}

        {/* Processing State Overlay */}
        {item.status === 'processing' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs p-4 text-center">
            <div className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 border border-primary/40 text-primary">
              <Sparkles className="h-5 w-5 animate-spin" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Rendering AI Background...
            </span>
            <span className="mt-1 text-[10px] text-muted-foreground">
              Applying studio lighting & optics
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2 z-10">
          {item.status === 'completed' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 backdrop-blur-md">
              <CheckCircle2 className="h-3 w-3" />
              <span>Ready ({item.resultElapsedMs ? Math.round(item.resultElapsedMs / 1000) : 0}s)</span>
            </span>
          )}
          {item.status === 'error' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 border border-destructive/30 px-2 py-0.5 text-[10px] font-semibold text-destructive backdrop-blur-md">
              <AlertCircle className="h-3 w-3" />
              <span>Error</span>
            </span>
          )}
          {item.status === 'idle' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-md">
              <Clock className="h-3 w-3" />
              <span>Staged</span>
            </span>
          )}
        </div>

        {/* Top Right Quick Actions */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.status === 'completed' && item.resultUrl && (
            <>
              <button
                type="button"
                onClick={() => setIsSliderActive(!isSliderActive)}
                className="p-1.5 rounded-md bg-background/80 border border-border text-foreground hover:bg-background transition-colors"
                title={isSliderActive ? 'View result image' : 'View split slider'}
              >
                {isSliderActive ? <Eye className="h-3.5 w-3.5" /> : <Split className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => onInspect(item)}
                className="p-1.5 rounded-md bg-background/80 border border-border text-foreground hover:bg-background transition-colors"
                title="Inspect & Adjust"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-md bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30 transition-colors"
            title="Remove Item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Card Info & Prompt Footer */}
      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground truncate max-w-[160px]">
              {item.name}
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono">
              {item.targetWidth}×{item.targetHeight}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 italic">
            "{effectivePrompt}"
          </p>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => onRerun(item.id)}
            disabled={item.status === 'processing'}
            className="flex-1 py-1.5 px-2 text-[11px] font-medium rounded-md bg-muted hover:bg-muted/80 text-foreground transition-all flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Re-Generate</span>
          </button>

          {item.status === 'completed' && (
            <button
              type="button"
              onClick={handleSingleDownload}
              className="py-1.5 px-2 text-[11px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-1"
              title="Download Image"
            >
              <Download className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
