import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from './Modal';
import { Kanban, LogOut, ShieldAlert, UserCheck, Users, BarChart3, Briefcase, KeyRound, AlertCircle, CheckCircle, Star } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }) {
  const { user, logout } = useAuth();
  
  // Self-contained change password modal state
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTabClick = (tab) => {
    if (setActiveTab) setActiveTab(tab);
    if (onClose) onClose();
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/change-password', {
        email: user.email,
        oldPassword,
        newPassword,
      });
      setSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close modal shortly after success
      setTimeout(() => {
        setIsChangePassOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden transition-opacity duration-300 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col h-screen select-none border-r border-slate-800 transition-transform duration-300 ease-in-out transform lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        
        {/* Branding */}
        <div className="flex items-center space-x-3 p-6 border-b border-slate-800">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
            <Kanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Tickety</h1>
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Workforce Portal</p>
          </div>
        </div>

        {/* User Section */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-150">{user?.name}</p>
              <span className={`inline-flex items-center space-x-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                user?.role === 'ADMIN' 
                  ? 'bg-red-950/40 text-red-400 border border-red-900/50' 
                  : user?.role === 'EMPLOYEE'
                  ? 'bg-indigo-950/40 text-indigo-405 border border-indigo-900/50'
                  : 'bg-green-950/40 text-green-400 border border-green-900/50'
              }`}>
                {user?.role === 'ADMIN' ? (
                  <>
                    <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                    <span>Admin</span>
                  </>
                ) : user?.role === 'EMPLOYEE' ? (
                  <>
                    <Briefcase className="w-3 h-3 flex-shrink-0" />
                    <span>Staff</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3 h-3 flex-shrink-0" />
                    <span>Customer</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
          
          {user?.role === 'ADMIN' && (
            <>
              {/* Workspace Section */}
              <div className="space-y-1.5">
                <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Workspace
                </div>
                <button
                  type="button"
                  onClick={() => handleTabClick('board')}
                  className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'board'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Kanban className="w-4 h-4 text-indigo-400" />
                  <span>Tickets Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabClick('starred')}
                  className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'starred'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>Starred Tickets</span>
                </button>
              </div>

              {/* Workforce Section */}
              <div className="space-y-1.5 pt-2">
                <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Workforce Management
                </div>
                <button
                  type="button"
                  onClick={() => handleTabClick('employees')}
                  className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'employees'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Employee Management</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabClick('analytics')}
                  className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>Workforce Analytics</span>
                </button>
              </div>
            </>
          )}

          {user?.role === 'CUSTOMER' && (
            <div className="space-y-1.5">
              <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Workspace
              </div>
              <button
                type="button"
                onClick={() => handleTabClick('dashboard')}
                className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>My Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('board')}
                className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'board'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Kanban className="w-4 h-4 text-indigo-400" />
                <span>My Support Tickets</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('starred')}
                className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'starred'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Starred Tickets</span>
              </button>
            </div>
          )}

          {user?.role === 'EMPLOYEE' && (
            <div className="space-y-1.5">
              <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Workspace
              </div>
              <button
                type="button"
                onClick={() => handleTabClick('board')}
                className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'board'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Kanban className="w-4 h-4 text-indigo-400" />
                <span>Assigned Tickets</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('starred')}
                className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'starred'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Starred Tickets</span>
              </button>
            </div>
          )}

        </div>

        {/* User Actions & Sign Out */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={() => setIsChangePassOpen(true)}
            className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-slate-800/40 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/70 rounded-xl text-xs font-semibold transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            <span>Change Password</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      {/* --- CHANGE PASSWORD MODAL --- */}
      <Modal
        isOpen={isChangePassOpen}
        onClose={() => {
          setIsChangePassOpen(false);
          setError('');
          setSuccess('');
        }}
        title="Update Account Password"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          
          {success && (
            <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 p-3 rounded-xl border border-emerald-150 dark:border-emerald-900/50 text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3 rounded-xl border border-red-150 dark:border-red-900/50 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Rewrite new password"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-150 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setIsChangePassOpen(false);
                setError('');
                setSuccess('');
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Change Password
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
