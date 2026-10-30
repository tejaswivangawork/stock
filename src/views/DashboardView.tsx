import React from 'react';
import {
  Boxes,
  Layers,
  DollarSign,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  FilePlus,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { DashboardMetrics, Product } from '../types/index.ts';
import { NavTab } from '../components/Sidebar.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  onNavigate: (tab: NavTab) => void;
  onQuickRestock: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  onNavigate,
  onQuickRestock,
}) => {
  const { user, isAdmin } = useAuth();

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading dashboard analytics...</span>
        </div>
      </div>
    );
  }

  const {
    totalProducts,
    totalStockQuantity,
    totalInventoryValue,
    lowStockCount,
    outOfStockCount,
    totalSuppliers,
    totalPurchaseOrders,
    recentTransactions,
    lowStockProducts,
    categoryBreakdown,
  } = metrics;

  return (
    <div className="space-y-6">
      {/* Welcome header & quick actions banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">
              Inventory Overview & Stock Control
            </h1>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isAdmin
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {user?.role} Session
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time stock monitoring, transaction audit log, and automated reorder alerts
          </p>
        </div>

        {/* Quick action buttons (FR-02) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('stock-in')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all shadow-emerald-950"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Stock-In (Add)</span>
          </button>

          <button
            onClick={() => onNavigate('stock-out')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all shadow-sky-950"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            <span>Stock-Out (Issue)</span>
          </button>

          <button
            onClick={() => onNavigate('products')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            <Boxes className="w-4 h-4 text-indigo-400" />
            <span>Products</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('purchase-orders')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all shadow-indigo-950"
            >
              <FilePlus className="w-4 h-4" />
              <span>New PO</span>
            </button>
          )}
        </div>
      </div>

      {/* Critical Low Stock Alert Banner (FR-02 & FR-07) */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="bg-gradient-to-r from-rose-950/60 via-amber-950/40 to-slate-900 border border-rose-800/60 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-900/50 rounded-xl text-rose-300 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Attention Required: Stock Below Reorder Threshold</span>
                {outOfStockCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                    {outOfStockCount} Out of Stock
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                {lowStockCount + outOfStockCount} product(s) have fallen below their configured safety reorder level. Review suppliers and replenish inventory to avoid stockouts.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('low-stock')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-md shadow-rose-900/30 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Review Low-Stock Items</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Grid (FR-02) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Products</span>
            <div className="p-2 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-900/50">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{totalProducts}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Catalog items across {categoryBreakdown.length} categories</span>
            </div>
          </div>
        </div>

        {/* Available Stock Units */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Stock on Hand</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-900/50">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400">{totalStockQuantity} <span className="text-sm font-normal text-slate-400">units</span></div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Total physical inventory in warehouse</span>
            </div>
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Inventory Valuation</span>
            <div className="p-2 rounded-xl bg-sky-950/60 text-sky-400 border border-sky-900/50">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-sky-400">
              ${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Calculated at current unit prices</span>
            </div>
          </div>
        </div>

        {/* Reorder Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Stock Status Alerts</span>
            <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-900/50">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-amber-400">{lowStockCount}</div>
            <span className="text-xs text-slate-400">low stock</span>
            {outOfStockCount > 0 && (
              <span className="text-xs font-semibold text-rose-400 ml-auto">
                {outOfStockCount} critical (0 qty)
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Threshold: quantity ≤ reorder level
          </div>
        </div>
      </div>

      {/* 2-Column Section: Low Stock Quick Table + Category Valuation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Low-Stock Items Table (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white">Items Requiring Restocking (FR-07)</h2>
            </div>
            <button
              onClick={() => onNavigate('low-stock')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View All ({lowStockProducts.length}) →
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-xs font-medium text-slate-200">All products have healthy stock levels</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No items are currently at or below their reorder safety thresholds.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">Code</th>
                    <th className="pb-2 font-medium text-right">Available Qty</th>
                    <th className="pb-2 font-medium text-right">Reorder Level</th>
                    <th className="pb-2 font-medium text-right">Deficit</th>
                    <th className="pb-2 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {lowStockProducts.slice(0, 5).map((prod) => {
                    const deficit = Math.max(0, prod.reorderLevel - prod.quantity);
                    const isZero = prod.quantity <= 0;
                    return (
                      <tr key={prod._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 font-medium text-slate-200 max-w-[180px] truncate">
                          {prod.productName}
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-slate-400">
                          {prod.productCode}
                        </td>
                        <td className="py-2.5 text-right font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] ${
                              isZero
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {prod.quantity} units
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-slate-400">
                          {prod.reorderLevel}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-rose-400">
                          +{deficit}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => onQuickRestock(prod)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors"
                          >
                            + Stock-In
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Breakdown (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Category Distribution</h2>
            <span className="text-xs text-slate-400">{categoryBreakdown.length} Categories</span>
          </div>

          <div className="space-y-3.5">
            {categoryBreakdown.map((cat) => {
              const totalItems = totalStockQuantity || 1;
              const percentage = Math.round((cat.totalQty / totalItems) * 100);

              return (
                <div key={cat.categoryName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300 truncate max-w-[150px]">
                      {cat.categoryName}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {cat.totalQty} pcs (${cat.value.toLocaleString()})
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(4, percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Stock Movements Table (FR-04, FR-05) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white">Recent Stock Transactions (FR-04 / FR-05)</h2>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Full Transaction Audit →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2.5 font-medium">Type</th>
                <th className="pb-2.5 font-medium">Product</th>
                <th className="pb-2.5 font-medium">Code</th>
                <th className="pb-2.5 font-medium text-right">Qty</th>
                <th className="pb-2.5 font-medium">Reason</th>
                <th className="pb-2.5 font-medium">Recorded By</th>
                <th className="pb-2.5 font-medium text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No transactions recorded yet
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          tx.transactionType === 'Stock-In'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {tx.transactionType === 'Stock-In' ? (
                          <ArrowDownToLine className="w-3 h-3" />
                        ) : (
                          <ArrowUpFromLine className="w-3 h-3" />
                        )}
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-200">{tx.productName}</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-400">{tx.productCode}</td>
                    <td className="py-2.5 text-right font-bold text-slate-200">
                      {tx.transactionType === 'Stock-In' ? `+${tx.quantity}` : `-${tx.quantity}`}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                        {tx.reason}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">{tx.performedByName}</td>
                    <td className="py-2.5 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(tx.transactionDate).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
