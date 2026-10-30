import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Building2,
  FileText,
  BarChart3,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export type NavTab =
  | 'dashboard'
  | 'products'
  | 'stock-in'
  | 'stock-out'
  | 'low-stock'
  | 'suppliers'
  | 'purchase-orders'
  | 'reports'
  | 'users';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount,
}) => {
  const { isAdmin } = useAuth();

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
    adminOnly?: boolean;
    section?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      section: 'Core Overview',
    },
    {
      id: 'products',
      label: 'Products Catalog',
      icon: Boxes,
      section: 'Inventory Ops',
    },
    {
      id: 'stock-in',
      label: 'Stock-In (Add)',
      icon: ArrowDownToLine,
    },
    {
      id: 'stock-out',
      label: 'Stock-Out (Issue)',
      icon: ArrowUpFromLine,
    },
    {
      id: 'low-stock',
      label: 'Low-Stock Alerts',
      icon: AlertTriangle,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Building2,
      section: 'Procurement',
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      icon: FileText,
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      section: 'Administration',
    },
    {
      id: 'users',
      label: 'User Accounts',
      icon: Users,
      adminOnly: true,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0">
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          const isSelected = currentTab === item.id;
          const showSection =
            item.section && (idx === 0 || navItems[idx - 1].section !== item.section);

          // If item is admin only and current user is not admin, we still display it with a locked badge or show role requirement
          const isLocked = item.adminOnly && !isAdmin;

          return (
            <React.Fragment key={item.id}>
              {showSection && (
                <div className="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {item.section}
                </div>
              )}

              <button
                onClick={() => {
                  if (!isLocked) {
                    onSelectTab(item.id);
                  }
                }}
                disabled={isLocked}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : isLocked
                    ? 'text-slate-400 cursor-not-allowed opacity-50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-4 h-4 transition-colors ${
                      isSelected
                        ? 'text-white'
                        : isLocked
                        ? 'text-slate-400'
                        : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        item.badgeColor || 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.adminOnly && (
                    <span
                      title="Admin Privilege"
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-indigo-700 text-white'
                          : 'bg-slate-800 text-indigo-400 border border-indigo-900/40'
                      }`}
                    >
                      Admin
                    </span>
                  )}
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Role notice footer */}
      <div className="p-3 m-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
          <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
          <span>Role-Based Access</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isAdmin
            ? 'Logged in with Full Admin controls (Products, POs, Suppliers, Reports & Staff).'
            : 'Logged in as Staff (Add/Edit Products, Record Stock Movements, View Alerts).'}
        </p>
      </div>
    </aside>
  );
};
