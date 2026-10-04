import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const QUICK_SWATCHES = [
  '#0f172a', // Slate 900
  '#0d9488', // Teal 600
  '#2563eb', // Royal Blue 600
  '#4338ca', // Indigo 700
  '#7c3aed', // Purple 600
  '#db2777', // Pink 600
  '#e11d48', // Rose 600
  '#b45309', // Amber 700
  '#15803d', // Green 700
  '#18181b', // Zinc 900
  '#52525b', // Zinc 600
  '#ffffff', // White
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

  const handleTextChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('#') && val.length > 0 && !val.startsWith('rgb')) {
      val = '#' + val;
    }
    onChange(val);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground/90">{label}</Label>
          <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase">{safeValue}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Color preview circle with hidden native input */}
        <div className="relative h-9 w-9 rounded-lg border border-input shadow-sm overflow-hidden shrink-0 flex items-center justify-center cursor-pointer transition-transform hover:scale-105">
          <div
            className="w-full h-full"
            style={{ backgroundColor: safeValue }}
          />
          <input
            type="color"
            value={safeValue.startsWith('#') && safeValue.length === 7 ? safeValue : '#0f172a'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>

        {/* Hex Text Input */}
        <Input
          type="text"
          value={value}
          onChange={handleTextChange}
          placeholder="#000000"
          className="font-mono text-xs h-9 uppercase flex-1"
          maxLength={9}
        />
      </div>

      {/* Quick Swatches */}
      {showSwatches && (
        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
          {QUICK_SWATCHES.map((color) => {
            const isSelected = safeValue.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                type="button"
                onClick={() => onChange(color)}
                title={color}
                className={`h-4 w-4 rounded-full border transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-1 scale-110 border-white'
                    : 'border-black/15 hover:scale-110'
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
