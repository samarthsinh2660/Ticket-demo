import React from 'react';
import { KanbanSquare } from 'lucide-react';

export default function EmptyState({ message, actionButton }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl shadow-sm max-w-md mx-auto">
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full text-gray-400 mb-4">
        <KanbanSquare className="w-12 h-12" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Tickets Found</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6 leading-relaxed">
        {message || "We couldn't find any tickets matching your filter parameters."}
      </p>
      {actionButton}
    </div>
  );
}
