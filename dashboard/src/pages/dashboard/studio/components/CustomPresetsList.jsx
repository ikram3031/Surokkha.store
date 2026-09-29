import React from 'react';
import { Bookmark, Trash2, Check } from 'lucide-react';

export const CustomPresetsList = ({
  presets,
  onApply,
  onDelete,
  activePresetId,
}) => {
  if (presets.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Bookmark className="h-3.5 w-3.5 text-primary" />
          <span>My Saved Presets</span>
        </span>
        <span className="text-[10px] text-muted-foreground">{presets.length} Saved</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {presets.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => onApply(preset)}
              className={`group relative flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? 'border-primary/50 bg-primary/10 shadow-xs'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40'
              }`}
            >
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-foreground truncate">{preset.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {preset.aspectRatio} • {preset.customWidth}×{preset.customHeight}
                  {preset.watermark?.enabled ? ' • Logo' : ''}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(preset.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                  title="Delete Preset"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
