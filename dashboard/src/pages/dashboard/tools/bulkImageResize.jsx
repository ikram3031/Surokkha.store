import React, { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import {
  Upload,
  Image as ImageIcon,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  FileArchive,
  ArrowRight,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const PRESETS = [
  {
    id: 'product-main',
    name: 'Product Main (1200×1200)',
    width: 1200,
    height: 1200,
    format: 'image/webp',
    ext: 'webp',
    quality: 0.9,
    fit: 'scale-max',
    desc: 'Recommended for e-commerce main catalog images.',
  },
  {
    id: 'product-thumb',
    name: 'Product Thumb (600×600)',
    width: 600,
    height: 600,
    format: 'image/webp',
    ext: 'webp',
    quality: 0.9,
    fit: 'scale-max',
    desc: 'Optimized for high-speed product grid & cards.',
  },
  {
    id: 'hd-square',
    name: 'Square HD (1080×1080)',
    width: 1080,
    height: 1080,
    format: 'image/webp',
    ext: 'webp',
    quality: 0.88,
    fit: 'scale-max',
    desc: 'Standard HD square format for social and web.',
  },
  {
    id: 'banner-hd',
    name: 'Banner (1920×1080)',
    width: 1920,
    height: 1080,
    format: 'image/webp',
    ext: 'webp',
    quality: 0.85,
    fit: 'scale-max',
    desc: 'Wide HD hero banners and sliders.',
  },
  {
    id: 'custom',
    name: 'Custom Dimensions',
    width: 800,
    height: 800,
    format: 'image/webp',
    ext: 'webp',
    quality: 0.9,
    fit: 'scale-max',
    desc: 'Set your own custom width, height, and format.',
  },
];

export default function BulkImageResize() {
  const [files, setFiles] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('product-main');
  const [targetWidth, setTargetWidth] = useState(1200);
  const [targetHeight, setTargetHeight] = useState(1200);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [aspectRatioValue, setAspectRatioValue] = useState(1);
  const [format, setFormat] = useState('image/webp');
  const [quality, setQuality] = useState(90);
  const [fitMode, setFitMode] = useState('scale-max');
  const [filePrefix, setFilePrefix] = useState('');
  const [fileSuffix, setFileSuffix] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isZipping, setIsZipping] = useState(false);

  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset && preset.id !== 'custom') {
      setTargetWidth(preset.width);
      setTargetHeight(preset.height);
      setFormat(preset.format);
      setQuality(Math.round(preset.quality * 100));
      setFitMode(preset.fit);
      setAspectRatioValue(preset.width / preset.height);
    }
  };

  const handleWidthChange = (val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setTargetWidth(num);
    if (keepAspectRatio && aspectRatioValue) {
      setTargetHeight(Math.round(num / aspectRatioValue));
    }
    setSelectedPreset('custom');
  };

  const handleHeightChange = (val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setTargetHeight(num);
    if (keepAspectRatio && aspectRatioValue) {
      setTargetWidth(Math.round(num * aspectRatioValue));
    }
    setSelectedPreset('custom');
  };

  const handleFilesAdded = useCallback((fileList) => {
    const validImages = Array.from(fileList).filter((f) =>
      f.type.startsWith('image/')
    );

    if (validImages.length === 0) {
      toast.error('Please upload valid image files (JPG, PNG, WebP, etc.).');
      return;
    }

    const newItems = validImages.map((file) => {
      const id = Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      const previewUrl = URL.createObjectURL(file);

      // Read dimensions
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        setFiles((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, originalWidth: img.naturalWidth, originalHeight: img.naturalHeight }
              : item
          )
        );
      };

      return {
        id,
        file,
        name: file.name,
        originalSize: file.size,
        originalWidth: 0,
        originalHeight: 0,
        previewUrl,
        processedBlob: null,
        processedUrl: null,
        processedSize: 0,
        processedWidth: 0,
        processedHeight: 0,
        status: 'pending', // 'pending' | 'processing' | 'done' | 'error'
      };
    });

    setFiles((prev) => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} image(s) to queue.`);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const removeFile = (id) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item?.processedUrl) URL.revokeObjectURL(item.processedUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAllFiles = () => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      if (f.processedUrl) URL.revokeObjectURL(f.processedUrl);
    });
    setFiles([]);
    setProgress(0);
  };

  // Canvas-based client-side image resizing
  const resizeSingleImage = (item) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;

        let drawW = targetWidth;
        let drawH = targetHeight;
        let canvasW = targetWidth;
        let canvasH = targetHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (fitMode === 'scale-max') {
          // Scale down while maintaining aspect ratio, bounds capped at targetWidth/targetHeight
          const ratio = Math.min(targetWidth / srcW, targetHeight / srcH, 1);
          canvasW = Math.round(srcW * ratio);
          canvasH = Math.round(srcH * ratio);
          drawW = canvasW;
          drawH = canvasH;
        } else if (fitMode === 'cover') {
          // Crop to fill exact dimensions
          const ratio = Math.max(targetWidth / srcW, targetHeight / srcH);
          drawW = Math.round(srcW * ratio);
          drawH = Math.round(srcH * ratio);
          offsetX = Math.round((targetWidth - drawW) / 2);
          offsetY = Math.round((targetHeight - drawH) / 2);
        } else if (fitMode === 'contain') {
          // Fit inside target box with padding
          const ratio = Math.min(targetWidth / srcW, targetHeight / srcH);
          drawW = Math.round(srcW * ratio);
          drawH = Math.round(srcH * ratio);
          offsetX = Math.round((targetWidth - drawW) / 2);
          offsetY = Math.round((targetHeight - drawH) / 2);
        }

        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d', { alpha: true });

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill transparent or white for JPEG
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasW, canvasH);
        }

        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            const processedUrl = URL.createObjectURL(blob);
            resolve({
              blob,
              processedUrl,
              processedSize: blob.size,
              processedWidth: canvasW,
              processedHeight: canvasH,
            });
          },
          format,
          quality / 100
        );
      };
      img.onerror = () => reject(new Error('Image failed to load in canvas'));
      img.src = item.previewUrl;
    });
  };

  const processAllImages = async () => {
    if (files.length === 0) {
      toast.error('Please add images to resize first.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    let completed = 0;
    const updated = [...files];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      try {
        const result = await resizeSingleImage(item);
        updated[i] = {
          ...item,
          ...result,
          processedBlob: result.blob,
          status: 'done',
        };
      } catch (err) {
        console.error(err);
        updated[i] = { ...item, status: 'error' };
      }
      completed++;
      setProgress(Math.round((completed / updated.length) * 100));
      setFiles([...updated]);
    }

    setIsProcessing(false);
    toast.success(`Successfully resized ${completed} image(s)!`);
  };

  const getOutputFilename = (originalName) => {
    const lastDot = originalName.lastIndexOf('.');
    const base = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
    const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
    return `${filePrefix}${base}${fileSuffix}.${ext}`;
  };

  const downloadSingle = (item) => {
    if (!item.processedUrl) return;
    const filename = getOutputFilename(item.name);
    const a = document.createElement('a');
    a.href = item.processedUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllZip = async () => {
    const readyItems = files.filter((f) => f.processedBlob && f.status === 'done');
    if (readyItems.length === 0) {
      toast.error('No processed images ready to download.');
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      readyItems.forEach((item) => {
        const filename = getOutputFilename(item.name);
        zip.file(filename, item.processedBlob);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resized_images_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('ZIP package downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  const totalOriginalSize = files.reduce((acc, f) => acc + (f.originalSize || 0), 0);
  const totalProcessedSize = files.reduce((acc, f) => acc + (f.processedSize || 0), 0);
  const totalSavings =
    totalOriginalSize > 0 && totalProcessedSize > 0
      ? Math.round(((totalOriginalSize - totalProcessedSize) / totalOriginalSize) * 100)
      : 0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Bulk Image Resize</h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Client-Side (0% Bandwidth)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Resize, compress, and convert product images locally in your browser with ultra-fast canvas processing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {files.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFiles}
                disabled={isProcessing}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear Queue
              </Button>
              <Button
                size="sm"
                onClick={processAllImages}
                disabled={isProcessing}
                className="shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Resizing...' : 'Process All'}
              </Button>
              {files.some((f) => f.status === 'done') && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={downloadAllZip}
                  disabled={isZipping}
                  className="shadow-sm font-medium"
                >
                  <FileArchive className="h-4 w-4 mr-1.5 text-primary" />
                  {isZipping ? 'Zipping...' : 'Download ZIP'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preset Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Resize Presets</h3>
              </div>
              <span className="text-xs text-muted-foreground">Select a standard format</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`text-left p-3.5 rounded-lg border transition-all ${
                    selectedPreset === preset.id
                      ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40 bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-foreground">{preset.name}</span>
                    {preset.id !== 'custom' && (
                      <span className="text-[11px] font-mono text-primary font-semibold">
                        {preset.ext.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                    {preset.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Dimension Inputs */}
            <div className="pt-2 border-t grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Width (px)
                </label>
                <Input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="h-8 text-xs font-mono"
                  min="1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Height (px)
                </label>
                <Input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="h-8 text-xs font-mono"
                  min="1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary outline-hidden"
                >
                  <option value="image/webp">WebP (Best)</option>
                  <option value="image/jpeg">JPEG (.jpg)</option>
                  <option value="image/png">PNG (.png)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-foreground">Quality</label>
                  <span className="text-[11px] font-mono text-muted-foreground">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Fit Mode & Naming */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Fit Mode</label>
                <select
                  value={fitMode}
                  onChange={(e) => setFitMode(e.target.value)}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary outline-hidden"
                >
                  <option value="scale-max">Scale Max (Maintain Ratio)</option>
                  <option value="cover">Cover (Crop to fill)</option>
                  <option value="contain">Contain (Fit inside box)</option>
                  <option value="exact">Exact (Stretch)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Prefix</label>
                <Input
                  placeholder="e.g. product_"
                  value={filePrefix}
                  onChange={(e) => setFilePrefix(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Suffix</label>
                <Input
                  placeholder="e.g. _thumb"
                  value={fileSuffix}
                  onChange={(e) => setFileSuffix(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Compression & Storage Summary */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-xs space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Batch Summary</h3>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Queued Files</span>
                  <span className="font-semibold">{files.length} items</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Original Total Size</span>
                  <span className="font-mono">{formatFileSize(totalOriginalSize)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Resized Total Size</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {totalProcessedSize > 0 ? formatFileSize(totalProcessedSize) : '—'}
                  </span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t">
                    <span className="text-muted-foreground">Bandwidth & Space Saved</span>
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-mono">
                      -{totalSavings}% Saved
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-muted/40 border text-[11px] text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground">💡 100% Client-Side Engine</p>
              <p>
                Images are converted directly on your computer using WebP/Canvas. No files are transmitted across the network, saving 100% server bandwidth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border hover:border-primary/60 bg-card hover:bg-muted/20 transition-all rounded-xl p-8 text-center cursor-pointer group"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesAdded(e.target.files);
            }
          }}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3.5 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <Upload className="h-6 w-6" />
          </div>
          <h4 className="font-semibold text-sm text-foreground">
            Drop your images here, or <span className="text-primary underline">browse</span>
          </h4>
          <p className="text-xs text-muted-foreground">
            Supports PNG, JPG, JPEG, WEBP, AVIF, GIF (Multi-selection & batch supported)
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="space-y-1.5 p-4 rounded-xl border bg-card">
          <div className="flex justify-between text-xs font-medium">
            <span>Processing batch images locally...</span>
            <span className="font-mono text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* File Queue List */}
      {files.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="font-semibold text-xs text-foreground">
                Image Queue ({files.length})
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {files.filter((f) => f.status === 'done').length} of {files.length} processed
            </span>
          </div>

          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {files.map((item) => (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                {/* Thumbnail & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-md border bg-muted/30 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={item.processedUrl || item.previewUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-xs text-foreground truncate max-w-[240px] sm:max-w-[320px]">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span>{formatFileSize(item.originalSize)}</span>
                      {item.originalWidth > 0 && (
                        <span>
                          • {item.originalWidth}×{item.originalHeight}px
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Processed Details */}
                <div className="flex items-center gap-3 shrink-0">
                  {item.status === 'done' ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right flex flex-col">
                        <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatFileSize(item.processedSize)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {item.processedWidth}×{item.processedHeight}px
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSingle(item)}
                        className="h-8 px-2.5 text-xs shadow-2xs"
                        title="Download resized image"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : item.status === 'processing' ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                      Processing...
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Pending
                    </Badge>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(item.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    title="Remove from queue"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
