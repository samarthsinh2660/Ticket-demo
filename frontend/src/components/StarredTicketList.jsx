import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Star, Eye, Calendar, ArrowUpDown, ShieldCheck, Briefcase } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export default function StarredTicketList({ onTicketClick }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Users checklist for assignees select
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchStarredTickets();
    fetchUsersList();
  }, [searchVal, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder]);

  const fetchStarredTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchVal) params.search = searchVal;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;
      
      const response = await api.get('/users/me/starred', { params });
      let starredList = response.data.data.tickets || [];

      // Handle frontend sorting fallback
      starredList.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;

        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (valA instanceof Date || (typeof valA === 'string' && !isNaN(Date.parse(valA)))) {
          return sortOrder === 'asc' 
            ? new Date(valA) - new Date(valB) 
            : new Date(valB) - new Date(valA);
        } else {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
      });

      setTickets(starredList);
    } catch (err) {
      console.error('Error fetching starred tickets:', err);
      setError('Failed to load starred tickets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleUnstar = async (e, ticketId) => {
    e.stopPropagation();
    try {
      await api.delete(`/tickets/${ticketId}/star`);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (err) {
      console.error('Error unstarring ticket:', err);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span>Starred Tickets</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your privately starred workspace tickets</p>
        </div>
      </div>

      {/* Filter controls panel */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm text-sm transition-colors duration-200">
        {/* Search bar */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search starred tickets..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-250 dark:border-gray-650 rounded-xl dark:bg-gray-900 text-gray-850 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>

        {/* Status select */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-250 dark:border-gray-655 rounded-xl dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="TO_DO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Priority select */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-250 dark:border-gray-655 rounded-xl dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Category select */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-250 dark:border-gray-655 rounded-xl dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="BUG">Bug</option>
            <option value="FEATURE_REQUEST">Feature Request</option>
            <option value="SUPPORT">Support</option>
            <option value="BILLING">Billing</option>
            <option value="TECHNICAL">Technical</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Renders data table */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 transition-colors">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="p-5 text-red-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 transition-colors">
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState message="No starred tickets found." />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => toggleSort('ticketNumber')}>
                    <div className="flex items-center space-x-1">
                      <span>Ticket #</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => toggleSort('title')}>
                    <div className="flex items-center space-x-1">
                      <span>Title</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => toggleSort('priority')}>
                    <div className="flex items-center space-x-1">
                      <span>Priority</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => toggleSort('status')}>
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => toggleSort('category')}>
                    <div className="flex items-center space-x-1">
                      <span>Category</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => toggleSort('dueDate')}>
                    <div className="flex items-center space-x-1">
                      <span>Due Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => toggleSort('createdAt')}>
                    <div className="flex items-center space-x-1">
                      <span>Created Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onTicketClick(t)}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-650 dark:text-indigo-400">
                      {t.ticketNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-150">
                      {t.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        t.priority === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                          : t.priority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          : t.priority === 'MEDIUM'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                          : 'bg-slate-100 text-slate-655 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        t.status === 'DONE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : t.status === 'CLOSED'
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-450'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {t.category.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {t.dueDate ? (
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-700 dark:text-gray-300 font-medium">
                      {t.assignee ? (
                        <span className="inline-flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-xl text-[11px]">
                          <Briefcase className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[80px]">{t.assignee.name}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-405 dark:text-gray-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={(e) => handleUnstar(e, t.id)}
                          className="p-1.5 text-yellow-500 hover:text-gray-450 dark:hover:text-white rounded-lg hover:bg-gray-150 dark:hover:bg-gray-750 transition-colors"
                          title="Remove Star"
                        >
                          <Star className="w-4 h-4 fill-yellow-500" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-indigo-650 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-150 dark:hover:bg-gray-750 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
