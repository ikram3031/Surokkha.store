import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Sparkles,
  Play,
  Pause,
  Layers,
  FolderPlus,
} from 'lucide-react';
import { ProductCard } from './ProductCard';

export const DropzoneAndQueue = ({
  items,
  isProcessing,
  globalPrompt,
  onFilesAdded,
  onLoadSamples,
  onStartBatch,
  onStopBatch,
  onUpdatePrompt,
  onAnalyze,
  onRerun,
  onDelete,
  onInspect,
  batchProgress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [filter, setFilter] = useState('all');
  const fileInputRef = useRef(null);

  // Drag enter handler using arrow function
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  // Drag leave handler using arrow function
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  // Drag over handler using arrow function
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Drop files handler using arrow function
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(e.dataTransfer.files);
    }
  };

  // File input change handler using arrow function
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(e.target.files);
      e.target.value = '';
    }
  };

  // Filter items by status
  const filteredItems = items.filter((item) => {
    if (filter === 'completed') return item.status === 'completed';
    if (filter === 'queued') return item.status === 'idle' || item.status === 'processing';
    if (filter === 'error') return item.status === 'error';
    return true;
  });

  const queuedCount = items.filter((i) => i.status === 'idle' || i.status === 'processing').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const errorCount = items.filter((i) => i.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer ${
          isDragOver
            ? 'border-primary bg-primary/10 shadow-lg scale-[0.99]'
            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-3 shadow-inner">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="text-sm font-semibold text-foreground text-center">
          Drag & Drop Product Photos Here
        </h3>
        <p className="mt-1 text-xs text-muted-foreground text-center max-w-sm">
          Supports PNG, JPG, WEBP formats. Batch upload 5, 10, or more product images to process.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Browse Computer</span>
          </button>

          <button
            type="button"
            onClick={onLoadSamples}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-muted border border-border text-foreground hover:bg-muted/80 transition-all flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Load 5 Demo Products</span>
          </button>
        </div>
      </div>

      {/* Progress & Batch Execution Bar */}
      {items.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isProcessing ? (
                <button
                  type="button"
                  onClick={onStopBatch}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Pause className="h-4 w-4" />
                  <span>Pause Queue</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartBatch}
                  className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Generate All Batch ({queuedCount} Ready)</span>
                </button>
              )}

              {/* Status Filter Tabs */}
              <div className="flex items-center rounded-lg bg-muted p-1 border border-border">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    filter === 'all'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('queued')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    filter === 'queued'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Queued ({queuedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('completed')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    filter === 'completed'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Done ({completedCount})
                </button>
                {errorCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilter('error')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      filter === 'error'
                        ? 'bg-destructive/20 text-destructive shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Failed ({errorCount})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Processing batch queue...</span>
                <span>{batchProgress.percent}% ({batchProgress.completed}/{batchProgress.total})</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${batchProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid Display */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              globalPrompt={globalPrompt}
              onUpdatePrompt={onUpdatePrompt}
              onAnalyze={onAnalyze}
              onRerun={onRerun}
              onDelete={onDelete}
              onInspect={onInspect}
            />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="text-center py-12 text-muted-foreground text-xs">
          No items match selected filter.
        </div>
      ) : null}
    </div>
  );
};
