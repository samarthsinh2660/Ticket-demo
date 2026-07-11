import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, AlertCircle, KeyRound, Mail, UserPlus, Briefcase } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  
  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Login specific
  const [role, setRole] = useState('CUSTOMER'); // 'CUSTOMER' or 'ADMIN'
  
  // Register specific
  const [name, setName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await signup(name, email, password);
        // Signup defaults to CUSTOMER role, route to customer dashboard
        navigate('/customer');
      } else {
        const user = await login(email, password, role);
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/customer');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        
        {/* Title Block */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {isRegister ? 'Create Account' : 'Ticket System'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isRegister ? 'Sign up to raise support tickets' : 'Sign in to access your dashboard'}
          </p>
        </div>

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
          {!isRegister && (
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
            {isRegister && (
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

            {/* Email Field */}
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

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-305">
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
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Toggle Mode Link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-sm font-semibold text-indigo-650 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>

        {/* Demo Credentials Helper (Only for Sign In) */}
        {!isRegister && (
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
