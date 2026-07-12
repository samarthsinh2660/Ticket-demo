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
import StarredTicketList from '../components/StarredTicketList';
import Checklist from '../components/Checklist';
import AuditTimeline from '../components/AuditTimeline';
import { Calendar, Settings, MessageSquare, Send, Clock, BookOpen, Star } from 'lucide-react';

export default function EmployeeDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [activeTab, setActiveTab] = useState('board');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Detail Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleToggleStar = async (ticketId) => {
    if (!selectedTicket) return;
    try {
      const isCurrentlyStarred = selectedTicket.starredBy && selectedTicket.starredBy.length > 0;
      if (isCurrentlyStarred) {
        await api.delete(`/tickets/${ticketId}/star`);
        setSelectedTicket((prev) => ({
          ...prev,
          starredBy: []
        }));
      } else {
        const response = await api.post(`/tickets/${ticketId}/star`);
        setSelectedTicket((prev) => ({
          ...prev,
          starredBy: [response.data.data.star]
        }));
      }
      fetchTickets();
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={activeTab === 'starred' ? 'Starred Tickets' : 'Staff Workspace'} searchVal={activeTab === 'board' ? searchVal : undefined} setSearchVal={activeTab === 'board' ? setSearchVal : undefined} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'board' && (
            <>
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
            </>
          )}

          {activeTab === 'starred' && (
            <StarredTicketList onTicketClick={handleOpenDetails} />
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
            
            {/* Title & Star Button */}
            <div className="flex justify-between items-start bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-750">
              <div className="flex-1 mr-2">
                <span className="font-mono text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">{selectedTicket.ticketNumber}</span>
                <h3 className="text-base font-bold text-gray-905 dark:text-white mt-0.5">{selectedTicket.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => handleToggleStar(selectedTicket.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-gray-150 dark:hover:bg-gray-800 transition-colors animate-all"
                title={selectedTicket.starredBy && selectedTicket.starredBy.length > 0 ? 'Unstar Ticket' : 'Star Ticket'}
              >
                <Star className={`w-5 h-5 ${selectedTicket.starredBy && selectedTicket.starredBy.length > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
              </button>
            </div>

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

            {/* Checklist Section (Editable for Employee/Staff) */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <Checklist ticketId={selectedTicket.id} readOnly={false} />
            </div>

            {/* Audit Timeline Section */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <AuditTimeline activityLogs={selectedTicket.activityLogs} />
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
