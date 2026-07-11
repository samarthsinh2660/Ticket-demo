import React from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { Calendar, User, UserCheck } from 'lucide-react';

export default function TicketCard({ ticket, onClick }) {
  const { ticketNumber, title, description, status, priority, category, dueDate, customer, assignee } = ticket;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formattedDueDate = formatDate(dueDate);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-900/50 cursor-pointer transition-all flex flex-col justify-between space-y-4 group"
    >
      
      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 font-mono tracking-wider">
            {ticketNumber}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">
            {category?.replace('_', ' ')}
          </span>
        </div>
        
        {/* Title & Desc */}
        <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col space-y-3">
        
        {/* Due Date & Badges */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <PriorityBadge priority={priority} />
            <StatusBadge status={status} />
          </div>
          {formattedDueDate && (
            <div className="flex items-center space-x-1 font-semibold text-rose-600 dark:text-rose-455">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDueDate}</span>
            </div>
          )}
        </div>

        {/* Users */}
        <div className="flex items-center justify-between text-xs text-gray-450 dark:text-gray-500 pt-1">
          <div className="flex items-center space-x-1.5 min-w-0">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">By: {customer?.name}</span>
          </div>
          <div className="flex items-center space-x-1.5 min-w-0 text-right">
            <UserCheck className="w-3.5 h-3.5 flex-shrink-0 text-indigo-500" />
            <span className="truncate font-medium text-gray-750 dark:text-gray-400">
              {assignee ? assignee.name : 'Unassigned'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
