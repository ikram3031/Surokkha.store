import React, { useState, useEffect, useRef } from 'react';
import { FlowControlPanel } from './components/FlowControlPanel';
import { DropzoneAndQueue } from './components/DropzoneAndQueue';
import { BulkGeneratorTab } from './components/BulkGeneratorTab';
import { InspectModal } from './components/InspectModal';
import { STYLE_PRESETS } from './data/presets';
import { SAMPLE_PRODUCTS } from './data/sampleProducts';
import { clientConfig } from '@/clientConfig';
import {
  fileToDataUrl,
  getImageDimensions,
  resizeImageToCanvas,
  exportBulkZip,
} from './utils/imageUtils';
import {
  Sparkles,
  Layers,
  Cpu,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function BatchImagesStudio() {
  const [hasKey, setHasKey] = useState(true);
  const [activeTab, setActiveTab] = useState('bulk-editor');
  const [items, setItems] = useState([]);
  const [inspectedItem, setInspectedItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [toast, setToast] = useState(null);

  const abortControllerRef = useRef(false);

  // Master Batch Settings State
  const [settings, setSettings] = useState({
    globalPrompt:
      'Place the product on a minimal matte black marble pedestal with sharp volumetric side lighting. Background should be deep charcoal with a slight atmospheric haze. 8k resolution, studio quality.',
    selectedPresetId: 'marble-podium',
    aspectRatio: '1:1',
    selectedSizePresetId: 'instagram-square',
    customWidth: 1080,
    customHeight: 1080,
    fitMode: 'contain',
    model: 'gemini-3.1-flash-lite-image',
    imageSize: '1K',
    exportFormat: 'image/png',
    jpegQuality: 0.92,
    concurrency: 2,
    watermark: {
      enabled: false,
      type: 'logo',
      logoUrl: clientConfig?.logoUrl || '/src/uploads/logo.webp',
      logoName: `${clientConfig?.brandName || 'Client'} PNG Logo`,
      opacity: 0.75,
      position: 'bottom-right',
      fontSize: 22,
      color: '#ffffff',
      margin: 24,
    },
  });

  // Check backend studio health on mount using arrow function
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const res = await fetch('/api/v1/studio/health', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.hasKey !== undefined) {
          setHasKey(data.hasKey);
        }
      } catch (err) {
        console.warn('Backend studio health check warning:', err);
      }
    };
    checkHealth();
  }, []);

  // Display user feedback toast message using arrow function
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Update Settings handler using arrow function
  const handleUpdateSettings = (newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };

      if (
        newSettings.aspectRatio !== undefined ||
        newSettings.customWidth !== undefined ||
        newSettings.customHeight !== undefined ||
        newSettings.fitMode !== undefined
      ) {
        setItems((current) =>
          current.map((item) => {
            if (item.status === 'idle') {
              return {
                ...item,
                aspectRatio: updated.aspectRatio,
                targetWidth: updated.customWidth,
                targetHeight: updated.customHeight,
                fitMode: updated.fitMode,
              };
            }
            return item;
          })
        );
      }

      return updated;
    });
  };

  // Apply curated style preset using arrow function
  const handleApplyPreset = (presetId) => {
    const preset = STYLE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      handleUpdateSettings({
        selectedPresetId: presetId,
        globalPrompt: preset.promptModifier,
      });
      showToast(`Applied preset: ${preset.name}`, 'info');
    }
  };

  // AI Prompt Enhancer request handler using arrow function
  const handleEnhancePrompt = async () => {
    if (!settings.globalPrompt.trim() || isEnhancing) return;
    try {
      setIsEnhancing(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/studio/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          basePrompt: settings.globalPrompt,
          styleCategory: settings.selectedPresetId,
        }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        handleUpdateSettings({ globalPrompt: data.enhancedPrompt });
        showToast('Prompt enhanced with studio lighting & material optics!', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to enhance prompt: ' + e.message, 'error');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Load sample product items using arrow function
  const handleLoadSamples = () => {
    const sampleItems = SAMPLE_PRODUCTS.map((sp, idx) => ({
      id: 'sample-' + Date.now() + '-' + idx,
      name: sp.name,
      originalUrl: sp.dataUrl,
      originalBase64: sp.dataUrl,
      mimeType: 'image/svg+xml',
      originalDimensions: sp.dimensions,
      prompt: sp.defaultPrompt,
      aspectRatio: settings.aspectRatio,
      targetWidth: settings.customWidth,
      targetHeight: settings.customHeight,
      fitMode: settings.fitMode,
      status: 'idle',
      progress: 0,
    }));

    setItems((prev) => [...prev, ...sampleItems]);
    showToast('Loaded 5 demo e-commerce product samples!', 'success');
  };

  // Process uploaded files using arrow function
  const handleFilesAdded = async (files) => {
    const fileArray = Array.from(files);
    const newItems = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const dataUrl = await fileToDataUrl(file);
        const dimensions = await getImageDimensions(dataUrl);

        newItems.push({
          id: 'prod-' + Date.now() + '-' + i + '-' + Math.random().toString(36).substr(2, 4),
          name: file.name.replace(/\.[^/.]+$/, ''),
          originalUrl: dataUrl,
          originalBase64: dataUrl,
          mimeType: file.type || 'image/jpeg',
          originalDimensions: dimensions,
          prompt: settings.globalPrompt,
          aspectRatio: settings.aspectRatio,
          targetWidth: settings.customWidth,
          targetHeight: settings.customHeight,
          fitMode: settings.fitMode,
          status: 'idle',
          progress: 0,
        });
      } catch (err) {
        console.error('Error reading file:', file.name, err);
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      showToast(`Added ${newItems.length} product images to staging queue`, 'info');
    }
  };

  // Transfer image from generator to editor using arrow function
  const handleTransferToEditor = (imageUrl, name, promptText) => {
    const newItem = {
      id: 'transfer-' + Date.now(),
      name,
      originalUrl: imageUrl,
      originalBase64: imageUrl,
      mimeType: 'image/png',
      originalDimensions: { width: 1024, height: 1024 },
      prompt: promptText || settings.globalPrompt,
      aspectRatio: settings.aspectRatio,
      targetWidth: settings.customWidth,
      targetHeight: settings.customHeight,
      fitMode: settings.fitMode,
      status: 'idle',
      progress: 0,
    };

    setItems((prev) => [newItem, ...prev]);
    setActiveTab('bulk-editor');
    showToast(`Added "${name}" to bulk staging queue!`, 'success');
  };

  // Transform a single product item using arrow function
  const processSingleItem = async (item) => {
    if (abortControllerRef.current) return;

    setItems((current) =>
      current.map((it) => (it.id === item.id ? { ...it, status: 'processing', progress: 30 } : it))
    );

    const effectivePrompt = item.customPromptOverride || item.prompt || settings.globalPrompt;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/studio/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          imageBase64: item.originalBase64,
          mimeType: item.mimeType,
          prompt: effectivePrompt,
          aspectRatio: item.aspectRatio,
          imageSize: settings.imageSize,
          model: settings.model,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to transform product image.');
      }

      const formattedResultUrl = await resizeImageToCanvas(
        data.imageUrl,
        item.targetWidth,
        item.targetHeight,
        item.fitMode,
        'image/png',
        0.95,
        settings.watermark
      );

      setItems((current) =>
        current.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: 'completed',
                progress: 100,
                rawResultUrl: data.imageUrl,
                resultUrl: formattedResultUrl,
                resultElapsedMs: data.elapsedMs,
                error: undefined,
              }
            : it
        )
      );
    } catch (err) {
      console.error(`Error processing item ${item.name}:`, err);
      setItems((current) =>
        current.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: 'error',
                progress: 0,
                error: err.message || 'Processing failed',
              }
            : it
        )
      );
    }
  };

  // Re-apply PNG logo watermark to completed items using arrow function
  const handleApplyWatermarkToCompleted = async () => {
    const completedItems = items.filter(
      (it) => it.status === 'completed' && (it.rawResultUrl || it.resultUrl)
    );
    if (completedItems.length === 0) return;

    showToast(`Applying logo watermark to ${completedItems.length} images...`, 'info');

    const updated = await Promise.all(
      items.map(async (it) => {
        if (it.status === 'completed' && (it.rawResultUrl || it.resultUrl)) {
          const source = it.rawResultUrl || it.resultUrl;
          const newResultUrl = await resizeImageToCanvas(
            source,
            it.targetWidth,
            it.targetHeight,
            it.fitMode,
            'image/png',
            0.95,
            settings.watermark
          );
          return {
            ...it,
            rawResultUrl: it.rawResultUrl || source,
            resultUrl: newResultUrl,
          };
        }
        return it;
      })
    );

    setItems(updated);
    showToast('Updated logo watermark across output images!', 'success');
  };

  // Execute batch processing using arrow function
  const handleStartBatch = async () => {
    if (isProcessing) return;

    abortControllerRef.current = false;
    setIsProcessing(true);

    const queue = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (queue.length === 0 && items.length > 0) {
      setItems((current) => current.map((it) => ({ ...it, status: 'idle' })));
    }

    const itemsToProcess = items.filter((i) => i.status === 'idle' || i.status === 'error');
    const concurrency = settings.concurrency || 2;

    let index = 0;
    const executeWorker = async () => {
      while (index < itemsToProcess.length && !abortControllerRef.current) {
        const item = itemsToProcess[index++];
        if (item) {
          await processSingleItem(item);
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, itemsToProcess.length) }).map(() =>
      executeWorker()
    );

    await Promise.all(workers);
    setIsProcessing(false);

    if (!abortControllerRef.current) {
      showToast('Bulk batch processing complete!', 'success');
    }
  };

  // Pause batch processing using arrow function
  const handleStopBatch = () => {
    abortControllerRef.current = true;
    setIsProcessing(false);
    showToast('Paused batch queue', 'info');
  };

  // Re-run single item using arrow function
  const handleRerunSingle = async (id, customPrompt) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const itemToProcess = customPrompt
      ? { ...item, customPromptOverride: customPrompt }
      : item;

    if (customPrompt) {
      setItems((current) =>
        current.map((it) => (it.id === id ? { ...it, customPromptOverride: customPrompt } : it))
      );
    }

    await processSingleItem(itemToProcess);
  };

  // Analyze product with Gemini Vision using arrow function
  const handleAnalyzeProduct = async (id) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setItems((current) =>
      current.map((it) => (it.id === id ? { ...it, isAnalyzing: true } : it))
    );

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/studio/analyze-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          imageBase64: item.originalBase64,
          mimeType: item.mimeType,
        }),
      });

      const analysisData = await res.json();

      setItems((current) =>
        current.map((it) =>
          it.id === id ? { ...it, analysis: analysisData, isAnalyzing: false } : it
        )
      );

      showToast(`Analyzed product: ${analysisData.productName || item.name}`, 'success');
    } catch (e) {
      console.error(e);
      setItems((current) =>
        current.map((it) => (it.id === id ? { ...it, isAnalyzing: false } : it))
      );
      showToast('Failed to analyze product image', 'error');
    }
  };

  // Delete item using arrow function
  const handleDeleteItem = (id) => {
    setItems((current) => current.filter((it) => it.id !== id));
  };

  // Export ZIP package using arrow function
  const handleExportZip = async () => {
    const completedItems = items.filter((i) => i.status === 'completed');
    if (completedItems.length === 0) {
      showToast('No completed transformed images to export', 'error');
      return;
    }

    setIsExportingZip(true);
    showToast('Packaging ZIP archive...', 'info');

    try {
      const blob = await exportBulkZip(
        items,
        settings.exportFormat,
        true,
        settings.watermark
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studio_batch_export_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Downloaded ZIP batch archive!', 'success');
    } catch (err) {
      console.error('ZIP Error:', err);
      showToast('Failed to export ZIP file', 'error');
    } finally {
      setIsExportingZip(false);
    }
  };

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const queuedCount = items.filter((i) => i.status === 'idle' || i.status === 'processing').length;
  const errorCount = items.filter((i) => i.status === 'error').length;
  const progressPercent =
    items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium shadow-xl transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : toast.type === 'error'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-card text-foreground border border-border'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">AI Photo Studio</h1>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Gemini GenAI
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Batch background color transformation, AI product placement, and client PNG logo watermarking.
          </p>
        </div>

        {/* Top Actions & Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleExportZip}
              disabled={isExportingZip}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Export {completedCount} Images (ZIP)</span>
            </button>
          )}

          {/* Tab Navigation */}
          <div className="flex w-full sm:w-auto items-center rounded-lg bg-muted p-1 border border-border">
            <button
              type="button"
              onClick={() => setActiveTab('bulk-editor')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'bulk-editor'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Batch Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bulk-generator')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'bulk-generator'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Cpu className="h-3.5 w-3.5 text-primary" />
              <span>Shot Generator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Workspaces */}
      {activeTab === 'bulk-editor' ? (
        <div className="space-y-6">
          <FlowControlPanel
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onApplyPreset={handleApplyPreset}
            onEnhancePrompt={handleEnhancePrompt}
            isEnhancing={isEnhancing}
            totalImagesCount={items.length}
            onApplyWatermarkToCompleted={handleApplyWatermarkToCompleted}
            completedCount={completedCount}
          />

          <DropzoneAndQueue
            items={items}
            isProcessing={isProcessing}
            globalPrompt={settings.globalPrompt}
            onFilesAdded={handleFilesAdded}
            onLoadSamples={handleLoadSamples}
            onStartBatch={handleStartBatch}
            onStopBatch={handleStopBatch}
            onUpdatePrompt={(id, prompt) =>
              setItems((prev) =>
                prev.map((i) => (i.id === id ? { ...i, customPromptOverride: prompt } : i))
              )
            }
            onAnalyze={handleAnalyzeProduct}
            onRerun={handleRerunSingle}
            onDelete={handleDeleteItem}
            onInspect={(item) => setInspectedItem(item)}
            batchProgress={{
              total: items.length,
              completed: completedCount,
              errors: errorCount,
              percent: progressPercent,
            }}
          />
        </div>
      ) : (
        <BulkGeneratorTab onTransferToEditor={handleTransferToEditor} />
      )}

      {/* Inspect Modal */}
      {inspectedItem && (
        <InspectModal
          item={inspectedItem}
          onClose={() => setInspectedItem(null)}
          onRerun={handleRerunSingle}
          watermarkConfig={settings.watermark}
        />
      )}
    </div>
  );
}
