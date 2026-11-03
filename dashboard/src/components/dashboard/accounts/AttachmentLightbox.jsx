import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Maximize, Minimize, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?$/i;

export const isImageFile = (file) => IMAGE_EXT.test(file?.name || '') || IMAGE_EXT.test(file?.url || '');

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Full-screen viewer for bill attachments: images zoom (buttons, wheel, double click) and pan by dragging, PDFs/other files embed
export const AttachmentLightbox = ({ files, startIndex = 0, resolveUrl, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef(null);
  const dragRef = useRef(null);

  const file = files[index];
  const url = resolveUrl(file.url);
  const image = isImageFile(file);

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const changeZoom = useCallback((next) => {
    const z = clamp(next, MIN_ZOOM, MAX_ZOOM);
    setZoom(z);
    if (z === MIN_ZOOM) setOffset({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (dir) => {
      setIndex((i) => (i + dir + files.length) % files.length);
      resetView();
    },
    [files.length, resetView],
  );

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && files.length > 1) go(1);
      else if (e.key === 'ArrowLeft' && files.length > 1) go(-1);
      else if (image && (e.key === '+' || e.key === '=')) changeZoom(zoom + 0.5);
      else if (image && e.key === '-') changeZoom(zoom - 0.5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, go, changeZoom, zoom, image, files.length]);

  // Leave browser fullscreen when the viewer closes
  useEffect(
    () => () => {
      if (document.fullscreenElement) document.exitFullscreen?.();
    },
    [],
  );

  const onWheel = (e) => {
    if (!image) return;
    changeZoom(zoom + (e.deltaY < 0 ? 0.25 : -0.25));
  };

  const onPointerDown = (e) => {
    if (!image || zoom === MIN_ZOOM) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    setOffset({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div ref={rootRef} className="fixed inset-0 z-[200] flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10">
        <div className="min-w-0 text-sm font-medium truncate">
          {file.name || file.url.split('/').pop()}
          {files.length > 1 && <span className="ml-2 text-xs text-white/60">{index + 1} / {files.length}</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {image && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 hover:text-white" onClick={() => changeZoom(zoom - 0.5)} disabled={zoom <= MIN_ZOOM} title="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-xs tabular-nums text-white/80">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 hover:text-white" onClick={() => changeZoom(zoom + 0.5)} disabled={zoom >= MAX_ZOOM} title="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 hover:text-white" onClick={resetView} title="Reset">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 hover:text-white" onClick={toggleFullscreen} title={isFullscreen ? 'Exit full screen' : 'Full screen'}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <a href={url} target="_blank" rel="noreferrer" title="Open in new tab" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10">
            <ExternalLink className="h-4 w-4" />
          </a>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 hover:text-white" onClick={onClose} title="Close (Esc)">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center select-none"
        onWheel={onWheel}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {image ? (
          <img
            src={url}
            alt={file.name || 'Attachment'}
            draggable={false}
            onDoubleClick={() => (zoom === MIN_ZOOM ? changeZoom(2.5) : resetView())}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              cursor: zoom > MIN_ZOOM ? 'grab' : 'zoom-in',
              transition: dragRef.current ? 'none' : 'transform 0.12s ease-out',
            }}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <iframe title={file.name || 'Attachment'} src={url} className="h-full w-full bg-white" />
        )}

        {files.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 hover:bg-black/80" title="Previous">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 hover:bg-black/80" title="Next">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AttachmentLightbox;
