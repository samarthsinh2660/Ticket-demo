import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import TicketCard from '../components/TicketCard';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, Settings, MessageSquare, Send, Clock, BookOpen } from 'lucide-react';

export default function EmployeeDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Detail Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Updates state
  const [editStatus, setEditStatus] = useState('TO_DO');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [searchVal, statusFilter, priorityFilter, categoryFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchVal) params.search = searchVal;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;

      const response = await api.get('/tickets', { params });
      setTickets(response.data.data.tickets);
    } catch (err) {
      console.error('Error fetching assigned tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleTicket = async (id) => {
    try {
      const response = await api.get(`/tickets/${id}`);
      const ticket = response.data.data.ticket;
      setSelectedTicket(ticket);
      setEditStatus(ticket.status);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    }
  };

  const handleOpenDetails = (ticket) => {
    fetchSingleTicket(ticket.id);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await api.patch(`/tickets/${selectedTicket.id}`, { status: editStatus });
      await fetchSingleTicket(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;
    setActionLoading(true);
    try {
      await api.patch(`/tickets/${selectedTicket.id}`, { reply: commentText });
      setCommentText('');
      await fetchSingleTicket(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title="Staff Workspace" searchVal={searchVal} setSearchVal={setSearchVal} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Action & Filter Panel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            
            {/* Filter selectors */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-250 dark:border-gray-650 rounded-xl dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="TO_DO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

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

            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-750">
              Total Assigned: {tickets.length}
            </div>
          </div>

          {/* Tickets Display */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState message="No tickets currently assigned to you." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((t) => (
                <TicketCard key={t.id} ticket={t} onClick={() => handleOpenDetails(t)} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedTicket ? `Assigned Ticket: ${selectedTicket.ticketNumber}` : 'Ticket details'}
      >
        {selectedTicket && (
          <div className="space-y-6">
            
            {/* Meta panel */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-750 space-y-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedTicket.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Created by <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedTicket.customer?.name}</span> ({selectedTicket.customer?.email})
              </p>
              <div className="flex flex-wrap gap-2 pt-1.5">
                <StatusBadge status={selectedTicket.status} />
                <PriorityBadge priority={selectedTicket.priority} />
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {selectedTicket.category}
                </span>
                {selectedTicket.dueDate && (
                  <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due: {new Date(selectedTicket.dueDate).toLocaleDateString()}</span>
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-605 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-805 leading-relaxed whitespace-pre-line">
                {selectedTicket.description}
              </p>
            </div>

            {/* Status Change Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <h4 className="text-xs font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                <Settings className="w-3.5 h-3.5" />
                <span>Update Status</span>
              </h4>
              <div className="flex gap-2">
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="TO_DO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  Apply
                </button>
              </div>
            </form>

            {/* Replies / Comments */}
            <form onSubmit={handlePostComment} className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-300">Add Comment / Reply</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask for details or write progress update..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !commentText.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Action History Feed */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-xs font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Ticket Activity Logs</span>
              </h4>
              {selectedTicket.activityLogs && selectedTicket.activityLogs.length === 0 ? (
                <p className="text-xs text-gray-450 dark:text-gray-500 italic">No activity logged yet.</p>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {selectedTicket.activityLogs?.map((log, idx) => (
                      <li key={log.id}>
                        <div className="relative pb-8">
                          {idx !== selectedTicket.activityLogs.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-8 ring-white dark:ring-gray-800 text-indigo-500">
                                <BookOpen className="w-4 h-4" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-xs text-gray-550 dark:text-gray-300">
                                  <span className="font-semibold text-gray-800 dark:text-white">{log.user?.name}</span> ({log.action})
                                </p>
                                {log.details && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">{log.details}</p>
                                )}
                              </div>
                              <div className="text-right text-[10px] whitespace-nowrap text-gray-400">
                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
