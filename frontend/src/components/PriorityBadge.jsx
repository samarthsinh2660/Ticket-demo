import React from 'react';

export default function PriorityBadge({ priority }) {
  const styles = {
    LOW: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-450 dark:border-slate-800',
    MEDIUM: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    CRITICAL: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 font-bold animate-pulse',
  };

  const val = priority || 'MEDIUM';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[val]}`}>
      {val}
    </span>
  );
}
