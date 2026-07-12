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
import { Plus, X, AlertCircle, MessageSquare, Send, CheckCircle2, Star } from 'lucide-react';

export default function CustomerDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [activeTab, setActiveTab] = useState('board');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setStatusPriority] = useState('');
  const [categoryFilter, setStatusCategory] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SUPPORT');
  const [formError, setFormError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Details updates & Comment states
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('SUPPORT');
  const [commentText, setCommentText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [searchVal, statusFilter, priorityFilter, categoryFilter]);

  // Fetch full details of selected ticket (includes logs)
  const fetchSingleTicket = async (id) => {
    try {
      const response = await api.get(`/tickets/${id}`);
      setSelectedTicket(response.data.data.ticket);
      
      // Populate edit states
      setEditTitle(response.data.data.ticket.title);
      setEditDesc(response.data.data.ticket.description);
      setEditCategory(response.data.data.ticket.category);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    }
  };

  const handleOpenDetails = (ticket) => {
    fetchSingleTicket(ticket.id);
    setIsDetailsOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreateLoading(true);

    try {
      await api.post('/tickets', { title, description, category });
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setCategory('SUPPORT');
      fetchTickets();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await api.patch(`/tickets/${selectedTicket.id}`, { status: 'CLOSED' });
      await fetchSingleTicket(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error('Error closing ticket:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await api.patch(`/tickets/${selectedTicket.id}`, {
        title: editTitle,
        description: editDesc,
        category: editCategory,
      });
      await fetchSingleTicket(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error('Error updating ticket details:', err);
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
        <Navbar title={activeTab === 'starred' ? 'Starred Tickets' : 'My Support Tickets'} searchVal={activeTab === 'board' ? searchVal : undefined} setSearchVal={activeTab === 'board' ? setSearchVal : undefined} />

        {/* Workspace Body */}
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
                  className="px-3 py-2 bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  onChange={(e) => setStatusPriority(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  onChange={(e) => setStatusCategory(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

            {/* Create Trigger */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Ticket</span>
            </button>
          </div>

          {/* Ticket Listing */}
          {loading ? (
            <LoadingSpinner />
          ) : tickets.length === 0 ? (
            <EmptyState
              message="No support tickets found. Create a ticket to initiate a query."
              actionButton={
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Raise First Ticket
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => handleOpenDetails(ticket)}
                />
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

      {/* CREATE TICKET MODAL */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Raise Support Ticket">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          
          {formError && (
            <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-900/50 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Detail the steps to reproduce or what needs resolution..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="BUG">Bug</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="SUPPORT">Support</option>
              <option value="BILLING">Billing</option>
              <option value="TECHNICAL">Technical</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-350 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {createLoading ? 'Raising...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </Modal>

      {/* TICKET DETAILS MODAL */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedTicket ? `Ticket details: ${selectedTicket.ticketNumber}` : 'Ticket Details'}
      >
        {selectedTicket && (
          <div className="space-y-6">
            
            {/* Title & Star Button */}
            <div className="flex justify-between items-start bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex-1 mr-2">
                <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{selectedTicket.ticketNumber}</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{selectedTicket.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => handleToggleStar(selectedTicket.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title={selectedTicket.starredBy && selectedTicket.starredBy.length > 0 ? 'Unstar Ticket' : 'Star Ticket'}
              >
                <Star className={`w-5 h-5 ${selectedTicket.starredBy && selectedTicket.starredBy.length > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Context Fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-xs">
              <div>
                <p className="text-gray-400 dark:text-gray-500">Status</p>
                <div className="mt-1"><StatusBadge status={selectedTicket.status} /></div>
              </div>
              <div>
                <p className="text-gray-400 dark:text-gray-500">Priority</p>
                <div className="mt-1"><PriorityBadge priority={selectedTicket.priority} /></div>
              </div>
              <div>
                <p className="text-gray-400 dark:text-gray-500">Assignee</p>
                <p className="mt-1 font-semibold text-gray-800 dark:text-gray-300">
                  {selectedTicket.assignee ? selectedTicket.assignee.name : 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-gray-500">Due Date</p>
                <p className="mt-1 font-semibold text-gray-800 dark:text-gray-300">
                  {selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleDateString() : 'None'}
                </p>
              </div>
            </div>

            {/* If Closed, show readonly info. Otherwise allow edit */}
            {selectedTicket.status === 'CLOSED' ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-3 rounded-lg border border-emerald-150 dark:border-emerald-900/50 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>This ticket is closed. Form edits are locked.</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-400">Title</h4>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 font-semibold">{selectedTicket.title}</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-400">Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 whitespace-pre-line">{selectedTicket.description}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="w-1/2 pr-2">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="mt-1 block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="BUG">Bug</option>
                      <option value="FEATURE_REQUEST">Feature Request</option>
                      <option value="SUPPORT">Support</option>
                      <option value="BILLING">Billing</option>
                      <option value="TECHNICAL">Technical</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="flex space-x-2 pt-5">
                    <button
                      type="button"
                      onClick={handleCloseTicket}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      Close Ticket
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      Save Edits
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Reply Input */}
            {selectedTicket.status !== 'CLOSED' && (
              <form onSubmit={handlePostComment} className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <label className="block text-sm font-semibold text-gray-750 dark:text-gray-300">Post Reply</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask for updates or add details..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !commentText.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            )}

          {/* Checklist Section (Read-only for Customers) */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <Checklist ticketId={selectedTicket.id} readOnly={true} />
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
