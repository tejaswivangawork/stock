import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  Boxes,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, StockTransaction, StockInReason } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../components/Toast.tsx';
import { api } from '../services/api.ts';

interface StockInViewProps {
  products: Product[];
  selectedProduct?: Product | null;
  onRefresh: () => void;
}

export const StockInView: React.FC<StockInViewProps> = ({
  products,
  selectedProduct: initialSelected,
  onRefresh,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [productId, setProductId] = useState<string>(initialSelected?._id || '');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<StockInReason>('Purchase');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (initialSelected) {
      setProductId(initialSelected._id);
    } else if (products.length > 0 && !productId) {
      setProductId(products[0]._id);
    }
  }, [initialSelected, products]);

  const loadStockInHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const allTx = await api.getTransactions(50);
      setTransactions(allTx.filter((t) => t.transactionType === 'Stock-In'));
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadStockInHistory();
  }, []);

  const activeProduct = products.find((p) => p._id === productId);
  const numQty = Number(quantity) || 0;
  const projectedQuantity = (activeProduct?.quantity || 0) + numQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId) {
      showToast('Please select a product to record stock-in', 'error');
      return;
    }

    if (numQty <= 0) {
      showToast('Stock-in quantity must be a positive number greater than zero', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.recordStockIn({
        productId,
        quantity: numQty,
        reason,
        notes: notes.trim(),
      });

      showToast(
        `Added +${numQty} units to ${res.product.productName}. New Stock: ${res.product.quantity} units.`,
        'success'
      );

      // Reset form
      setQuantity('');
      setNotes('');
      onRefresh();
      loadStockInHistory();
    } catch (err: any) {
      showToast(err.message || 'Failed to record stock-in', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Record Stock-In (FR-04)</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Replenish inventory via incoming supplier purchases or customer returns. Available stock will automatically increase.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock-In Form (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm h-fit">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Stock-In Entry Form</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Product <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.productName} ({p.productCode}) — Current: {p.quantity} pcs
                  </option>
                ))}
              </select>
            </div>

            {/* Current Product Quick Card */}
            {activeProduct && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Code SKU:</span>
                  <span className="font-mono text-indigo-300 font-semibold">{activeProduct.productCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Stock:</span>
                  <span className="font-bold text-white">{activeProduct.quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reorder Level:</span>
                  <span className="text-slate-300">{activeProduct.reorderLevel} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Supplier:</span>
                  <span className="text-slate-300 truncate max-w-[170px]">{activeProduct.supplierName}</span>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quantity to Add <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-base font-bold"
              />
            </div>

            {/* Reason selector (FR-04: Purchase / Return) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Transaction Reason <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReason('Purchase')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    reason === 'Purchase'
                      ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Purchase (New Supply)
                </button>
                <button
                  type="button"
                  onClick={() => setReason('Return')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    reason === 'Return'
                      ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Return (Restock)
                </button>
              </div>
            </div>

            {/* Reference notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Notes / Reference # (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Invoice #INV-8812, Batch B"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Projection Box */}
            {numQty > 0 && activeProduct && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs space-y-1">
                <div className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Calculation Preview</span>
                </div>
                <div className="text-slate-300 flex justify-between">
                  <span>Stock Before:</span>
                  <span>{activeProduct.quantity} units</span>
                </div>
                <div className="text-slate-300 flex justify-between font-bold text-emerald-300">
                  <span>Projected New Stock:</span>
                  <span>{projectedQuantity} units (+{numQty})</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || numQty <= 0}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Transaction...' : 'Submit Stock-In Transaction'}</span>
            </button>
          </form>
        </div>

        {/* Stock-In History (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Stock-In Transaction History (Audit Log)</h2>
            </div>
            <span className="text-xs text-slate-400">Total {transactions.length} records</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-medium">Date & Time</th>
                  <th className="pb-2.5 font-medium">Product</th>
                  <th className="pb-2.5 font-medium">Code</th>
                  <th className="pb-2.5 font-medium text-right">Added Qty</th>
                  <th className="pb-2.5 font-medium">Reason</th>
                  <th className="pb-2.5 font-medium">Recorded By</th>
                  <th className="pb-2.5 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No stock-in transactions logged yet. Use the form on the left to record your first stock addition.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(tx.transactionDate).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 font-medium text-slate-200 max-w-[150px] truncate" title={tx.productName}>
                        {tx.productName}
                      </td>
                      <td className="py-2.5 font-mono text-indigo-300 text-[11px]">{tx.productCode}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">
                        +{tx.quantity}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-[11px] font-semibold">
                          {tx.reason}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300">{tx.performedByName}</td>
                      <td className="py-2.5 text-slate-400 text-[11px] max-w-[160px] truncate" title={tx.notes}>
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
    </div>
  );
};
