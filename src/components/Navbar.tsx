import React, { useState } from 'react';
import {
  Boxes,
  Bell,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  RotateCcw,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from './Toast.tsx';
import { api } from '../services/api.ts';

interface NavbarProps {
  lowStockCount: number;
  onNavigateToLowStock: () => void;
  onRefreshData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lowStockCount,
  onNavigateToLowStock,
  onRefreshData,
}) => {
  const { user, isAdmin, logout, quickLoginAs } = useAuth();
  const { showToast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleResetDb = async () => {
    if (!window.confirm('Reset database to initial demo state? All current changes will revert to sample data.')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDatabase();
      showToast('Database reset to default seed records successfully', 'success');
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset database', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleRoleSwitch = async (role: 'Admin' | 'Staff') => {
    setShowRoleMenu(false);
    try {
      await quickLoginAs(role);
      showToast(`Switched active session to ${role} account`, 'info');
      onRefreshData();
    } catch (err: any) {
      showToast('Failed to switch role: ' + err.message, 'error');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shadow-sm">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Boxes className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 text-base sm:text-lg tracking-tight">
              Stock Maintenance System
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 hidden sm:inline-block">
              MERN Stack
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Centralized Inventory, Stock Transactions & Purchase Management
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Refresh */}
        <button
          onClick={onRefreshData}
          title="Refresh Data"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Low Stock Alert Bell */}
        <button
          onClick={onNavigateToLowStock}
          title={lowStockCount > 0 ? `${lowStockCount} items below reorder level` : 'Stock levels healthy'}
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {lowStockCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full animate-pulse shadow-sm">
              {lowStockCount}
            </span>
          )}
        </button>

        {/* Quick Role Switcher (for instant evaluation of Admin vs Staff) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-colors"
            title="Switch between Admin and Staff to test permissions"
          >
            <span className="text-slate-400">Role:</span>
            <span
              className={`font-semibold ${
                isAdmin ? 'text-indigo-400' : 'text-emerald-400'
              }`}
            >
              {user?.role}
            </span>
            <span className="text-[10px] text-slate-400 ml-0.5">▼</span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Switch Test Role
              </div>
              <button
                onClick={() => handleRoleSwitch('Admin')}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                  isAdmin ? 'text-indigo-400 font-bold bg-indigo-950/40' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div>Administrator</div>
                    <div className="text-[10px] text-slate-400">Full system & report controls</div>
                  </div>
                </div>
                {isAdmin && <span className="text-indigo-400 font-bold">✓</span>}
              </button>

              <button
                onClick={() => handleRoleSwitch('Staff')}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                  !isAdmin ? 'text-emerald-400 font-bold bg-emerald-950/40' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div>Staff Member</div>
                    <div className="text-[10px] text-slate-400">Daily inventory operations</div>
                  </div>
                </div>
                {!isAdmin && <span className="text-emerald-400 font-bold">✓</span>}
              </button>

              {isAdmin && (
                <div className="mt-1 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      handleResetDb();
                    }}
                    disabled={isResetting}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo Data</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
            <span className="text-[10px] text-slate-400">{user?.email}</span>
          </div>

          <button
            onClick={() => logout()}
            title="Log Out"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
