import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Download,
  RotateCcw,
  Maximize,
  Sliders,
  Split,
  Eye,
  Check,
} from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { resizeImageToCanvas, downloadDataUrl } from '../utils/imageUtils';

export const InspectModal = ({ item, onClose, onRerun, watermarkConfig }) => {
  const [customPrompt, setCustomPrompt] = useState(
    item.customPromptOverride || item.prompt || ''
  );
  const [fitMode, setFitMode] = useState(item.fitMode);
  const [targetWidth, setTargetWidth] = useState(item.targetWidth);
  const [targetHeight, setTargetHeight] = useState(item.targetHeight);
  const [format, setFormat] = useState('image/png');
  const [viewMode, setViewMode] = useState('slider');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [includeWatermark, setIncludeWatermark] = useState(watermarkConfig?.enabled ?? false);

  // Trigger background regeneration using arrow function
  const handleReGenerate = async () => {
    setIsProcessing(true);
    await onRerun(item.id, customPrompt);
    setIsProcessing(false);
  };

  // Export resized image with optional watermark using arrow function
  const handleExportResized = async () => {
    if (!item.resultUrl) return;
    setIsExporting(true);
    try {
      const activeWatermark = includeWatermark && watermarkConfig ? watermarkConfig : undefined;
      const resized = await resizeImageToCanvas(
        item.rawResultUrl || item.resultUrl,
        targetWidth,
        targetHeight,
        fitMode,
        format,
        0.95,
        activeWatermark
      );
      const extension = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';
      const filename = `${item.name.replace(/\s+/g, '_')}_${targetWidth}x${targetHeight}.${extension}`;
      downloadDataUrl(resized, filename);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">{item.name}</h2>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
              Source: {item.originalDimensions?.width || 1024}×{item.originalDimensions?.height || 1024} px
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg bg-muted p-1 border border-border">
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  viewMode === 'slider'
                    ? 'bg-background text-primary shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Split className="h-3.5 w-3.5" />
                <span>Split Comparison</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('result-only')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  viewMode === 'result-only'
                    ? 'bg-background text-primary shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Result Only</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Grid */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Preview Area */}
          <div className="lg:col-span-8 flex items-center justify-center p-6 bg-muted/10 overflow-auto">
            {viewMode === 'slider' && item.resultUrl && (
              <BeforeAfterSlider
                originalSrc={item.originalUrl}
                resultSrc={item.resultUrl}
                originalLabel="Original Photo"
                resultLabel="Studio AI Output"
                className="max-h-[60vh] w-full max-w-xl shadow-xl"
              />
            )}

            {viewMode === 'result-only' && item.resultUrl && (
              <div className="relative max-h-[60vh] w-full max-w-xl overflow-hidden rounded-xl border border-border bg-black/40 shadow-xl flex items-center justify-center">
                <img
                  src={item.resultUrl}
                  alt="Transformed Result"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>
            )}
          </div>

          {/* Right Inspector Controls Sidebar */}
          <div className="lg:col-span-4 flex flex-col justify-between border-l border-border bg-card p-6 overflow-y-auto space-y-6">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  <span>Prompt Override</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customize scene prompt specifically for this product
                </p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg bg-background border border-border p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Enter detailed prompt..."
                />
                <button
                  type="button"
                  onClick={handleReGenerate}
                  disabled={isProcessing}
                  className="mt-2 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>Re-Generate Background</span>
                </button>
              </div>

              {/* Dimension & Fit Options */}
              <div className="space-y-3 pt-3 border-t border-border">
                <h4 className="text-xs font-semibold text-foreground">Export Dimensions & Framing</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Target Width</label>
                    <input
                      type="number"
                      value={targetWidth}
                      onChange={(e) => setTargetWidth(Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 rounded bg-background border border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Target Height</label>
                    <input
                      type="number"
                      value={targetHeight}
                      onChange={(e) => setTargetHeight(Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 rounded bg-background border border-border text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Fit Mode</label>
                  <select
                    value={fitMode}
                    onChange={(e) => setFitMode(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded bg-background border border-border text-foreground"
                  >
                    <option value="contain">Contain (Keep aspect ratio)</option>
                    <option value="cover">Cover (Crop to fill)</option>
                    <option value="smart-fill">Smart Studio Fill</option>
                    <option value="blur-extend">Blur Background Extend</option>
                  </select>
                </div>
              </div>

              {/* Watermark Checkbox */}
              {watermarkConfig?.enabled && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="include-watermark"
                    checked={includeWatermark}
                    onChange={(e) => setIncludeWatermark(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="include-watermark" className="text-xs text-foreground cursor-pointer">
                    Apply PNG Logo Watermark on Export
                  </label>
                </div>
              )}
            </div>

            {/* Bottom Export Action */}
            <div className="pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleExportResized}
                disabled={isExporting || !item.resultUrl}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>Export High-Res Image ({targetWidth}×{targetHeight})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
