import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShieldCheck, User, AlertCircle, KeyRound, Mail, UserPlus, Briefcase, CheckCircle } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'changepassword'
  
  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Login specific
  const [role, setRole] = useState('CUSTOMER'); // 'CUSTOMER', 'EMPLOYEE', 'ADMIN'
  
  // Register specific
  const [name, setName] = useState('');

  // Change Password specific
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signup(name, email, password);
        navigate('/customer');
      } else if (mode === 'login') {
        const user = await login(email, password, role);
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else if (user.role === 'EMPLOYEE') {
          navigate('/employee');
        } else {
          navigate('/customer');
        }
      } else if (mode === 'changepassword') {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match.');
        }
        await api.post('/auth/change-password', {
          email,
          oldPassword,
          newPassword,
        });
        setSuccessMessage('Password updated successfully! You can now sign in.');
        setMode('login');
        // Clear change password fields
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setName('');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        
        {/* Title Block */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {mode === 'signup' ? 'Create Account' : mode === 'changepassword' ? 'Change Password' : 'Ticket System'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {mode === 'signup' 
              ? 'Sign up to raise support tickets' 
              : mode === 'changepassword' 
              ? 'Provide credentials to update your password' 
              : 'Sign in to access your dashboard'}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl border border-emerald-150 dark:border-emerald-900/50 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-150 dark:border-red-900/50 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Role Tabs (Only for Sign In) */}
          {mode === 'login' && (
            <div>
              <label className="text-xs font-semibold text-gray-550 dark:text-gray-400 uppercase tracking-wider block mb-2">
                Select Workspace Role
              </label>
              <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    role === 'CUSTOMER'
                      ? 'bg-white dark:bg-gray-800 text-indigo-650 dark:text-indigo-400 shadow'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('EMPLOYEE')}
                  className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    role === 'EMPLOYEE'
                      ? 'bg-white dark:bg-gray-800 text-indigo-650 dark:text-indigo-400 shadow'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4 flex-shrink-0" />
                  <span>Staff</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    role === 'ADMIN'
                      ? 'bg-white dark:bg-gray-800 text-indigo-650 dark:text-indigo-400 shadow'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Name Field (Only for Sign Up) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-305">
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            {/* Email Field (All Modes) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-305">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Old Password Field (Only for Change Password) */}
            {mode === 'changepassword' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Old Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* Standard Password Field (Only for Sign In and Sign Up) */}
            {(mode === 'login' || mode === 'signup') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* New Password Field (Only for Change Password) */}
            {mode === 'changepassword' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* Confirm Password Field (Only for Change Password) */}
            {mode === 'changepassword' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rewrite New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : mode === 'signup' ? 'Create Account' : mode === 'changepassword' ? 'Change Password' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Toggle Mode Links */}
        <div className="flex flex-col items-center space-y-2 pt-2 text-sm">
          {mode === 'login' ? (
            <>
              <button
                type="button"
                onClick={() => handleToggleMode('signup')}
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none"
              >
                Don't have an account? Create one
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode('changepassword')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white focus:outline-none"
              >
                Change Password?
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleToggleMode('login')}
              className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none"
            >
              Back to Sign In
            </button>
          )}
        </div>

        {/* Demo Credentials Helper (Only for Sign In) */}
        {mode === 'login' && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Demo Accounts:</p>
            <p>• Admin: <span className="font-mono">admin@example.com</span> / <span className="font-mono">admin123</span></p>
            <p>• Customer: <span className="font-mono">customer@example.com</span> / <span className="font-mono">customer123</span></p>
            <p>• Staff: <span className="font-mono">dev1@example.com</span> / <span className="font-mono">password123</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
