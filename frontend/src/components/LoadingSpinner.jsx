import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="relative w-10 h-10 animate-spin">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30"></div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-650 border-t-transparent dark:border-indigo-400 dark:border-t-transparent"></div>
      </div>
      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading data...</p>
    </div>
  );
}
