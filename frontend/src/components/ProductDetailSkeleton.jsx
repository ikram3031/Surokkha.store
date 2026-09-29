import React from 'react';
import { Skeleton } from './ui/skeleton';

export default function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10 animate-fade-in">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded" />
        <span className="text-slate-300">/</span>
        <Skeleton className="h-4 w-16 rounded" />
        <span className="text-slate-300">/</span>
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image & Thumbnails */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden aspect-square w-full max-w-md mx-auto p-6 flex items-center justify-center">
            <Skeleton className="w-full h-full rounded-2xl" />
          </div>
          <div className="flex items-center justify-center gap-2.5 max-w-md mx-auto">
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl" />
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl" />
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl" />
          </div>
        </div>

        {/* Right Column: Info & Purchase Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-9 sm:h-11 w-4/5 rounded-lg" />
          </div>

          {/* Price Box */}
          <div className="border-y border-slate-200/80 py-4 flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
          </div>

          {/* Quantity & Actions */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>

          {/* Assurance Box */}
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
