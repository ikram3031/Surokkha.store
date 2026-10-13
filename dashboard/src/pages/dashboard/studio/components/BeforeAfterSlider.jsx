import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';

export const BeforeAfterSlider = ({
  originalSrc,
  resultSrc,
  originalLabel = 'Original',
  resultLabel = 'Studio AI Result',
  className = '',
  aspectRatioClass = 'aspect-square',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Update slider position based on client cursor X coordinate using arrow function
  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    setSliderPosition(percentage);
  }, []);

  // Handle touch events using arrow function
  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleMove]
  );

  // Handle mouse move events using arrow function
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  // Stop dragging on mouse/touch up using arrow function
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-xl bg-card border border-border ${aspectRatioClass} ${className} cursor-ew-resize`}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        if (e.touches.length > 0) {
          handleMove(e.touches[0].clientX);
        }
      }}
    >
      {/* Background Image: Result */}
      <img
        src={resultSrc}
        alt="Transformed result"
        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
      />

      {/* Foreground Image: Original */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={originalSrc}
          alt="Original product"
          className="absolute inset-0 h-full w-full max-w-none object-contain"
          style={{
            width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
          }}
        />
      </div>

      {/* Divider Handle */}
      <div
        className="absolute top-0 bottom-0 z-10 w-0.5 bg-primary shadow-md pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-background text-primary shadow-md border border-primary/40">
          <ArrowLeftRight className="h-3 w-3" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-2 left-2 z-10 rounded-md bg-background/80 border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur-md">
        {originalLabel}
      </div>
      <div className="absolute bottom-2 right-2 z-10 rounded-md bg-primary/20 border border-primary/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary backdrop-blur-md font-medium">
        {resultLabel}
      </div>
    </div>
  );
};
