import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pipette, Sparkles, Check } from 'lucide-react';

const DESIGNER_PALETTES = [
  {
    name: 'Modern Slate & Teal',
    colors: ['#0f172a', '#0d9488', '#0284c7', '#334155', '#f8fafc', '#ffffff'],
  },
  {
    name: 'Royal Navy & Gold',
    colors: ['#1e3a8a', '#b45309', '#d97706', '#1e293b', '#fefce8', '#ffffff'],
  },
  {
    name: 'Vibrant Indigo & Rose',
    colors: ['#4338ca', '#db2777', '#7c3aed', '#e11d48', '#fdf4ff', '#ffffff'],
  },
  {
    name: 'Emerald & Forest',
    colors: ['#065f46', '#059669', '#10b981', '#1e293b', '#ecfdf5', '#ffffff'],
  },
  {
    name: 'Monochrome & Charcoal',
    colors: ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#f4f4f5', '#ffffff'],
  },
];

const QUICK_SWATCHES = [
  '#0f172a', '#1e293b', '#18181b', '#0d9488', '#2563eb',
  '#4338ca', '#7c3aed', '#db2777', '#e11d48', '#b45309',
  '#059669', '#52525b', '#64748b', '#94a3b8', '#f8fafc', '#ffffff',
];

export function ColorPickerInput({
  label,
  value = '#0f172a',
  onChange,
  description,
  showSwatches = true,
  className = '',
}) {
  const safeValue = value || '#000000';
  const nativeInputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  // Normalize hex code
  const formatHex = (val) => {
    if (!val) return '#000000';
    if (!val.startsWith('#') && !val.startsWith('rgb')) {
      return '#' + val;
    }
    return val;
  };

  const handleTextChange = (e) => {
    let val = e.target.value.trim();
    if (val.length > 0 && !val.startsWith('#')) {
      val = '#' + val;
    }
    onChange(val);
  };

  const handleColorPick = (color) => {
    onChange(color);
  };

  // EyeDropper API support if browser supports it
  const handleEyeDropper = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onChange(result.sRGBHex);
        }
      } catch {
        // User canceled or failed
      }
    } else if (nativeInputRef.current) {
      nativeInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground/90">{label}</Label>
          <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase">
            {safeValue}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Interactive Mouse Color Trigger */}
        <div
          onClick={() => nativeInputRef.current?.click()}
          title="Click to open interactive color wheel / cursor picker"
          className="relative h-9 w-9 rounded-lg border border-input shadow-xs overflow-hidden shrink-0 flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-primary/40"
        >
          <div
            className="w-full h-full"
            style={{ backgroundColor: safeValue }}
          />
          {/* Native HTML5 cursor-driven color palette picker */}
          <input
            ref={nativeInputRef}
            type="color"
            value={safeValue.startsWith('#') && safeValue.length === 7 ? safeValue : '#0f172a'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>

        {/* Hex Input Field */}
        <div className="relative flex-1">
          <Input
            type="text"
            value={value}
            onChange={handleTextChange}
            placeholder="#000000"
            className="font-mono text-xs h-9 uppercase pr-8"
            maxLength={9}
          />
          {window.EyeDropper && (
            <button
              type="button"
              onClick={handleEyeDropper}
              title="Pick color from screen"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
            >
              <Pipette className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Palette Popover Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Toggle designer palette suggestions"
          className={`h-9 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
            isOpen
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-muted/60 text-muted-foreground'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Palettes</span>
        </button>
      </div>

      {/* Expandable Designer Palettes Drawer */}
      {isOpen && (
        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-lg space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-border/60">
            <span className="text-[11px] font-bold text-foreground">Designer Color Harmonies</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="space-y-2">
            {DESIGNER_PALETTES.map((palette) => (
              <div key={palette.name} className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium block">
                  {palette.name}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {palette.colors.map((color) => {
                    const isSelected = safeValue.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorPick(color)}
                        title={`${color} (Click to apply)`}
                        className={`h-5 w-5 rounded-md border transition-all cursor-pointer relative flex items-center justify-center ${
                          isSelected
                            ? 'ring-2 ring-primary ring-offset-1 scale-110 border-white'
                            : 'border-black/15 hover:scale-115'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white drop-shadow-md" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Swatches Row */}
      {showSwatches && !isOpen && (
        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
          {QUICK_SWATCHES.map((color) => {
            const isSelected = safeValue.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                type="button"
                onClick={() => handleColorPick(color)}
                title={color}
                className={`h-3.5 w-3.5 rounded border transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-1 scale-125 border-white'
                    : 'border-black/15 hover:scale-125'
                }`}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      )}

      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
    </div>
  );
}

export default ColorPickerInput;
