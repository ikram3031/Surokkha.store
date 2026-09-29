import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Cpu,
  Plus,
  Trash2,
} from 'lucide-react';
import { STYLE_PRESETS } from '../data/presets';
import { downloadDataUrl } from '../utils/imageUtils';

export const BulkGeneratorTab = ({ onTransferToEditor }) => {
  const [prompt, setPrompt] = useState(
    'Modern ergonomic running sneaker, floating on a minimal concrete pedestal with warm atmospheric golden hour sunbeams, 8k commercial product photo'
  );
  const [batchCount, setBatchCount] = useState(4);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [model, setModel] = useState('gemini-3.1-flash-lite-image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [items, setItems] = useState([]);

  // Generate bulk AI product images using arrow function
  const handleGenerateBulk = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    const newItems = Array.from({ length: batchCount }).map((_, idx) => ({
      id: 'gen-' + Date.now() + '-' + idx,
      prompt: prompt,
      aspectRatio: aspectRatio,
      status: 'processing',
      createdAt: Date.now(),
    }));

    setItems((prev) => [...newItems, ...prev]);

    const promises = newItems.map(async (item) => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const res = await fetch('/api/v1/studio/generate-bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            prompt: item.prompt,
            aspectRatio: item.aspectRatio,
            model: model,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Generation failed');
        }

        setItems((current) =>
          current.map((it) =>
            it.id === item.id ? { ...it, status: 'completed', imageUrl: data.imageUrl } : it
          )
        );
      } catch (err) {
        setItems((current) =>
          current.map((it) =>
            it.id === item.id ? { ...it, status: 'error', error: err.message } : it
          )
        );
      }
    });

    await Promise.allSettled(promises);
    setIsGenerating(false);
  };

  // Apply preset modifier using arrow function
  const handleApplyPreset = (presetModifier) => {
    setPrompt((prev) => `${prev.split('.')[0] || prev}. ${presetModifier}`);
  };

  return (
    <div className="space-y-6">
      {/* Config Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Bulk AI Product Generator
            </h2>
            <p className="text-xs text-muted-foreground">
              Generate multiple photorealistic product shots from scratch simultaneously
            </p>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            Product Prompt & Scene Description
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe product and scene..."
            className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Style Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Add Studio Atmosphere</label>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.promptModifier)}
                className="px-2.5 py-1 text-xs rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground transition-all flex items-center gap-1"
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Batch Count</label>
            <select
              value={batchCount}
              onChange={(e) => setBatchCount(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground"
            >
              <option value={2}>2 Images</option>
              <option value={4}>4 Images</option>
              <option value={6}>6 Images</option>
              <option value={8}>8 Images</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground"
            >
              <option value="1:1">1:1 Square</option>
              <option value="4:3">4:3 Landscape</option>
              <option value="3:4">3:4 Portrait</option>
              <option value="9:16">9:16 Vertical Reel</option>
              <option value="16:9">16:9 Banner</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">AI Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground"
            >
              <option value="gemini-3.1-flash-lite-image">Gemini 3.1 Flash Lite</option>
              <option value="gemini-3.1-flash-image">Gemini 3.1 Flash Image (2K)</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerateBulk}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3 px-4 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
        >
          <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? `Generating ${batchCount} AI Product Shots...` : `Generate ${batchCount} Product Visuals`}</span>
        </button>
      </div>

      {/* Output Grid */}
      {items.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-foreground">Generated Output Gallery</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item, idx) => (
              <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="relative aspect-square w-full bg-black/40 flex items-center justify-center">
                  {item.status === 'processing' && (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <Sparkles className="h-6 w-6 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">Rendering shot #{idx + 1}...</span>
                    </div>
                  )}

                  {item.status === 'completed' && item.imageUrl && (
                    <img src={item.imageUrl} alt={item.prompt} className="h-full w-full object-contain" />
                  )}

                  {item.status === 'error' && (
                    <div className="p-4 text-center text-xs text-destructive">
                      Generation Failed: {item.error}
                    </div>
                  )}
                </div>

                {item.status === 'completed' && item.imageUrl && (
                  <div className="p-3 flex items-center gap-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => onTransferToEditor(item.imageUrl, `AI Shot ${idx + 1}`, item.prompt)}
                      className="flex-1 py-1.5 px-2 text-[11px] font-medium rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Staging Queue</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadDataUrl(item.imageUrl, `ai_product_${idx + 1}.png`)}
                      className="p-1.5 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
                      title="Download Image"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
