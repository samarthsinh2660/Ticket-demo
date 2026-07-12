import React from 'react';
import { Calendar, User, MessageSquare, ArrowRight, RefreshCw, Pin, Trash2, CheckCircle2, Bookmark, Star, StarOff, CheckSquare } from 'lucide-react';

export default function AuditTimeline({ activityLogs = [] }) {
  
  // Icon selector based on action
  const getActionIcon = (action) => {
    const act = action.toLowerCase();
    if (act.includes('create')) {
      return <Bookmark className="w-3.5 h-3.5 text-blue-500" />;
    }
    if (act.includes('assign')) {
      return <User className="w-3.5 h-3.5 text-indigo-500" />;
    }
    if (act.includes('status') || act.includes('reopen')) {
      return <RefreshCw className="w-3.5 h-3.5 text-amber-500" />;
    }
    if (act.includes('priority')) {
      return <Pin className="w-3.5 h-3.5 text-rose-500" />;
    }
    if (act.includes('closed') || act.includes('close')) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    }
    if (act.includes('comment') || act.includes('reply')) {
      return <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />;
    }
    if (act.includes('checklist')) {
      return <CheckSquare className="w-3.5 h-3.5 text-sky-500" />;
    }
    if (act.includes('star added')) {
      return <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />;
    }
    if (act.includes('star removed')) {
      return <StarOff className="w-3.5 h-3.5 text-slate-400" />;
    }
    return <Calendar className="w-3.5 h-3.5 text-gray-400" />;
  };

  if (!activityLogs || activityLogs.length === 0) {
    return (
      <p className="text-xs text-gray-400 dark:text-gray-500 py-6 italic text-center">
        No audit logs recorded for this ticket.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h5 className="text-sm font-bold text-gray-805 dark:text-gray-300">Ticket Activity History</h5>
      
      {/* Vertical Timeline container */}
      <div className="relative border-l border-gray-150 dark:border-gray-800 pl-4 ml-2.5 space-y-5 py-2">
        {activityLogs.map((log) => {
          const hasTransitions = log.previousValue !== null && log.newValue !== null;
          
          return (
            <div key={log.id} className="relative group text-xs">
              
              {/* Timeline Bullet Dot */}
              <div className="absolute -left-[23.5px] top-0.5 p-1 bg-white dark:bg-gray-850 rounded-full border border-gray-150 dark:border-gray-800 flex items-center justify-center transition-colors">
                {getActionIcon(log.action)}
              </div>

              {/* Timestamp and Performed By */}
              <div className="flex items-center justify-between text-gray-400 dark:text-gray-500 font-medium mb-1">
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {log.user ? `${log.user.name} (${log.user.role})` : 'System'}
                </span>
                <span>
                  {new Date(log.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Log Action Details */}
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {log.action}
              </p>
              {log.details && (
                <p className="text-gray-500 dark:text-gray-400 mt-0.5 bg-gray-50 dark:bg-gray-900/30 p-2 rounded-lg italic">
                  {log.details}
                </p>
              )}

              {/* Value Transitions rendering */}
              {hasTransitions && (
                <div className="flex items-center space-x-1.5 mt-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-md font-mono text-[10px] border border-gray-200/50 dark:border-gray-800/50">
                    {log.previousValue}
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 rounded-md font-mono text-[10px] border border-indigo-100/50 dark:border-indigo-900/20">
                    {log.newValue}
                  </span>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
