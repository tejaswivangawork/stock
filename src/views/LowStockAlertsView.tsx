import React from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  FilePlus,
  TrendingDown,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import { Product, Supplier } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface LowStockAlertsViewProps {
  lowStockProducts: Product[];
  suppliers: Supplier[];
  onOpenStockIn: (product: Product) => void;
  onCreatePOWithProduct: (product: Product) => void;
}

export const LowStockAlertsView: React.FC<LowStockAlertsViewProps> = ({
  lowStockProducts,
  suppliers,
  onOpenStockIn,
  onCreatePOWithProduct,
}) => {
  const { isAdmin } = useAuth();

  const outOfStockItems = lowStockProducts.filter((p) => p.quantity <= 0);
  const warningItems = lowStockProducts.filter((p) => p.quantity > 0);

  const totalDeficitUnits = lowStockProducts.reduce(
    (acc, p) => acc + Math.max(0, p.reorderLevel - p.quantity),
    0
  );

  const totalEstimatedCost = lowStockProducts.reduce(
    (acc, p) => acc + Math.max(0, p.reorderLevel - p.quantity) * p.unitPrice,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Low-Stock & Reorder Alerts (FR-07)</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated threshold monitoring comparing current on-hand units against product reorder levels.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-semibold">
              {outOfStockItems.length} Critical Out of Stock
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-semibold">
              {warningItems.length} Below Reorder Level
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400">Total Alerted Items</span>
          <div className="text-2xl font-bold text-white mt-1">{lowStockProducts.length} Products</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Requiring restocking attention</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400">Total Unit Shortfall</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{totalDeficitUnits} units</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Units required to reach safety buffer</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400">Estimated Restock Investment</span>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            ${totalEstimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Calculated at current unit purchase costs</p>
        </div>
      </div>

      {/* Alert List */}
      {lowStockProducts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-white">All Stock Levels are Healthy</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            No products are currently at or below their reorder levels. When inventory decreases through stock-out dispatches, alerts will trigger automatically here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>Active Low-Stock Alerts Requiring Action</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lowStockProducts.map((prod) => {
              const isZero = prod.quantity <= 0;
              const deficit = Math.max(0, prod.reorderLevel - prod.quantity);
              const estCost = deficit * prod.unitPrice;
              const supplier = suppliers.find((s) => s._id === prod.supplierId);

              return (
                <div
                  key={prod._id}
                  className={`border rounded-2xl p-5 shadow-sm transition-all ${
                    isZero
                      ? 'bg-rose-950/25 border-rose-800/80 shadow-rose-950/20'
                      : 'bg-slate-900 border-amber-900/60 shadow-slate-950'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            isZero
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-slate-950 font-extrabold'
                          }`}
                        >
                          {isZero ? 'CRITICAL OUT OF STOCK' : 'LOW STOCK ALERT'}
                        </span>
                        <span className="font-mono text-xs text-indigo-300 font-semibold">
                          {prod.productCode}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1.5">{prod.productName}</h3>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Category: <span className="text-slate-300">{prod.categoryName}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-400">Current Stock</div>
                      <div
                        className={`text-xl font-black ${
                          isZero ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {prod.quantity} <span className="text-xs font-normal text-slate-400">units</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Level Bar */}
                  <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Safety Threshold:</span>
                      <span className="font-semibold text-slate-200">{prod.reorderLevel} units</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Immediate Deficit:</span>
                      <span className="font-bold text-rose-400">+{deficit} units needed</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Est. Replenish Cost:</span>
                      <span className="font-mono text-sky-400 font-semibold">${estCost.toFixed(2)}</span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${isZero ? 'bg-rose-600' : 'bg-amber-500'}`}
                        style={{
                          width: `${Math.min(100, Math.max(3, (prod.quantity / prod.reorderLevel) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Supplier Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 text-xs mb-4">
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                        <Building2 className="w-3 h-3 text-sky-400" />
                        <span>Assigned Supplier</span>
                      </div>
                      <div className="font-medium text-slate-200">{supplier?.supplierName || prod.supplierName}</div>
                    </div>

                    {supplier && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-300">
                        <a
                          href={`tel:${supplier.contactNumber}`}
                          className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                          title="Call Supplier"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{supplier.contactNumber}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenStockIn(prod)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Direct Stock-In</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => onCreatePOWithProduct(prod)}
                        className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        title="Create Purchase Order for this item"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                        <span>Create PO</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
