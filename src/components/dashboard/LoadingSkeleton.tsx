import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="w-full h-full animate-pulse px-6 mt-6">
      
      {/* 1. Fake Pill */}
      <div className="mx-auto h-8 w-48 bg-slate-200 rounded-full mb-8" />

      {/* 2. Fake Ribbon */}
      <div className="w-full h-6 bg-slate-200 rounded-full mb-8" />

      {/* 3. Fake Content - Task Rows */}
      <div className="space-y-4">
        {/* Row 1 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0" />
          <div className="flex-1 h-16 bg-slate-200 rounded-2xl" />
        </div>
        {/* Row 2 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0" />
          <div className="flex-1 h-16 bg-slate-200 rounded-2xl" />
        </div>
        {/* Row 3 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0" />
          <div className="flex-1 h-16 bg-slate-200 rounded-2xl" />
        </div>
      </div>

      {/* 4. Fake Daily Actions Grid */}
      <div className="mt-10 pt-6 border-t border-slate-100">
        <div className="flex justify-between mb-4">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="aspect-square bg-slate-200 rounded-full" />
          <div className="aspect-square bg-slate-200 rounded-full" />
          <div className="aspect-square bg-slate-200 rounded-full" />
          <div className="aspect-square bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;