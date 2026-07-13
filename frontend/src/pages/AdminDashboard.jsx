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
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Trash2,
  AlertCircle,
  MessageSquare,
  Send,
  Calendar,
  Settings,
  LayoutDashboard,
  KanbanSquare,
  Users,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  Plus,
  Eye,
  Edit2,
  TrendingUp,
  Percent,
  Search,
  Star
} from 'lucide-react';

export default function AdminDashboard() {
  // --- TICKETS & GLOBAL STATS STATE ---
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Dashboard Tabs: 'analytics', 'board', or 'employees'
  const [activeTab, setActiveTab] = useState('analytics');


  // Ticket Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setStatusPriority] = useState('');
  const [categoryFilter, setStatusCategory] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Ticket Details Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Ticket Update States
  const [editStatus, setEditStatus] = useState('TO_DO');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editCategory, setEditCategory] = useState('SUPPORT');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [commentText, setCommentText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // --- EMPLOYEE MANAGEMENT STATE ---
  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeFilterRole, setEmployeeFilterRole] = useState('');
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState('');
  const [employeeFilterDept, setEmployeeFilterDept] = useState('');
  const [employeeSortBy, setEmployeeSortBy] = useState('name');
  const [employeeSortOrder, setEmployeeSortOrder] = useState('asc');
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const employeeLimit = 10;

  // Create Employee Modal
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [createEmpName, setCreateEmpName] = useState('');
  const [createEmpEmail, setCreateEmpEmail] = useState('');
  const [createEmpPassword, setCreateEmpPassword] = useState('');
  const [createEmpRole, setCreateEmpRole] = useState('EMPLOYEE');
  const [createEmpDept, setCreateEmpDept] = useState('');
  const [createEmpError, setCreateEmpError] = useState('');

  // Edit Employee Modal
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpEmail, setEditEmpEmail] = useState('');
  const [editEmpPassword, setEditEmpPassword] = useState('');
  const [editEmpRole, setEditEmpRole] = useState('EMPLOYEE');
  const [editEmpDept, setEditEmpDept] = useState('');
  const [editEmpStatus, setEditEmpStatus] = useState('ACTIVE');
  const [editEmpError, setEditEmpError] = useState('');

  // View Employee details Modal
  const [isViewEmployeeOpen, setIsViewEmployeeOpen] = useState(false);
  const [detailedEmployee, setDetailedEmployee] = useState(null);
  const [viewEmpLoading, setViewEmpLoading] = useState(false);

  // --- LIFECYCLE EFFECTS ---
  useEffect(() => {
    fetchTickets();
    fetchUsersList();
    fetchRecentActivity();
  }, [searchVal, statusFilter, priorityFilter, categoryFilter, assigneeFilter]);

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
    }
  }, [activeTab, employeePage, employeeSearch, employeeFilterRole, employeeFilterStatus, employeeFilterDept, employeeSortBy, employeeSortOrder]);

  // --- DATA FETCHING METHODS ---
  const fetchTickets = async () => {
    try {
      if (activeTab === 'board') setLoading(true);
      const params = {};
      if (searchVal) params.search = searchVal;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (assigneeFilter) params.assigneeId = assigneeFilter;

      const response = await api.get('/tickets', { params });
      setTickets(response.data.data.tickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
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

  const fetchSingleTicket = async (id) => {
    try {
      const response = await api.get(`/tickets/${id}`);
      const ticket = response.data.data.ticket;
      setSelectedTicket(ticket);

      setEditStatus(ticket.status);
      setEditPriority(ticket.priority);
      setEditCategory(ticket.category);
      setEditAssigneeId(ticket.assigneeId ? ticket.assigneeId.toString() : '');
      setEditDueDate(ticket.dueDate ? new Date(ticket.dueDate).toISOString().substring(0, 10) : '');
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    }
  };

  // --- EMPLOYEE CRUD API HANDLERS ---
  const fetchEmployees = async () => {
    try {
      setEmployeeLoading(true);
      const params = {
        page: employeePage,
        limit: employeeLimit,
        search: employeeSearch,
        role: employeeFilterRole,
        status: employeeFilterStatus,
        department: employeeFilterDept,
        sortBy: employeeSortBy,
        sortOrder: employeeSortOrder,
      };

      const response = await api.get('/employees', { params });
      setEmployees(response.data.data.employees);
      setTotalEmployees(response.data.data.totalCount);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setEmployeeLoading(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setCreateEmpError('');
    setActionLoading(true);

    try {
      await api.post('/employees', {
        name: createEmpName,
        email: createEmpEmail,
        password: createEmpPassword,
        role: createEmpRole,
        department: createEmpDept || null,
      });

      setIsCreateEmployeeOpen(false);
      setCreateEmpName('');
      setCreateEmpEmail('');
      setCreateEmpPassword('');
      setCreateEmpRole('EMPLOYEE');
      setCreateEmpDept('');

      fetchEmployees();
      fetchUsersList(); // Refresh assignees dropdown
    } catch (err) {
      setCreateEmpError(err.response?.data?.message || 'Failed to create employee.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditEmployeeClick = (emp) => {
    setSelectedEmployee(emp);
    setEditEmpName(emp.name);
    setEditEmpEmail(emp.email);
    setEditEmpRole(emp.role);
    setEditEmpDept(emp.department || '');
    setEditEmpStatus(emp.status);
    setEditEmpPassword('');
    setEditEmpError('');
    setIsEditEmployeeOpen(true);
  };

  const handleEditEmployeeSubmit = async (e) => {
    e.preventDefault();
    setEditEmpError('');
    setActionLoading(true);

    try {
      const payload = {
        name: editEmpName,
        email: editEmpEmail,
        role: editEmpRole,
        department: editEmpDept || null,
        status: editEmpStatus,
      };

      if (editEmpPassword.trim()) {
        payload.password = editEmpPassword;
      }

      await api.patch(`/employees/${selectedEmployee.id}`, payload);

      setIsEditEmployeeOpen(false);
      setEditEmpPassword('');
      fetchEmployees();
      fetchUsersList(); // Refresh assignees dropdown
    } catch (err) {
      setEditEmpError(err.response?.data?.message || 'Failed to update employee.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmployee = async (empId) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action is permanent.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/employees/${empId}`);
      fetchEmployees();
      fetchUsersList();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete employee.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewEmployee = async (empId) => {
    setIsViewEmployeeOpen(true);
    setViewEmpLoading(true);
    try {
      const response = await api.get(`/employees/${empId}`);
      setDetailedEmployee(response.data.data);
    } catch (err) {
      console.error('Error fetching employee details:', err);
      setIsViewEmployeeOpen(false);
    } finally {
      setViewEmpLoading(false);
    }
  };

  // --- TICKET CONTROLS ---
  const handleOpenDetails = (ticket) => {
    fetchSingleTicket(ticket.id);
    setIsDetailsOpen(true);
  };

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

  const handleAdminUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await api.patch(`/tickets/${selectedTicket.id}`, {
        status: editStatus,
        priority: editPriority,
        category: editCategory,
        assigneeId: editAssigneeId ? parseInt(editAssigneeId, 10) : null,
        dueDate: editDueDate || null,
      });
      await fetchSingleTicket(selectedTicket.id);
      fetchTickets();
      fetchRecentActivity();
    } catch (err) {
      console.error('Error updating ticket properties:', err);
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
      fetchRecentActivity();
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket || !window.confirm('Are you sure you want to delete this ticket? This action is permanent.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/tickets/${selectedTicket.id}`);
      setIsDetailsOpen(false);
      fetchTickets();
      fetchRecentActivity();
    } catch (err) {
      console.error('Error deleting ticket:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // --- ANALYTICS COMPILATIONS ---
  const totalTicketsCount = tickets.length;
  const openCount = tickets.filter(t => t.status !== 'DONE' && t.status !== 'CLOSED').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const closedCount = tickets.filter(t => t.status === 'CLOSED').length;

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

  // Initials Bubble helper
  const renderAvatar = (name) => {
    const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-sm">
        {initials}
      </div>
    );
  };

  const handleSort = (field) => {
    if (employeeSortBy === field) {
      setEmployeeSortOrder(employeeSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setEmployeeSortBy(field);
      setEmployeeSortOrder('asc');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar 
          title="System Administrator Panel" 
          searchVal={activeTab === 'board' ? searchVal : undefined} 
          setSearchVal={activeTab === 'board' ? setSearchVal : undefined} 
          onMenuClick={() => setSidebarOpen(true)}
        />


        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-6">
          
          {/* 1. WORKFORCE ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fadeIn">
              {/* KPI metrics row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-450 dark:text-gray-500 uppercase tracking-wider">Total Tickets</p>
                    <h3 className="text-2xl font-black text-gray-950 dark:text-white mt-1">{totalTicketsCount}</h3>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-455 dark:text-gray-500 uppercase tracking-wider">Active Open</p>
                    <h3 className="text-2xl font-black text-gray-950 dark:text-white mt-1">{openCount}</h3>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-455 dark:text-gray-500 uppercase tracking-wider">In Progress</p>
                    <h3 className="text-2xl font-black text-gray-955 dark:text-white mt-1">{inProgressCount}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-455 dark:text-gray-500 uppercase tracking-wider">Closed</p>
                    <h3 className="text-2xl font-black text-gray-955 dark:text-white mt-1">{closedCount}</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Charts & Timeline grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Pie Chart */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
                      <h4 className="text-sm font-bold text-gray-750 dark:text-gray-300 mb-4">Tickets by Status</h4>
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
                      <h4 className="text-sm font-bold text-gray-750 dark:text-gray-300 mb-4">Tickets by Category</h4>
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

                  {/* Priority Distribution */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm transition-colors">
                    <h4 className="text-sm font-bold text-gray-750 dark:text-gray-300 mb-4">Priority Distribution</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getPriorityChartData()}>
                          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip cursor={{ fill: 'transparent' }} />
                          <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Global Activity Timeline */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex flex-col h-[650px] overflow-hidden transition-colors">
                  <h4 className="text-sm font-bold text-gray-805 dark:text-gray-300 flex items-center space-x-2 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    <span>Global Activity Timeline</span>
                  </h4>
                  <div className="flex-1 overflow-y-auto pt-4 space-y-5 pr-1">
                    {activities.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">No historical activity logged yet.</p>
                    ) : (
                      activities.map((log) => (
                        <div key={log.id} className="text-xs border-b border-gray-100 dark:border-gray-900 pb-3 last:border-b-0 space-y-1.5">
                          <div className="flex items-center justify-between text-gray-450 dark:text-gray-500">
                            <span className="font-semibold text-indigo-650 dark:text-indigo-400 font-mono text-[10px]">
                              {log.ticket.ticketNumber}
                            </span>
                            <span>
                              {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-gray-850 dark:text-gray-200">
                            <span className="font-bold">{log.user.name}</span> ({log.user.role}) performed <span className="font-semibold text-indigo-600 dark:text-indigo-400">{log.action}</span>
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
          )}

          {/* 2. TICKETS BOARD TAB */}
          {activeTab === 'board' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filter controls panel */}
              <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-sm transition-colors">
                
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

                <div>
                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="">All Assignees</option>
                    <option value="null">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id.toString()}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tickets grid */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner />
                </div>
              ) : tickets.length === 0 ? (
                <EmptyState message="No tickets matched your filter parameters." />
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
            </div>
          )}

          {/* 3. EMPLOYEE MANAGEMENT TAB */}
          {activeTab === 'employees' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Actions & Filters Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm text-sm transition-colors">
                
                {/* Search & Filters */}
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                  
                  {/* Search bar */}
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={employeeSearch}
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setEmployeePage(1);
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>

                  {/* Role filter */}
                  <div>
                    <select
                      value={employeeFilterRole}
                      onChange={(e) => {
                        setEmployeeFilterRole(e.target.value);
                        setEmployeePage(1);
                      }}
                      className="px-3 py-2 bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Roles</option>
                      <option value="EMPLOYEE">Staff (EMPLOYEE)</option>
                      <option value="ADMIN">Administrators (ADMIN)</option>
                    </select>
                  </div>

                  {/* Status filter */}
                  <div>
                    <select
                      value={employeeFilterStatus}
                      onChange={(e) => {
                        setEmployeeFilterStatus(e.target.value);
                        setEmployeePage(1);
                      }}
                      className="px-3 py-2 bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  {/* Department filter */}
                  <div className="relative w-full md:w-44">
                    <input
                      type="text"
                      placeholder="Filter Department..."
                      value={employeeFilterDept}
                      onChange={(e) => {
                        setEmployeeFilterDept(e.target.value);
                        setEmployeePage(1);
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-900 text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                </div>

                {/* Add Employee Button */}
                <button
                  type="button"
                  onClick={() => setIsCreateEmployeeOpen(true)}
                  className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Employee</span>
                </button>

              </div>

              {/* Employee table */}
              {employeeLoading ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner />
                </div>
              ) : employees.length === 0 ? (
                <EmptyState message="No employees matched your criteria." />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-left text-sm text-gray-700 dark:text-gray-300">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-450 dark:text-gray-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Employee</th>
                          <th className="px-6 py-4 cursor-pointer hover:text-indigo-600" onClick={() => handleSort('role')}>Role</th>
                          <th className="px-6 py-4 cursor-pointer hover:text-indigo-600" onClick={() => handleSort('department')}>Department</th>
                          <th className="px-6 py-4 text-center">Workload</th>
                          <th className="px-6 py-4 text-center">Tickets (Assigned / Open / Done)</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          <th className="px-6 py-4">Last Activity</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-750 font-medium">
                        {employees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition-colors">
                            <td className="px-6 py-4 flex items-center space-x-3">
                              {renderAvatar(emp.name)}
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white text-sm">{emp.name}</div>
                                <div className="text-xs text-gray-450 dark:text-gray-400 font-semibold">{emp.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                emp.role === 'ADMIN' 
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' 
                                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                              }`}>
                                {emp.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                              {emp.department || <span className="text-gray-400 italic">None</span>}
                            </td>
                            <td className="px-6 py-4 text-center font-bold">
                              <span className="text-xs text-gray-700 dark:text-gray-305">
                                {emp.assignedTicketsCount} ({emp.completedTicketsCount} resolved)
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col space-y-1 w-32 mx-auto">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-gray-500 dark:text-gray-400">{emp.openTicketsCount} active / 10 max</span>
                                  <span className={`${
                                    emp.openTicketsCount <= 7
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : emp.openTicketsCount <= 10
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}>{Math.round((emp.openTicketsCount / 10) * 100)}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-750 rounded-full overflow-hidden border border-gray-200/50 dark:border-gray-800">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      emp.openTicketsCount <= 7
                                        ? 'bg-emerald-500'
                                        : emp.openTicketsCount <= 10
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.round((emp.openTicketsCount / 10) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                                emp.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                                  : 'bg-gray-150 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {emp.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                              {new Date(emp.lastActivity).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleViewEmployee(emp.id)}
                                  className="p-1.5 text-gray-450 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                                  title="View Stats & Analytics"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditEmployeeClick(emp)}
                                  className="p-1.5 text-gray-450 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                                  title="Edit Employee"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  disabled={actionLoading}
                                  className="p-1.5 text-gray-455 hover:text-red-600 dark:text-gray-405 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors disabled:opacity-50"
                                  title="Delete Employee"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  {totalEmployees > employeeLimit && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-750 text-sm">
                      <div className="text-gray-500 dark:text-gray-400 font-medium">
                        Showing {(employeePage - 1) * employeeLimit + 1} - {Math.min(employeePage * employeeLimit, totalEmployees)} of {totalEmployees} employees
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          disabled={employeePage === 1}
                          onClick={() => setEmployeePage(p => Math.max(p - 1, 1))}
                          className="px-3 py-1.5 border border-gray-250 dark:border-gray-655 rounded-xl hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-850 font-semibold disabled:opacity-50 transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={employeePage * employeeLimit >= totalEmployees}
                          onClick={() => setEmployeePage(p => p + 1)}
                          className="px-3 py-1.5 border border-gray-250 dark:border-gray-655 rounded-xl hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-850 font-semibold disabled:opacity-50 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* 4. STARRED TICKETS TAB */}
          {activeTab === 'starred' && (
            <StarredTicketList onTicketClick={handleOpenDetails} />
          )}

        </main>
      </div>

      {/* --- TICKET DETAILS & CONTROLS MODAL --- */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedTicket ? `Manage Ticket: ${selectedTicket.ticketNumber}` : 'Ticket Manager'}
      >
        {selectedTicket && (
          <div className="space-y-6">
            
            {/* Meta details */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-105 dark:border-gray-750 space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="text-base font-bold text-gray-905 dark:text-white flex-1 mr-2">{selectedTicket.title}</h3>
                <button
                  type="button"
                  onClick={() => handleToggleStar(selectedTicket.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-gray-150 dark:hover:bg-gray-800 transition-colors animate-all"
                  title={selectedTicket.starredBy && selectedTicket.starredBy.length > 0 ? 'Unstar Ticket' : 'Star Ticket'}
                >
                  <Star className={`w-5 h-5 ${selectedTicket.starredBy && selectedTicket.starredBy.length > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                </button>
              </div>
              <p className="text-xs text-gray-550 dark:text-gray-400">
                Raised by <span className="font-semibold text-gray-700 dark:text-gray-305">{selectedTicket.customer?.name}</span> ({selectedTicket.customer?.email})
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-805 leading-relaxed whitespace-pre-line">
                {selectedTicket.description}
              </p>
            </div>

            {/* Parameter adjustments */}
            <form onSubmit={handleAdminUpdate} className="space-y-4">
              <h4 className="text-xs font-bold text-gray-455 dark:text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                <Settings className="w-3.5 h-3.5" />
                <span>Ticket Settings</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-550 dark:text-gray-400">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="TO_DO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-555 dark:text-gray-400">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Assign To</label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id.toString()}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={handleDeleteTicket}
                  disabled={actionLoading}
                  className="flex items-center space-x-1 px-4 py-2 border border-red-200 text-red-650 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Ticket</span>
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  Apply Changes
                </button>
              </div>
            </form>

            {/* Comment Section */}
            <form onSubmit={handlePostComment} className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
              <label className="block text-sm font-semibold text-gray-805 dark:text-gray-300">Add Reply / Update Customer</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Post comment or instructions..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !commentText.trim()}
                  className="p-2.5 bg-indigo-605 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Attachments Section */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <AttachmentsSection
                ticketId={selectedTicket.id}
                attachments={selectedTicket.attachments || []}
                onAttachmentChange={() => fetchSingleTicket(selectedTicket.id)}
                readOnly={selectedTicket.status === 'CLOSED'}
              />
            </div>

            {/* Checklist Section */}
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

      {/* --- CREATE EMPLOYEE MODAL --- */}
      <Modal
        isOpen={isCreateEmployeeOpen}
        onClose={() => setIsCreateEmployeeOpen(false)}
        title="Add New Workforce Member"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          {createEmpError && (
            <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3 rounded-xl border border-red-150 dark:border-red-900/50 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{createEmpError}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Full Name</label>
              <input
                type="text"
                required
                value={createEmpName}
                onChange={(e) => setCreateEmpName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-605 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Jane Staff"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Email Address</label>
              <input
                type="email"
                required
                value={createEmpEmail}
                onChange={(e) => setCreateEmpEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-605 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Password</label>
              <input
                type="password"
                required
                value={createEmpPassword}
                onChange={(e) => setCreateEmpPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-605 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Role</label>
                <select
                  value={createEmpRole}
                  onChange={(e) => setCreateEmpRole(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-605 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="EMPLOYEE">Staff (EMPLOYEE)</option>
                  <option value="ADMIN">Admin (ADMIN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Department</label>
                <input
                  type="text"
                  value={createEmpDept}
                  onChange={(e) => setCreateEmpDept(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Engineering"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsCreateEmployeeOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT EMPLOYEE MODAL --- */}
      <Modal
        isOpen={isEditEmployeeOpen}
        onClose={() => setIsEditEmployeeOpen(false)}
        title={selectedEmployee ? `Edit Employee: ${selectedEmployee.name}` : 'Edit Employee'}
      >
        <form onSubmit={handleEditEmployeeSubmit} className="space-y-4">
          {editEmpError && (
            <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400 p-3 rounded-xl border border-red-150 dark:border-red-900/50 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{editEmpError}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Full Name</label>
              <input
                type="text"
                required
                value={editEmpName}
                onChange={(e) => setEditEmpName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Email Address</label>
              <input
                type="email"
                required
                value={editEmpEmail}
                onChange={(e) => setEditEmpEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">New Password (optional)</label>
              <input
                type="password"
                value={editEmpPassword}
                onChange={(e) => setEditEmpPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Leave blank to keep current"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Role</label>
                <select
                  value={editEmpRole}
                  onChange={(e) => setEditEmpRole(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="EMPLOYEE">Staff (EMPLOYEE)</option>
                  <option value="ADMIN">Admin (ADMIN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Department</label>
                <input
                  type="text"
                  value={editEmpDept}
                  onChange={(e) => setEditEmpDept(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Status</label>
              <select
                value={editEmpStatus}
                onChange={(e) => setEditEmpStatus(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsEditEmployeeOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* --- VIEW EMPLOYEE DETAILS MODAL --- */}
      <Modal
        isOpen={isViewEmployeeOpen}
        onClose={() => setIsViewEmployeeOpen(false)}
        title={detailedEmployee ? `Employee Profile: ${detailedEmployee.name}` : 'Employee Performance Profile'}
      >
        {viewEmpLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : detailedEmployee && (
          <div className="space-y-6 text-sm">
            
            {/* Employee info card */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-750 flex items-center space-x-4">
              {renderAvatar(detailedEmployee.name)}
              <div>
                <h4 className="text-base font-bold text-gray-905 dark:text-white">{detailedEmployee.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{detailedEmployee.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Department: <span className="font-semibold text-gray-700 dark:text-gray-300">{detailedEmployee.department || 'None'}</span> | Role: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{detailedEmployee.role}</span>
                </p>
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-750 text-center">
                <p className="text-xs font-semibold text-gray-450 dark:text-gray-500 uppercase tracking-wider">Assigned</p>
                <h5 className="text-lg font-bold text-gray-900 dark:text-white mt-1">{detailedEmployee.stats.assignedTicketsCount}</h5>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-750 text-center">
                <p className="text-xs font-semibold text-gray-455 dark:text-gray-500 uppercase tracking-wider">Active Open</p>
                <h5 className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{detailedEmployee.stats.openTicketsCount}</h5>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-750 text-center">
                <p className="text-xs font-semibold text-gray-455 dark:text-gray-500 uppercase tracking-wider">Completed</p>
                <h5 className="text-lg font-bold text-emerald-650 dark:text-emerald-450 mt-1">{detailedEmployee.stats.completedTicketsCount}</h5>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-750 text-center">
                <p className="text-xs font-semibold text-gray-455 dark:text-gray-500 uppercase tracking-wider">Workload</p>
                <h5 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">{detailedEmployee.stats.workload} open</h5>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-750 text-center">
                <p className="text-xs font-semibold text-gray-455 dark:text-gray-500 uppercase tracking-wider">Avg Resolution</p>
                <h5 className="text-lg font-bold text-gray-900 dark:text-white mt-1 flex items-center justify-center space-x-1">
                  <span>{detailedEmployee.stats.avgResolutionTime}h</span>
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                </h5>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-750 text-center">
                <p className="text-xs font-semibold text-gray-455 dark:text-gray-500 uppercase tracking-wider">Completion</p>
                <h5 className="text-lg font-bold text-gray-900 dark:text-white mt-1 flex items-center justify-center space-x-1">
                  <span>{detailedEmployee.stats.completionRate}%</span>
                  <Percent className="w-3.5 h-3.5 text-gray-400" />
                </h5>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-750 text-center">
                <p className="text-xs font-semibold text-gray-455 dark:text-gray-500 uppercase tracking-wider">Overdue</p>
                <h5 className="text-lg font-bold text-rose-650 dark:text-rose-400 mt-1">{detailedEmployee.stats.overdueCount}</h5>
              </div>
            </div>

            {/* Last completed ticket banner details */}
            {detailedEmployee.stats.lastCompletedTicket && (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-3.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 text-xs">
                <span className="font-bold text-indigo-700 dark:text-indigo-400">Last Completed Ticket:</span>{' '}
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {detailedEmployee.stats.lastCompletedTicket.ticketNumber}
                </span>{' '}
                - <span className="font-medium text-gray-800 dark:text-gray-200">{detailedEmployee.stats.lastCompletedTicket.title}</span>{' '}
                <span className="text-gray-405 dark:text-gray-500">
                  (resolved {new Date(detailedEmployee.stats.lastCompletedTicket.updatedAt).toLocaleDateString()})
                </span>
              </div>
            )}

            {/* Active Tickets List */}
            <div className="space-y-2">
              <h5 className="font-bold text-gray-800 dark:text-gray-300">Active Assigned Tickets</h5>
              {detailedEmployee.currentTickets.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">No active tickets assigned.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {detailedEmployee.currentTickets.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div>
                        <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 font-mono mr-2">{t.ticketNumber}</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{t.title}</span>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recently Completed Tickets */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <h5 className="font-bold text-gray-800 dark:text-gray-300">Recently Completed</h5>
              {detailedEmployee.recentCompletedTickets.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">No tickets recently completed.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {detailedEmployee.recentCompletedTickets.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div>
                        <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 font-mono mr-2">{t.ticketNumber}</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-205 text-xs">{t.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Done: {new Date(t.updatedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
