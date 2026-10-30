import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  X,
  Trash2,
  ArrowDownToLine,
  ShieldAlert,
} from 'lucide-react';
import { PurchaseOrder, Supplier, Product, PurchaseOrderStatus } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../components/Toast.tsx';
import { api } from '../services/api.ts';

interface PurchaseOrdersViewProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  products: Product[];
  initialPreselectedProduct?: Product | null;
  onRefresh: () => void;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  purchaseOrders,
  suppliers,
  products,
  initialPreselectedProduct,
  onRefresh,
}) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    initialPreselectedProduct?.supplierId || suppliers[0]?._id || ''
  );
  const [orderItems, setOrderItems] = useState<
    { productId: string; quantity: number; unitPrice: number }[]
  >(() => {
    if (initialPreselectedProduct) {
      const deficit = Math.max(10, initialPreselectedProduct.reorderLevel - initialPreselectedProduct.quantity);
      return [
        {
          productId: initialPreselectedProduct._id,
          quantity: deficit,
          unitPrice: initialPreselectedProduct.unitPrice,
        },
      ];
    }
    return [];
  });
  const [poNotes, setPoNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Status updating
  const [updatingPoId, setUpdatingPoId] = useState<string | null>(null);

  const openCreateModal = () => {
    setSelectedSupplierId(suppliers[0]?._id || '');
    // pre-add first product from this supplier
    const supProducts = products.filter((p) => p.supplierId === suppliers[0]?._id);
    const firstProd = supProducts[0] || products[0];

    if (firstProd) {
      setOrderItems([
        {
          productId: firstProd._id,
          quantity: Math.max(5, firstProd.reorderLevel - firstProd.quantity),
          unitPrice: firstProd.unitPrice,
        },
      ]);
    } else {
      setOrderItems([]);
    }

    setPoNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    const availableProds = products.filter(
      (p) => !orderItems.some((item) => item.productId === p._id)
    );
    const nextProd = availableProds[0] || products[0];
    if (!nextProd) return;

    setOrderItems((prev) => [
      ...prev,
      {
        productId: nextProd._id,
        quantity: 10,
        unitPrice: nextProd.unitPrice,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: 'productId' | 'quantity' | 'unitPrice',
    val: any
  ) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      if (field === 'productId') {
        const prod = products.find((p) => p._id === val);
        updated[index] = {
          ...updated[index],
          productId: val,
          unitPrice: prod?.unitPrice || updated[index].unitPrice,
        };
      } else if (field === 'quantity') {
        updated[index] = {
          ...updated[index],
          quantity: Math.max(1, Number(val) || 1),
        };
      } else if (field === 'unitPrice') {
        updated[index] = {
          ...updated[index],
          unitPrice: Math.max(0, Number(val) || 0),
        };
      }
      return updated;
    });
  };

  const totalCalculated = orderItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!isAdmin) {
      showToast('Admin privilege required to create purchase orders', 'error');
      return;
    }

    if (!selectedSupplierId) {
      setFormError('Please select a supplier');
      return;
    }

    if (orderItems.length === 0) {
      setFormError('Please add at least one line item to this purchase order');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPO = await api.createPurchaseOrder({
        supplierId: selectedSupplierId,
        products: orderItems,
        notes: poNotes.trim(),
      });

      showToast(`Purchase Order ${newPO.poNumber} created successfully`, 'success');
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create PO');
      showToast(err.message || 'PO creation error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (po: PurchaseOrder, newStatus: PurchaseOrderStatus) => {
    if (!isAdmin) {
      showToast('Only Administrators can update purchase order status', 'error');
      return;
    }

    if (po.status === newStatus) return;

    if (newStatus === 'Received') {
      const confirmReceive = window.confirm(
        `Mark Purchase Order ${po.poNumber} as "Received"?\n\nThis will automatically record Stock-In transactions and replenish inventory for all ${po.products.length} line items.`
      );
      if (!confirmReceive) return;
    }

    setUpdatingPoId(po._id);
    try {
      await api.updatePurchaseOrderStatus(po._id, newStatus);

      if (newStatus === 'Received') {
        showToast(
          `PO ${po.poNumber} marked Received! Warehouse inventory automatically replenished via Stock-In.`,
          'success'
        );
      } else {
        showToast(`PO ${po.poNumber} status updated to ${newStatus}`, 'info');
      }

      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    } finally {
      setUpdatingPoId(null);
    }
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
            <Clock className="w-3 h-3" /> Pending Approval
          </span>
        );
      case 'Ordered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-950 text-sky-300 border border-sky-800">
            <Calendar className="w-3 h-3" /> Ordered / In Transit
          </span>
        );
      case 'Received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Received & Stocked
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Purchase Order Management (FR-09)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create supplier purchase orders, track procurement lifecycle, and auto-replenish stock on receipt
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Staff View (Admin creates POs)</span>
          </div>
        )}
      </div>

      {/* PO Listing */}
      <div className="space-y-4">
        {purchaseOrders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-300 text-sm">No Purchase Orders Created Yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Create Purchase Order&quot; above to initiate supplier replenishment orders.
            </p>
          </div>
        ) : (
          purchaseOrders.map((po) => {
            const isProcessing = updatingPoId === po._id;

            return (
              <div
                key={po._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-750 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-indigo-300">
                      {po.poNumber}
                    </span>
                    {getStatusBadge(po.status)}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Total Value:</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      ${po.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Details Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Supplier
                    </span>
                    <span className="text-slate-200 font-medium">{po.supplierName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Order Date
                    </span>
                    <span className="text-slate-300 font-mono">
                      {new Date(po.orderDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Initiated By
                    </span>
                    <span className="text-slate-300">{po.createdByName}</span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800 text-[11px]">
                        <th className="pb-1.5 font-medium">Item Name</th>
                        <th className="pb-1.5 font-medium">Code</th>
                        <th className="pb-1.5 font-medium text-right">Order Qty</th>
                        <th className="pb-1.5 font-medium text-right">Unit Price</th>
                        <th className="pb-1.5 font-medium text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {po.products.map((item, idx) => (
                        <tr key={idx} className="text-slate-300">
                          <td className="py-2 font-medium text-slate-200">{item.productName}</td>
                          <td className="py-2 font-mono text-[11px] text-slate-400">
                            {item.productCode}
                          </td>
                          <td className="py-2 text-right font-bold text-white">
                            {item.quantity} units
                          </td>
                          <td className="py-2 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                          <td className="py-2 text-right font-mono font-semibold text-emerald-300">
                            ${item.subtotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {po.notes && (
                  <p className="text-[11px] text-slate-400 italic">Notes: &ldquo;{po.notes}&rdquo;</p>
                )}

                {/* Status action buttons (Admin only) */}
                {isAdmin && (
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">Update Lifecycle Status:</span>
                    <div className="flex items-center gap-2">
                      {po.status === 'Pending' && (
                        <button
                          onClick={() => handleStatusChange(po, 'Ordered')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 text-xs font-medium transition-colors"
                        >
                          Mark as &quot;Ordered&quot;
                        </button>
                      )}

                      {po.status !== 'Received' && po.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleStatusChange(po, 'Received')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-colors flex items-center gap-1.5"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>Receive Goods (Auto-Stock)</span>
                        </button>
                      )}

                      {po.status !== 'Received' && po.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleStatusChange(po, 'Cancelled')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs transition-colors"
                        >
                          Cancel PO
                        </button>
                      )}

                      {po.status === 'Received' && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Received & Inventory Replenished
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Purchase Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4.5 border-b border-slate-800 bg-slate-950/60 shrink-0">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Create Supplier Purchase Order</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="m-4 mb-0 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePO} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Supplier selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Supplier <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => {
                    setSelectedSupplierId(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.supplierName} ({s.contactNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Order items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200">Order Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {orderItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-950/70 p-2.5 rounded-xl border border-slate-800"
                    >
                      {/* Product select */}
                      <div className="col-span-5">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.productName} ({p.productCode})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono text-right"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          placeholder="Price"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono text-right"
                        />
                      </div>

                      {/* Remove */}
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Purchase Order Value:</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  ${totalCalculated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* PO Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Delivery Instructions / Notes
                </label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Standard freight dock intake, urgent replenishment"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 resize-none text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || orderItems.length === 0}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating PO...' : 'Confirm & Generate Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
