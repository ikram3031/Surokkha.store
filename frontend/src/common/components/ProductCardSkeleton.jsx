import React from 'react';
import { Skeleton } from './ui/skeleton';

export default function ProductCardSkeleton({ className = '' }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between ${className}`}>
      {/* Top Header Placeholder */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between border-b border-slate-100">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-md" />
      </div>

      {/* Image Skeleton */}
      <div className="w-full aspect-square p-4 flex items-center justify-center bg-slate-50/50">
        <Skeleton className="w-full h-full rounded-2xl" />
      </div>

      {/* Content Info Placeholder */}
      <div className="p-3 pt-2.5 flex flex-col flex-grow justify-between border-t border-slate-100/90 bg-white space-y-3">
        {/* Title */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-3 w-3/5 rounded" />
        </div>

        {/* Price & Action Module */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex items-end justify-between">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-1.5 items-center">
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
