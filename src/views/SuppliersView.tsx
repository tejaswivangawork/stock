import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  X,
  Boxes,
  ShieldAlert,
} from 'lucide-react';
import { Supplier, Product } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../components/Toast.tsx';
import { api } from '../services/api.ts';

interface SuppliersViewProps {
  suppliers: Supplier[];
  products: Product[];
  onRefresh: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  products,
  onRefresh,
}) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    supplierName: '',
    contactNumber: '',
    email: '',
    address: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      supplierName: '',
      contactNumber: '',
      email: '',
      address: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      supplierName: sup.supplierName,
      contactNumber: sup.contactNumber,
      email: sup.email,
      address: sup.address,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (
      !formData.supplierName.trim() ||
      !formData.contactNumber.trim() ||
      !formData.email.trim() ||
      !formData.address.trim()
    ) {
      setFormError('All fields (Name, Contact Number, Email, and Address) are mandatory.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier._id, {
          supplierName: formData.supplierName.trim(),
          contactNumber: formData.contactNumber.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
        });
        showToast(`Supplier "${formData.supplierName}" updated successfully`, 'success');
      } else {
        await api.createSupplier({
          supplierName: formData.supplierName.trim(),
          contactNumber: formData.contactNumber.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
        });
        showToast(`Supplier "${formData.supplierName}" added successfully`, 'success');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save supplier');
      showToast(err.message || 'Supplier save error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sup: Supplier) => {
    if (!isAdmin) {
      showToast('Admin privilege required to delete suppliers', 'error');
      return;
    }

    const linkedProducts = products.filter((p) => p.supplierId === sup._id);
    if (linkedProducts.length > 0) {
      showToast(
        `Cannot delete "${sup.supplierName}" because it is associated with ${linkedProducts.length} product(s).`,
        'error'
      );
      return;
    }

    if (!window.confirm(`Delete supplier "${sup.supplierName}"?`)) {
      return;
    }

    try {
      await api.deleteSupplier(sup._id);
      showToast(`Supplier "${sup.supplierName}" deleted`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete supplier', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span>Supplier Directory & Procurement (FR-08)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain supplier contact info, addresses, and catalog affiliations
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Supplier</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Staff View (Supplier edits require Admin)</span>
          </div>
        )}
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((sup) => {
          const linkedProducts = products.filter((p) => p.supplierId === sup._id);

          return (
            <div
              key={sup._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-900/60 flex items-center justify-center text-indigo-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{sup.supplierName}</h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Boxes className="w-3.5 h-3.5 text-slate-500" />
                      <span>{linkedProducts.length} Associated Products</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sup)}
                      title="Edit Supplier"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sup)}
                      title="Delete Supplier"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Contact details */}
              <div className="space-y-2 text-xs bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <a href={`tel:${sup.contactNumber}`} className="hover:text-indigo-300 font-mono">
                    {sup.contactNumber}
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a href={`mailto:${sup.email}`} className="hover:text-indigo-300 truncate">
                    {sup.email}
                  </a>
                </div>
                <div className="flex items-start gap-2.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{sup.address}</span>
                </div>
              </div>

              {/* Linked products pills */}
              {linkedProducts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Supplied Catalog Items:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedProducts.slice(0, 4).map((p) => (
                      <span
                        key={p._id}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] border border-slate-700/60"
                      >
                        {p.productName} ({p.productCode})
                      </span>
                    ))}
                    {linkedProducts.length > 4 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                        +{linkedProducts.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4.5 border-b border-slate-800 bg-slate-950/60">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <span>{editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}</span>
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

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supplier / Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  placeholder="e.g. Apex Industrial Supplies"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contact Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="orders@supplier.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Physical / Shipping Address <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, State, ZIP code"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
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
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? 'Saving...' : editingSupplier ? 'Save Updates' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
