import React, { useState } from 'react';
import { X, BookmarkPlus } from 'lucide-react';

export const SavePresetModal = ({ isOpen, onClose, onSave }) => {
  const [presetName, setPresetName] = useState('');

  if (!isOpen) return null;

  // Handle save preset form submission using arrow function
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    onSave(presetName.trim());
    setPresetName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <BookmarkPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Save Custom Studio Preset</h3>
              <p className="text-xs text-muted-foreground">Save prompt, logo, & framing settings</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Preset Name
            </label>
            <input
              type="text"
              autoFocus
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g. Luxury Marble + Bottom Logo"
              className="w-full text-xs px-3.5 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!presetName.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              Save Preset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
