import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings2,
  BookmarkPlus,
  BookmarkCheck,
} from 'lucide-react';
import { STYLE_PRESETS, SIZE_PRESETS } from '../data/presets';
import { LogoSettingsModal } from './LogoSettingsModal';
import { SavePresetModal } from './SavePresetModal';
import { CustomPresetsList } from './CustomPresetsList';
import {
  getSavedCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
} from '../utils/presetStorage';

export const FlowControlPanel = ({
  settings,
  onUpdateSettings,
  onApplyPreset,
  onEnhancePrompt,
  isEnhancing,
  totalImagesCount,
  onApplyWatermarkToCompleted,
  completedCount = 0,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [customPresets, setCustomPresets] = useState([]);
  const [presetFeedback, setPresetFeedback] = useState(null);

  // Load custom saved presets from localStorage on mount
  useEffect(() => {
    setCustomPresets(getSavedCustomPresets());
  }, []);

  // Save new custom preset using arrow function
  const handleSavePreset = (name) => {
    const { preset, allPresets } = saveCustomPreset(name, settings);
    setCustomPresets(allPresets);
    setPresetFeedback(`Saved preset "${preset.name}"!`);
    setTimeout(() => setPresetFeedback(null), 3000);
  };

  // Delete custom preset using arrow function
  const handleDeletePreset = (id) => {
    const updated = deleteCustomPreset(id);
    setCustomPresets(updated);
  };

  // Apply custom preset using arrow function
  const handleApplyCustomPreset = (preset) => {
    onUpdateSettings({
      globalPrompt: preset.prompt,
      aspectRatio: preset.aspectRatio,
      selectedSizePresetId: preset.selectedSizePresetId || '',
      customWidth: preset.customWidth || 1080,
      customHeight: preset.customHeight || 1080,
      fitMode: preset.fitMode || 'contain',
      watermark: preset.watermark,
      selectedPresetId: preset.selectedPresetId || '',
    });
    setPresetFeedback(`Applied preset "${preset.name}"`);
    setTimeout(() => setPresetFeedback(null), 2500);
  };

  // Select size preset using arrow function
  const handleSizePresetSelect = (presetId) => {
    const found = SIZE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      onUpdateSettings({
        selectedSizePresetId: presetId,
        aspectRatio: found.aspectRatio,
        customWidth: found.width,
        customHeight: found.height,
      });
    }
  };

  // Select aspect ratio using arrow function
  const handleAspectRatioSelect = (ratio) => {
    let w = 1080;
    let h = 1080;
    if (ratio === '4:3') {
      w = 1600;
      h = 1200;
    } else if (ratio === '3:4') {
      w = 1200;
      h = 1600;
    } else if (ratio === '9:16') {
      w = 1080;
      h = 1920;
    } else if (ratio === '16:9') {
      w = 1920;
      h = 1080;
    }

    onUpdateSettings({
      aspectRatio: ratio,
      customWidth: w,
      customHeight: h,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 relative">
      {/* Save Preset Modal */}
      <SavePresetModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSavePreset}
      />

      {/* Preset Toast Feedback */}
      {presetFeedback && (
        <div className="absolute top-3 right-6 z-20 flex items-center gap-2 rounded-xl border border-primary/40 bg-card px-3.5 py-1.5 text-xs text-primary shadow-lg">
          <BookmarkCheck className="h-4 w-4" />
          <span>{presetFeedback}</span>
        </div>
      )}

      {/* Control Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Wand2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              Creative Prompt & Studio Specifications
            </h2>
            <p className="text-xs text-muted-foreground">
              Apply unified studio aesthetics, scene lighting & target ratios to all {totalImagesCount > 0 ? `${totalImagesCount} queued items` : 'uploads'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            <span>Save Preset</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5 text-primary" />
            <span>{showAdvanced ? 'Hide Config' : 'Model Config'}</span>
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Global Prompt Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">
            Creative Scene Prompt
          </label>

          <button
            type="button"
            onClick={onEnhancePrompt}
            disabled={isEnhancing}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
            <span>{isEnhancing ? 'Enhancing with AI...' : 'Magic Prompt Enhancer'}</span>
          </button>
        </div>

        <textarea
          rows={3}
          value={settings.globalPrompt}
          onChange={(e) => onUpdateSettings({ globalPrompt: e.target.value })}
          placeholder="Describe background scene, lighting, materials, and placement..."
          className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        />
      </div>

      {/* Curated Style Presets */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-foreground">
          Curated Studio Atmospheres
        </span>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {STYLE_PRESETS.map((preset) => {
            const isSelected = settings.selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset.id)}
                className={`group relative flex flex-col items-center rounded-xl p-2.5 text-center transition-all border ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary shadow-xs font-semibold'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <span className="text-lg mb-1 group-hover:scale-110 transition-transform">
                  {preset.icon}
                </span>
                <span className="text-[11px] line-clamp-1">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Saved Presets */}
      {customPresets.length > 0 && (
        <CustomPresetsList
          presets={customPresets}
          onApply={handleApplyCustomPreset}
          onDelete={handleDeletePreset}
          activePresetId={settings.selectedPresetId}
        />
      )}

      {/* Aspect Ratio & Platform Preset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
        {/* Aspect Ratio */}
        <div>
          <label className="text-xs font-semibold text-foreground block mb-2">
            Target Aspect Ratio
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {['1:1', '4:3', '3:4', '9:16', '16:9'].map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => handleAspectRatioSelect(ratio)}
                className={`py-2 px-1 text-xs rounded-lg font-medium border text-center transition-all ${
                  settings.aspectRatio === ratio
                    ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* E-Commerce Platform Size Presets */}
        <div>
          <label className="text-xs font-semibold text-foreground block mb-2">
            E-Commerce Platform Preset
          </label>
          <select
            value={settings.selectedSizePresetId || ''}
            onChange={(e) => handleSizePresetSelect(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Custom Dimensions ({settings.customWidth}×{settings.customHeight})</option>
            {SIZE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.width}×{p.height})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PNG Logo Watermarking Settings */}
      <LogoSettingsModal
        config={settings.watermark}
        onChange={(updated) =>
          onUpdateSettings({
            watermark: { ...settings.watermark, ...updated },
          })
        }
        onApplyToCompleted={onApplyWatermarkToCompleted}
        completedCount={completedCount}
      />

      {/* Advanced Model Specifications Collapsible */}
      {showAdvanced && (
        <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 animate-in fade-in duration-200">
          <h4 className="text-xs font-semibold text-foreground">Advanced Model & Concurrency Config</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Image Model</label>
              <select
                value={settings.model}
                onChange={(e) => onUpdateSettings({ model: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 rounded bg-background border border-border text-foreground"
              >
                <option value="gemini-3.1-flash-lite-image">Gemini 3.1 Flash Lite (Fast)</option>
                <option value="gemini-3.1-flash-image">Gemini 3.1 Flash Image (High Res 2K)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Fit Mode</label>
              <select
                value={settings.fitMode}
                onChange={(e) => onUpdateSettings({ fitMode: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 rounded bg-background border border-border text-foreground"
              >
                <option value="contain">Contain (Keep aspect ratio)</option>
                <option value="cover">Cover (Crop to fit)</option>
                <option value="smart-fill">Smart Studio Fill</option>
                <option value="blur-extend">Blur Background Extend</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Batch Concurrency</label>
              <select
                value={settings.concurrency || 2}
                onChange={(e) => onUpdateSettings({ concurrency: Number(e.target.value) })}
                className="w-full text-xs px-2.5 py-1.5 rounded bg-background border border-border text-foreground"
              >
                <option value={1}>1 Worker (Sequential)</option>
                <option value={2}>2 Workers (Recommended)</option>
                <option value={3}>3 Workers (Fast)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
