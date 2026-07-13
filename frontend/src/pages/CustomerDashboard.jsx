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
import AttachmentsSection from '../components/AttachmentsSection';
import { Plus, X, AlertCircle, MessageSquare, Send, CheckCircle2, Star, BarChart3, Clock, Users, CheckCircle, FileSpreadsheet, Eye, Download, Trash2, LayoutDashboard, Paperclip, TrendingUp, Search } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CustomerDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activities, setActivities] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);


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
      fetchRecentActivity();
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
  const [createFiles, setCreateFiles] = useState([]);


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
      
      // Only apply filters when viewing the ticket board
      if (activeTab === 'board') {
        if (searchVal) params.search = searchVal;
        if (statusFilter) params.status = statusFilter;
        if (priorityFilter) params.priority = priorityFilter;
        if (categoryFilter) params.category = categoryFilter;
      }

      const response = await api.get('/tickets', { params });
      setTickets(response.data.data.tickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await api.get('/tickets/activity');
      setActivities(response.data.data.activity || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchRecentActivity();
  }, [activeTab, searchVal, statusFilter, priorityFilter, categoryFilter]);

  // --- ANALYTICS COMPILATIONS ---
  const totalTicketsCount = tickets.length;
  const openCount = tickets.filter(t => t.status !== 'DONE' && t.status !== 'CLOSED').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'DONE').length;
  const closedCount = tickets.filter(t => t.status === 'CLOSED').length;
  const starredCount = tickets.filter(t => t.starredBy && t.starredBy.length > 0).length;

  const overdueCount = tickets.filter(t => 
    t.status !== 'DONE' && 
    t.status !== 'CLOSED' && 
    t.dueDate && 
    new Date(t.dueDate) < new Date()
  ).length;

  const resolvedAndClosedTickets = tickets.filter(t => 
    (t.status === 'DONE' || t.status === 'CLOSED') && t.createdAt && t.updatedAt
  );
  let avgResolutionTime = 0;
  if (resolvedAndClosedTickets.length > 0) {
    const totalDuration = resolvedAndClosedTickets.reduce((sum, t) => {
      const diff = new Date(t.updatedAt) - new Date(t.createdAt);
      return sum + diff;
    }, 0);
    avgResolutionTime = Math.round((totalDuration / (1000 * 60 * 60 * resolvedAndClosedTickets.length)) * 10) / 10;
  }

  const getStatusChartData = () => [
    { name: 'To Do', value: tickets.filter(t => t.status === 'TO_DO').length, color: '#6366f1' },
    { name: 'In Progress', value: tickets.filter(t => t.status === 'IN_PROGRESS').length, color: '#f59e0b' },
    { name: 'Done', value: tickets.filter(t => t.status === 'DONE').length, color: '#10b981' },
    { name: 'Closed', value: tickets.filter(t => t.status === 'CLOSED').length, color: '#6b7280' },
  ];

  const getPriorityChartData = () => [
    { name: 'Low', count: tickets.filter(t => t.priority === 'LOW').length },
    { name: 'Medium', count: tickets.filter(t => t.priority === 'MEDIUM').length },
    { name: 'High', count: tickets.filter(t => t.priority === 'HIGH').length },
    { name: 'Critical', count: tickets.filter(t => t.priority === 'CRITICAL').length },
  ];

  const getCategoryChartData = () => [
    { name: 'Bug', value: tickets.filter(t => t.category === 'BUG').length, color: '#ef4444' },
    { name: 'Feature Request', value: tickets.filter(t => t.category === 'FEATURE_REQUEST').length, color: '#8b5cf6' },
    { name: 'Support', value: tickets.filter(t => t.category === 'SUPPORT').length, color: '#06b6d4' },
    { name: 'Billing', value: tickets.filter(t => t.category === 'BILLING').length, color: '#ec4899' },
    { name: 'Technical', value: tickets.filter(t => t.category === 'TECHNICAL').length, color: '#3b82f6' },
    { name: 'Other', value: tickets.filter(t => t.category === 'OTHER').length, color: '#10b981' },
  ];

  const getMonthlyChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = {};
    const now = new Date();
    
    // Last 6 months initialization
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = {
        name: `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
        count: 0
      };
    }

    tickets.forEach(t => {
      if (!t.createdAt) return;
      const d = new Date(t.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].count += 1;
      }
    });

    return Object.values(monthlyData);
  };

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
      // 1. Create the ticket first
      const response = await api.post('/tickets', { title, description, category });
      const createdTicket = response.data.data.ticket;

      // 2. Upload any attachments selected
      if (createFiles.length > 0) {
        const uploadPromises = createFiles.map((file) => {
          const formData = new FormData();
          formData.append('file', file);
          return api.post(`/tickets/${createdTicket.id}/attachments`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        });
        await Promise.all(uploadPromises);
      }

      // 3. Reset states and close modal
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setCategory('SUPPORT');
      setCreateFiles([]);
      fetchTickets();
      fetchRecentActivity();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create ticket with attachments.');
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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar 
          title={
            activeTab === 'dashboard' 
              ? 'Customer Analytics Dashboard' 
              : activeTab === 'starred' 
              ? 'Starred Tickets' 
              : 'My Support Tickets'
          } 
          searchVal={activeTab === 'board' ? searchVal : undefined} 
          setSearchVal={activeTab === 'board' ? setSearchVal : undefined} 
          onMenuClick={() => setSidebarOpen(true)}
        />


        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Mobile/Tablet Quick Actions (visible on mobile, hidden on desktop xl views) */}
              <div className="xl:hidden bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm transition-colors space-y-4">
                <h4 className="text-xs sm:text-sm font-bold text-gray-850 dark:text-gray-350">Quick Actions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all text-center flex flex-col items-center justify-center space-y-1"
                  >
                    <Plus className="w-5 h-5 animate-pulse" />
                    <span>Raise Ticket</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('starred')}
                    className="p-3 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/10 dark:hover:bg-yellow-950/25 text-yellow-600 dark:text-yellow-500 rounded-xl transition-all text-center flex flex-col items-center justify-center space-y-1"
                  >
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <span>View Starred</span>
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('IN_PROGRESS');
                      setActiveTab('board');
                    }}
                    className="p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-blue-600 dark:text-indigo-400 rounded-xl transition-all text-center flex flex-col items-center justify-center space-y-1"
                  >
                    <Clock className="w-5 h-5" />
                    <span>View Open</span>
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('CLOSED');
                      setActiveTab('board');
                    }}
                    className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition-all text-center flex flex-col items-center justify-center space-y-1"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>View Closed</span>
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">

                {/* Total */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Tickets</p>
                    <h3 className="text-2xl font-black text-gray-950 dark:text-white mt-1">{totalTicketsCount}</h3>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                </div>

                {/* Open */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Open Tickets</p>
                    <h3 className="text-2xl font-black text-gray-950 dark:text-white mt-1">{openCount}</h3>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                {/* In Progress */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">In Progress</p>
                    <h3 className="text-2xl font-black text-gray-950 dark:text-white mt-1">{inProgressCount}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                {/* Resolved */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Resolved</p>
                    <h3 className="text-2xl font-black text-gray-950 dark:text-white mt-1">{resolvedCount}</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                {/* Closed */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Closed</p>
                    <h3 className="text-2xl font-black text-gray-950 dark:text-white mt-1">{closedCount}</h3>
                  </div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>

                {/* Overdue */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Overdue</p>
                    <h3 className="text-2xl font-black text-gray-950 dark:text-white mt-1">{overdueCount}</h3>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>

                {/* Starred */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Starred</p>
                    <h3 className="text-2xl font-black text-gray-950 dark:text-white mt-1">{starredCount}</h3>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 rounded-xl">
                    <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                  </div>
                </div>

                {/* Avg Resolution Time */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Avg Resolution</p>
                    <h3 className="text-2xl font-black text-gray-955 dark:text-white mt-1">{avgResolutionTime} hrs</h3>
                  </div>
                  <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Grid for Charts & Widgets */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Charts */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Pie Chart */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Tickets by Status</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getStatusChartData()}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, percent }) => percent > 0 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                              labelLine={false}
                            >
                              {getStatusChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Category Donut Chart */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Tickets by Category</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getCategoryChartData()}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              label={({ name, percent }) => percent > 0 ? `${name}` : ''}
                              labelLine={false}
                            >
                              {getCategoryChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Priority Bar Chart */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm transition-colors">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Priority Distribution</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getPriorityChartData()}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} maxBarSize={45} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Monthly Ticket Creation */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm transition-colors">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Monthly Ticket Creation</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getMonthlyChartData()}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} maxBarSize={45} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Actions & Timeline */}
                <div className="space-y-6">
                  {/* Desktop Quick Actions (hidden on mobile, visible on desktop xl views) */}
                  <div className="hidden xl:block bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm transition-colors space-y-4">
                    <h4 className="text-sm font-bold text-gray-850 dark:text-gray-350">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="p-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all text-center flex flex-col items-center justify-center space-y-1"
                      >
                        <Plus className="w-5 h-5 animate-pulse" />
                        <span>Raise Ticket</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('starred')}
                        className="p-3 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/10 dark:hover:bg-yellow-950/25 text-yellow-600 dark:text-yellow-500 rounded-xl transition-all text-center flex flex-col items-center justify-center space-y-1"
                      >
                        <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                        <span>View Starred</span>
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('IN_PROGRESS');
                          setActiveTab('board');
                        }}
                        className="p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl transition-all text-center flex flex-col items-center justify-center space-y-1"
                      >
                        <Clock className="w-5 h-5" />
                        <span>View Open</span>
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('CLOSED');
                          setActiveTab('board');
                        }}
                        className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition-all text-center flex flex-col items-center justify-center space-y-1"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>View Closed</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer activity logs */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex flex-col h-[400px] overflow-hidden transition-colors">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-300 flex items-center space-x-2 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      <span>Ticket Activity Timeline</span>
                    </h4>
                    <div className="flex-1 overflow-y-auto pt-4 space-y-5 pr-1">
                      {activities.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">No ticket activities logged yet.</p>
                      ) : (
                        activities.map((log) => (
                          <div key={log.id} className="text-xs border-b border-gray-100 dark:border-gray-900 pb-3 last:border-b-0 space-y-1.5 animate-fadeIn">
                            <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">
                                {log.ticket?.ticketNumber ?? 'N/A'}
                              </span>
                              <span>
                                {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200">
                              <span className="font-bold">{log.user?.name ?? 'Unknown'}</span> ({log.user?.role ?? '—'}) performed <span className="font-semibold text-indigo-600 dark:text-indigo-400">{log.action}</span>
                            </p>
                            {log.details && (
                              <p className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 p-2 rounded-lg italic truncate">
                                {log.details}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'board' && (
            <>
              {/* Header Action & Filter Panel */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                
                {/* Mobile Search Input */}
                <div className="sm:hidden relative w-full">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchVal || ''}
                    onChange={(e) => setSearchVal(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
            
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachments (Max 5 files, 10MB each)</label>
            <input
              type="file"
              multiple
              onChange={(e) => {
                const filesArray = Array.from(e.target.files);
                const allowedExts = ['jpg', 'jpeg', 'png', 'pdf', 'txt', 'doc', 'docx'];
                const validFiles = [];
                let hasError = false;

                if (createFiles.length + filesArray.length > 5) {
                  setFormError('Maximum of 5 attachments allowed per ticket.');
                  return;
                }

                filesArray.forEach((file) => {
                  const ext = file.name.split('.').pop().toLowerCase();
                  if (!allowedExts.includes(ext)) {
                    setFormError(`Only jpg, jpeg, png, pdf, txt, doc, and docx files are allowed. Ignored: ${file.name}`);
                    hasError = true;
                    return;
                  }
                  if (file.size > 10 * 1024 * 1024) {
                    setFormError(`File size exceeds 10 MB. Ignored: ${file.name}`);
                    hasError = true;
                    return;
                  }
                  validFiles.push(file);
                });

                if (!hasError) setFormError('');
                setCreateFiles((prev) => [...prev, ...validFiles]);
              }}
              className="mt-1 block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 file:cursor-pointer hover:file:bg-indigo-100"
              accept=".jpg,.jpeg,.png,.pdf,.txt,.doc,.docx"
              disabled={createLoading}
            />

            {createFiles.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                {createFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs animate-fadeIn">
                    <span className="truncate max-w-[200px] font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setCreateFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
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

          {/* Attachments Section */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <AttachmentsSection
              ticketId={selectedTicket.id}
              attachments={selectedTicket.attachments || []}
              onAttachmentChange={() => fetchSingleTicket(selectedTicket.id)}
              readOnly={selectedTicket.status === 'CLOSED'}
            />
          </div>

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
