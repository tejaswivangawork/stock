import React, { useState, useEffect } from 'react';
import {
  ArrowUpFromLine,
  MinusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Product, StockTransaction, StockOutReason } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../components/Toast.tsx';
import { api } from '../services/api.ts';

interface StockOutViewProps {
  products: Product[];
  selectedProduct?: Product | null;
  onRefresh: () => void;
}

export const StockOutView: React.FC<StockOutViewProps> = ({
  products,
  selectedProduct: initialSelected,
  onRefresh,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [productId, setProductId] = useState<string>(initialSelected?._id || '');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<StockOutReason>('Sale');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (initialSelected) {
      setProductId(initialSelected._id);
    } else if (products.length > 0 && !productId) {
      // Find one with stock if possible
      const withStock = products.find((p) => p.quantity > 0);
      setProductId(withStock ? withStock._id : products[0]._id);
    }
  }, [initialSelected, products]);

  const loadStockOutHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const allTx = await api.getTransactions(50);
      setTransactions(allTx.filter((t) => t.transactionType === 'Stock-Out'));
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadStockOutHistory();
  }, []);

  const activeProduct = products.find((p) => p._id === productId);
  const numQty = Number(quantity) || 0;
  const currentAvailable = activeProduct?.quantity || 0;
  const remainingQuantity = currentAvailable - numQty;
  const isExceedingStock = numQty > currentAvailable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId) {
      showToast('Please select a product to record stock-out', 'error');
      return;
    }

    if (numQty <= 0) {
      showToast('Stock-out quantity must be a positive number greater than zero', 'error');
      return;
    }

    // Business rule 5 check (FR-05)
    if (numQty > currentAvailable) {
      showToast(
        `Business Rule Violation: Cannot issue ${numQty} units. Only ${currentAvailable} units available in stock.`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.recordStockOut({
        productId,
        quantity: numQty,
        reason,
        notes: notes.trim(),
      });

      showToast(
        `Deducted -${numQty} units from ${res.product.productName}. Remaining Stock: ${res.product.quantity} units.`,
        'success'
      );

      // Reset form
      setQuantity('');
      setNotes('');
      onRefresh();
      loadStockOutHistory();
    } catch (err: any) {
      showToast(err.message || 'Failed to record stock-out', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-800/80 flex items-center justify-center text-sky-400">
            <ArrowUpFromLine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Record Stock-Out (FR-05)</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Issue products for client orders, production lines, or sales. Enforces strict zero-negative stock business rules.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock-Out Form (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm h-fit">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <MinusCircle className="w-4 h-4 text-sky-400" />
            <span>Stock-Out Dispatch Form</span>
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.productName} ({p.productCode}) — Available: {p.quantity} pcs
                  </option>
                ))}
              </select>
            </div>

            {/* Current Product Quick Card */}
            {activeProduct && (
              <div
                className={`p-3 rounded-xl border space-y-2 text-xs transition-colors ${
                  activeProduct.quantity <= 0
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-slate-400">Code SKU:</span>
                  <span className="font-mono text-indigo-300 font-semibold">{activeProduct.productCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Stock:</span>
                  <span className={`font-bold ${activeProduct.quantity <= 0 ? 'text-rose-400' : 'text-white'}`}>
                    {activeProduct.quantity} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reorder Threshold:</span>
                  <span>{activeProduct.reorderLevel} units</span>
                </div>
                {activeProduct.quantity <= 0 && (
                  <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 pt-1 border-t border-rose-900/50">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Out of Stock! Cannot issue stock until replenished.</span>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Quantity to Dispatch <span className="text-rose-400">*</span>
                </label>
                {activeProduct && activeProduct.quantity > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuantity(activeProduct.quantity.toString())}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    Max ({activeProduct.quantity})
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                max={currentAvailable}
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 5"
                disabled={currentAvailable <= 0}
                className={`w-full px-3.5 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none font-mono text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
                  isExceedingStock
                    ? 'border-rose-600 focus:border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-800 focus:border-sky-500'
                }`}
              />
            </div>

            {/* Reason selector (FR-05: Sale / Issue) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Transaction Reason <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReason('Sale')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    reason === 'Sale'
                      ? 'bg-sky-950/80 border-sky-600 text-sky-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sale (Customer Order)
                </button>
                <button
                  type="button"
                  onClick={() => setReason('Issue')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    reason === 'Issue'
                      ? 'bg-sky-950/80 border-sky-600 text-sky-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Internal Issue (Plant/R&D)
                </button>
              </div>
            </div>

            {/* Reference notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Dispatch Reference / Order #
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Work Order #WO-402, Customer SO-991"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Validation & Projection feedback */}
            {numQty > 0 && activeProduct && (
              <div>
                {isExceedingStock ? (
                  <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-200">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Business Rule Violation!</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Cannot issue {numQty} units. Available stock is only {currentAvailable} units. System strictly prohibits negative quantities.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-sky-950/40 border border-sky-800/60 rounded-xl text-xs space-y-1">
                    <div className="text-sky-300 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Stock Deduction Projection</span>
                    </div>
                    <div className="text-slate-300 flex justify-between">
                      <span>Available Now:</span>
                      <span>{currentAvailable} units</span>
                    </div>
                    <div className="text-slate-300 flex justify-between font-bold text-sky-300">
                      <span>Remaining Balance:</span>
                      <span>{remainingQuantity} units (-{numQty})</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || numQty <= 0 || isExceedingStock || currentAvailable <= 0}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-950 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Dispatch...' : 'Submit Stock-Out Transaction'}</span>
            </button>
          </form>
        </div>

        {/* Stock-Out History (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white">Stock-Out Transaction History (Audit Log)</h2>
            </div>
            <span className="text-xs text-slate-400">Total {transactions.length} dispatches</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-medium">Date & Time</th>
                  <th className="pb-2.5 font-medium">Product</th>
                  <th className="pb-2.5 font-medium">Code</th>
                  <th className="pb-2.5 font-medium text-right">Deducted</th>
                  <th className="pb-2.5 font-medium">Reason</th>
                  <th className="pb-2.5 font-medium">Recorded By</th>
                  <th className="pb-2.5 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No stock-out dispatches logged yet.
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
                      <td className="py-2.5 text-right font-bold text-rose-400">
                        -{tx.quantity}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/80 text-[11px] font-semibold">
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
