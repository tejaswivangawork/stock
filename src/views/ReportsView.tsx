import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  DollarSign,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { StockTransaction, DashboardMetrics, Product } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../components/Toast.tsx';
import { api } from '../services/api.ts';

interface ReportsViewProps {
  metrics: DashboardMetrics | null;
  products: Product[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ metrics, products }) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [filterType, setFilterType] = useState<'All' | 'Stock-In' | 'Stock-Out'>('All');
  const [filterReason, setFilterReason] = useState<string>('All');
  const [filterProduct, setFilterProduct] = useState<string>('All');
  const [searchTx, setSearchTx] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const txs = await api.getStockMovementsReport(500);
        setTransactions(txs);
      } catch (err: any) {
        showToast(err.message || 'Failed to load report data', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [showToast]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== 'All' && tx.transactionType !== filterType) return false;
      if (filterReason !== 'All' && tx.reason !== filterReason) return false;
      if (filterProduct !== 'All' && tx.productId !== filterProduct) return false;
      if (searchTx.trim()) {
        const q = searchTx.toLowerCase().trim();
        const matches =
          tx.productName.toLowerCase().includes(q) ||
          tx.productCode.toLowerCase().includes(q) ||
          tx.performedByName.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterReason, filterProduct, searchTx]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date & Time',
      'Transaction Type',
      'Product Name',
      'Product Code',
      'Quantity',
      'Unit Price',
      'Total Value',
      'Reason',
      'Performed By',
      'Notes',
    ];

    const rows = filteredTransactions.map((tx) => [
      `"${tx._id}"`,
      `"${new Date(tx.transactionDate).toISOString()}"`,
      `"${tx.transactionType}"`,
      `"${tx.productName.replace(/"/g, '""')}"`,
      `"${tx.productCode}"`,
      tx.quantity,
      tx.unitPrice || 0,
      tx.totalValue || 0,
      `"${tx.reason}"`,
      `"${tx.performedByName.replace(/"/g, '""')}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `inventory_stock_movements_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Stock movements report exported to CSV', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Inventory Reports & Stock Movements Audit (FR-10)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive financial valuation, inventory turn analysis, and chronological stock ledger
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Print only title */}
      <div className="hidden print:block text-slate-900 mb-4">
        <h1 className="text-2xl font-bold">Stock Maintenance System — Inventory Audit Report</h1>
        <p className="text-xs text-slate-600">Generated: {new Date().toLocaleString()}</p>
      </div>

      {/* Valuation Metrics Summary */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Catalog SKUs</span>
              <Boxes className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">{metrics.totalProducts}</div>
            <span className="text-[11px] text-slate-400">Tracked inventory lines</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Units in Stock</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {metrics.totalStockQuantity}
            </div>
            <span className="text-[11px] text-slate-400">Total physical on-hand units</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Inventory Value</span>
              <DollarSign className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-400 mt-1 font-mono">
              ${metrics.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">Current cost valuation</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Movements Logged</span>
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{transactions.length}</div>
            <span className="text-[11px] text-slate-400">Inbound & outbound records</span>
          </div>
        </div>
      )}

      {/* Filter and Ledger section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Stock Movements Transaction Ledger</span>
          </h2>
          <span className="text-xs text-slate-400">
            Filtered: {filteredTransactions.length} of {transactions.length} transactions
          </span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 print:hidden">
          {/* Search */}
          <div>
            <input
              type="text"
              value={searchTx}
              onChange={(e) => setSearchTx(e.target.value)}
              placeholder="Search product or staff name..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Type */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Movements (In & Out)</option>
              <option value="Stock-In">Stock-In Only (Add)</option>
              <option value="Stock-Out">Stock-Out Only (Issue)</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Reasons</option>
              <option value="Purchase">Purchase</option>
              <option value="Return">Return</option>
              <option value="Sale">Sale</option>
              <option value="Issue">Internal Issue</option>
            </select>
          </div>

          {/* Product */}
          <div>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Products</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.productName} ({p.productCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 text-[11px]">
                <th className="py-2.5 px-3 font-semibold">Date & Time</th>
                <th className="py-2.5 px-3 font-semibold">Movement Type</th>
                <th className="py-2.5 px-3 font-semibold">Product Name</th>
                <th className="py-2.5 px-3 font-semibold">Code</th>
                <th className="py-2.5 px-3 font-semibold text-right">Quantity</th>
                <th className="py-2.5 px-3 font-semibold text-right">Unit Price</th>
                <th className="py-2.5 px-3 font-semibold text-right">Value ($)</th>
                <th className="py-2.5 px-3 font-semibold">Reason</th>
                <th className="py-2.5 px-3 font-semibold">Performed By</th>
                <th className="py-2.5 px-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(tx.transactionDate).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                    <td className="py-2.5 px-3 font-medium text-slate-200 max-w-[170px] truncate" title={tx.productName}>
                      {tx.productName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-indigo-300 text-[11px]">
                      {tx.productCode}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-100">
                      <span
                        className={tx.transactionType === 'Stock-In' ? 'text-emerald-400' : 'text-rose-400'}
                      >
                        {tx.transactionType === 'Stock-In' ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      ${tx.unitPrice?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-200">
                      ${tx.totalValue?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {tx.reason}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{tx.performedByName}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-[150px] truncate" title={tx.notes}>
                      {tx.notes || '-'}
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
