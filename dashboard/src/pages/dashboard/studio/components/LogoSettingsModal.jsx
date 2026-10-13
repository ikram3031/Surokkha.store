import React, { useRef } from 'react';
import {
  ShieldCheck,
  Type,
  Image as ImageIcon,
  Upload,
  X,
  Sparkles,
} from 'lucide-react';
import { clientConfig } from '@/clientConfig';
import { fileToDataUrl } from '../utils/imageUtils';

const POSITION_LABELS = [
  { id: 'top-left', label: 'Top Left', gridArea: 'row-start-1 col-start-1' },
  { id: 'top-right', label: 'Top Right', gridArea: 'row-start-1 col-start-3' },
  { id: 'center', label: 'Center', gridArea: 'row-start-2 col-start-2' },
  { id: 'bottom-left', label: 'Bottom Left', gridArea: 'row-start-3 col-start-1' },
  { id: 'bottom-right', label: 'Bottom Right', gridArea: 'row-start-3 col-start-3' },
];

export const LogoSettingsModal = ({
  config,
  onChange,
  onApplyToCompleted,
  completedCount = 0,
}) => {
  const fileInputRef = useRef(null);

  // Toggle watermark functionality using arrow function
  const handleToggle = () => {
    onChange({ enabled: !config.enabled });
  };

  // Handle custom PNG logo file upload using arrow function
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      onChange({
        logoUrl: dataUrl,
        logoName: file.name,
        type: 'logo',
      });
    } catch (err) {
      console.error('Failed to read logo file:', err);
    }
  };

  // Use client default PNG logo using arrow function
  const handleUseClientDefaultLogo = () => {
    const defaultLogo = clientConfig?.logoUrl || '/src/uploads/logo.webp';
    onChange({
      logoUrl: defaultLogo,
      logoName: `${clientConfig?.brandName || 'Client'} PNG Logo`,
      type: 'logo',
    });
  };

  // Remove logo using arrow function
  const handleRemoveLogo = (e) => {
    e.stopPropagation();
    onChange({
      logoUrl: undefined,
      logoName: undefined,
      type: 'text',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 transition-all">
      {/* Header Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
              config.enabled
                ? 'border-primary/50 bg-primary/10 text-primary shadow-xs'
                : 'border-border bg-muted text-muted-foreground'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Client PNG Logo Overlay
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Overlay your official brand PNG logo onto all output product images
            </p>
          </div>
        </div>

        {/* Master Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {config.enabled && (
        <div className="space-y-4 pt-2 border-t border-border/60">
          {/* Logo / Text Type Selector */}
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg border border-border">
            <button
              type="button"
              onClick={() => onChange({ type: 'logo' })}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                config.type === 'logo'
                  ? 'bg-background text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5 text-primary" />
              <span>PNG Logo</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ type: 'text' })}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                config.type === 'text'
                  ? 'bg-background text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              <span>Text Watermark</span>
            </button>
          </div>

          {/* Logo Upload & Settings */}
          {config.type === 'logo' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />

              {config.logoUrl ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/60 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-black/40 border border-border flex items-center justify-center overflow-hidden p-1">
                      <img
                        src={config.logoUrl}
                        alt="Brand Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground truncate max-w-[180px]">
                        {config.logoName || 'Client Brand Logo'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">PNG / Transparent format</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                    title="Remove Logo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-primary/5 transition-all text-center"
                  >
                    <Upload className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">Upload Custom PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUseClientDefaultLogo}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-border hover:border-primary/50 bg-muted/30 hover:bg-primary/5 transition-all text-center"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-medium text-foreground">
                      Use {clientConfig?.brandName || 'Store'} Logo
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Text Settings */}
          {config.type === 'text' && (
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Watermark Text
              </label>
              <input
                type="text"
                value={config.text}
                onChange={(e) => onChange({ text: e.target.value })}
                placeholder="e.g. © STORE NAME"
                className="w-full text-xs px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Position Selector Grid */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Logo Position
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-2 bg-muted/40 rounded-lg border border-border max-w-[240px]">
              {POSITION_LABELS.map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => onChange({ position: pos.id })}
                  className={`py-2 px-1 text-[11px] rounded font-medium transition-all text-center ${pos.gridArea} ${
                    config.position === pos.id
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Opacity</span>
              <span className="font-medium text-foreground">
                {Math.round((config.opacity || 0.75) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={config.opacity || 0.75}
              onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Real-time Apply to Completed Items */}
          {completedCount > 0 && onApplyToCompleted && (
            <button
              type="button"
              onClick={onApplyToCompleted}
              className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Apply Logo to {completedCount} Processed Images</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
