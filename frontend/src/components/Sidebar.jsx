import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Kanban, LogOut, ShieldAlert, UserCheck, Users, BarChart3, Briefcase } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen select-none border-r border-slate-800 flex-shrink-0">
      
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
                onClick={() => setActiveTab('board')}
                className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'board'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Kanban className="w-4 h-4 text-indigo-400" />
                <span>Tickets Board</span>
              </button>
            </div>

            {/* Workforce Section */}
            <div className="space-y-1.5 pt-2">
              <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Workforce Management
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('employees')}
                className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'employees'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-405" />
                <span>Employee Management</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-405" />
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
              className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-white shadow-sm transition-all"
            >
              <Kanban className="w-4 h-4 text-indigo-400" />
              <span>My Support Tickets</span>
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
              className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-white shadow-sm transition-all"
            >
              <Kanban className="w-4 h-4 text-indigo-405" />
              <span>Assigned Tickets</span>
            </button>
          </div>
        )}

      </div>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
}
