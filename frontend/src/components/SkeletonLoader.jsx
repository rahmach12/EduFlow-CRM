import React from 'react';

// ─── Base pulse wrapper ───────────────────────────────────────────────────────
const Pulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
);

// ─── Stat Card Skeleton ───────────────────────────────────────────────────────
export const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
    <div className="flex items-center justify-between">
      <div className="space-y-3 flex-1">
        <Pulse className="h-3 w-24" />
        <Pulse className="h-7 w-16" />
        <Pulse className="h-3 w-32" />
      </div>
      <Pulse className="h-12 w-12 rounded-lg flex-shrink-0 ml-4" />
    </div>
  </div>
);

// ─── Table Row Skeleton ───────────────────────────────────────────────────────
export const SkeletonTableRow = ({ cols = 4 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="animate-pulse">
          {i === 0 ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              <div className="space-y-2">
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
            </div>
          )}
        </div>
      </td>
    ))}
  </tr>
);

// ─── Full Table Skeleton (n rows) ─────────────────────────────────────────────
export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonTableRow key={i} cols={cols} />
    ))}
  </>
);

// ─── Card Grid Skeleton ───────────────────────────────────────────────────────
export const SkeletonCardGrid = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// ─── List Item Skeleton ───────────────────────────────────────────────────────
export const SkeletonListItem = () => (
  <div className="flex items-start gap-4 px-6 py-4 animate-pulse">
    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
    </div>
  </div>
);

// ─── Internship Card Skeleton ─────────────────────────────────────────────────
export const SkeletonCard2 = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
    </div>
    <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
    <div className="space-y-2">
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
      <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800 rounded" />
    </div>
  </div>
);

// ─── Profile Skeleton ─────────────────────────────────────────────────────────
export const SkeletonProfile = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center gap-6">
      <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-3">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      ))}
    </div>
  </div>
);
