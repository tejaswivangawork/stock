import React, { useState } from 'react';
import {
  Boxes,
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../components/Toast.tsx';

export const LoginView: React.FC = () => {
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Staff'>('Staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isRegisterMode && !name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegisterMode) {
        await register(name, email, password, role);
        showToast(`Welcome ${name}! Registered as ${role}`, 'success');
      } else {
        await login(email, password);
        showToast('Login successful', 'success');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
      showToast(err.message || 'Authentication error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole: 'Admin' | 'Staff') => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (demoRole === 'Admin') {
        setEmail('admin@stockms.com');
        setPassword('admin123');
        await login('admin@stockms.com', 'admin123');
        showToast('Signed in as Administrator (Sarah Connor)', 'success');
      } else {
        setEmail('staff@stockms.com');
        setPassword('staff123');
        await login('staff@stockms.com', 'staff123');
        showToast('Signed in as Inventory Staff (Alex Rivera)', 'success');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-xl shadow-indigo-500/25 mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Stock Maintenance System</h1>
          <p className="text-sm text-slate-400 mt-1">
            MERN Architecture • Enterprise Inventory & Supply Chain
          </p>
        </div>

        {/* Quick Demo Login Cards */}
        <div className="mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>One-Click Test Accounts</span>
            </div>
            <span className="text-[11px] text-slate-400">Pre-seeded users</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickDemoLogin('Admin')}
              className="flex flex-col items-start p-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 text-left transition-all group"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </span>
                <span className="text-[10px] text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Login →
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium">admin@stockms.com</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Password: admin123</div>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickDemoLogin('Staff')}
              className="flex flex-col items-start p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 text-left transition-all group"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5" />
                  Staff
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Login →
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium">staff@stockms.com</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Password: staff123</div>
            </button>
          </div>
        </div>

        {/* Main Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <h2 className="text-lg font-semibold text-white">
              {isRegisterMode ? 'Create New Account' : 'Sign in to your account'}
            </h2>
            <span className="text-xs text-slate-400">
              {isRegisterMode ? 'FR-01: Registration' : 'FR-01: Authentication'}
            </span>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Michael Vance"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Assigned Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Staff')}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                      role === 'Staff'
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Staff Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                      role === 'Admin'
                        ? 'bg-indigo-950/60 border-indigo-600 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Authenticating...' : isRegisterMode ? 'Register Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage('');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {isRegisterMode
                ? 'Already have an account? Sign in here'
                : "Don't have an account yet? Register here"}
            </button>
          </div>
        </div>

        {/* Footer specs note */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          Complies with Software Requirements Specification (SRS) for Stock Maintenance System
        </p>
      </div>
    </div>
  );
};
