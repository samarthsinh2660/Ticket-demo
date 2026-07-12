import React from 'react';
import ThemeToggle from './ThemeToggle';
import { Search } from 'lucide-react';

export default function Navbar({ title, searchVal, setSearchVal }) {
  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0 transition-colors duration-200">
      
      {/* Title */}
      <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
      
      {/* Utility Actions */}
      <div className="flex items-center space-x-4">
        {setSearchVal !== undefined && (
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by title, desc, TCK..."
              value={searchVal || ''}
              onChange={(e) => setSearchVal(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}
        <ThemeToggle />
      </div>

    </header>
  );
}
