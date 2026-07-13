import React from 'react';
import ThemeToggle from './ThemeToggle';
import { Search, Menu } from 'lucide-react';

export default function Navbar({ title, searchVal, setSearchVal, onMenuClick }) {
  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 transition-colors duration-200">
      
      {/* Title with Hamburger */}
      <div className="flex items-center space-x-2.5 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-1.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden focus:outline-none flex-shrink-0"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white truncate">{title}</h2>
      </div>
      
      {/* Utility Actions */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {setSearchVal !== undefined && (
          <div className="hidden sm:block relative w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={searchVal || ''}
              onChange={(e) => setSearchVal(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}
        <ThemeToggle />
      </div>

    </header>
  );
}
