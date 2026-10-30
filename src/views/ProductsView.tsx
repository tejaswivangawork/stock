import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Check,
  Info,
  DollarSign,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { Product, Category, Supplier } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../components/Toast.tsx';
import { api } from '../services/api.ts';

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  onRefresh: () => void;
  onOpenStockIn: (product: Product) => void;
  onOpenStockOut: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  suppliers,
  onRefresh,
  onOpenStockIn,
  onOpenStockOut,
}) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    productName: '',
    productCode: '',
    categoryId: '',
    quantity: '',
    unitPrice: '',
    supplierId: '',
    reorderLevel: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Category inline modal
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Open modal for Add
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      productName: '',
      productCode: '',
      categoryId: categories[0]?._id || '',
      quantity: '0',
      unitPrice: '',
      supplierId: suppliers[0]?._id || '',
      reorderLevel: '10',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName,
      productCode: product.productCode,
      categoryId: product.categoryId,
      quantity: product.quantity.toString(),
      unitPrice: product.unitPrice.toString(),
      supplierId: product.supplierId,
      reorderLevel: product.reorderLevel.toString(),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit product create/update
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation (FR-03: validate mandatory product details)
    if (
      !formData.productName.trim() ||
      !formData.productCode.trim() ||
      !formData.categoryId ||
      !formData.supplierId
    ) {
      setFormError('Product Name, Product Code, Category, and Supplier are mandatory.');
      return;
    }

    const qty = Number(formData.quantity);
    const price = Number(formData.unitPrice);
    const reorder = Number(formData.reorderLevel);

    if (isNaN(qty) || qty < 0) {
      setFormError('Quantity cannot be negative');
      return;
    }
    if (isNaN(price) || price < 0) {
      setFormError('Unit Price cannot be negative');
      return;
    }
    if (isNaN(reorder) || reorder < 0) {
      setFormError('Reorder Level cannot be negative');
      return;
    }

    // Check duplicate product code locally
    const codeMatch = products.find(
      (p) =>
        p.productCode.toLowerCase() === formData.productCode.trim().toLowerCase() &&
        p._id !== editingProduct?._id
    );
    if (codeMatch) {
      setFormError(
        `Duplicate product code "${formData.productCode.toUpperCase()}". Product code must be unique.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct._id, {
          productName: formData.productName.trim(),
          productCode: formData.productCode.trim().toUpperCase(),
          categoryId: formData.categoryId,
          quantity: qty,
          unitPrice: price,
          supplierId: formData.supplierId,
          reorderLevel: reorder,
        });
        showToast(`Product "${formData.productName}" updated successfully`, 'success');
      } else {
        await api.createProduct({
          productName: formData.productName.trim(),
          productCode: formData.productCode.trim().toUpperCase(),
          categoryId: formData.categoryId,
          quantity: qty,
          unitPrice: price,
          supplierId: formData.supplierId,
          reorderLevel: reorder,
        });
        showToast(`Product "${formData.productName}" created successfully`, 'success');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product (Admin only)
  const handleDeleteProduct = async (product: Product) => {
    if (!isAdmin) {
      showToast('Only Administrators can delete products', 'error');
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${product.productName}" (${product.productCode})?`
      )
    ) {
      return;
    }

    try {
      await api.deleteProduct(product._id);
      showToast(`Product "${product.productName}" deleted successfully`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  // Add category helper
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const newCat = await api.createCategory({
        categoryName: newCategoryName.trim(),
        description: newCategoryDesc.trim(),
      });
      showToast(`Category "${newCat.categoryName}" added`, 'success');
      setFormData((prev) => ({ ...prev, categoryId: newCat._id }));
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to create category', 'error');
    }
  };

  // Filter & Search processing (FR-06)
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Search by name or code
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          prod.productName.toLowerCase().includes(q) ||
          prod.productCode.toLowerCase().includes(q) ||
          (prod.categoryName && prod.categoryName.toLowerCase().includes(q)) ||
          (prod.supplierName && prod.supplierName.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Filter by category
      if (selectedCategory !== 'all' && prod.categoryId !== selectedCategory) {
        return false;
      }

      // Filter by supplier
      if (selectedSupplier !== 'all' && prod.supplierId !== selectedSupplier) {
        return false;
      }

      // Filter by stock status
      if (stockStatus === 'out_of_stock') {
        return prod.quantity <= 0;
      }
      if (stockStatus === 'low_stock') {
        return prod.quantity > 0 && prod.quantity <= prod.reorderLevel;
      }
      if (stockStatus === 'in_stock') {
        return prod.quantity > prod.reorderLevel;
      }

      return true;
    });
  }, [products, searchTerm, selectedCategory, selectedSupplier, stockStatus]);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-400" />
            <span>Product Inventory Catalog</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage products, stock counts, reorder thresholds, and suppliers (FR-03 & FR-06)
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar (FR-06) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="md:col-span-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or code..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier filter */}
          <div>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Suppliers ({suppliers.length})</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.supplierName}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status filter */}
          <div>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">Healthy (Above Reorder)</option>
              <option value="low_stock">Low Stock (≤ Reorder Level)</option>
              <option value="out_of_stock">Out of Stock (0 units)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <div>
            Showing <span className="font-semibold text-slate-200">{filteredProducts.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{products.length}</span> total products
          </div>
          {(searchTerm || selectedCategory !== 'all' || selectedSupplier !== 'all' || stockStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedSupplier('all');
                setStockStatus('all');
              }}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table (FR-03 & FR-06) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-semibold">Product Name</th>
                <th className="py-3 px-4 font-semibold">Code</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Available Qty</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Price</th>
                <th className="py-3 px-4 font-semibold text-right">Valuation</th>
                <th className="py-3 px-4 font-semibold">Supplier</th>
                <th className="py-3 px-4 font-semibold text-center">Stock Quick Actions</th>
                <th className="py-3 px-4 font-semibold text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className="font-medium text-slate-300 text-sm">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search criteria or add a new product.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isOutOfStock = prod.quantity <= 0;
                  const isLowStock = !isOutOfStock && prod.quantity <= prod.reorderLevel;
                  const totalValuation = prod.quantity * prod.unitPrice;

                  return (
                    <tr key={prod._id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4 font-medium text-slate-100 max-w-[200px]">
                        <div className="truncate" title={prod.productName}>
                          {prod.productName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Reorder threshold: {prod.reorderLevel} units
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-medium text-indigo-300">
                        {prod.productCode}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-[11px]">
                          {prod.categoryName}
                        </span>
                      </td>

                      {/* Quantity & Status Badge */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-sm text-slate-100">
                          {prod.quantity}
                        </div>
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-400">
                            <AlertTriangle className="w-2.5 h-2.5" /> Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                            <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-medium">Healthy</span>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        ${prod.unitPrice.toFixed(2)}
                      </td>

                      {/* Valuation */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-200">
                        ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-4 text-slate-400 max-w-[160px] truncate" title={prod.supplierName}>
                        {prod.supplierName}
                      </td>

                      {/* Quick stock operations */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenStockIn(prod)}
                            title="Quick Stock-In (Purchase/Return)"
                            className="p-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition-colors"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenStockOut(prod)}
                            disabled={prod.quantity <= 0}
                            title={prod.quantity <= 0 ? 'Cannot issue stock (0 units)' : 'Quick Stock-Out (Sale/Issue)'}
                            className="p-1.5 rounded-lg bg-sky-950/70 hover:bg-sky-900 text-sky-300 border border-sky-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ArrowUpFromLine className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Edit / Delete */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            title="Edit Product Info (FR-03)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin ? (
                            <button
                              onClick={() => handleDeleteProduct(prod)}
                              title="Delete Product (Admin Only)"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span
                              title="Admin required to delete"
                              className="text-slate-400 cursor-not-allowed p-1.5"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal (FR-03) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4.5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">
                  {editingProduct ? 'Edit Product Details' : 'Add New Inventory Product'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="m-4 mb-0 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Product Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. Brushless Servo Motor 400W"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Product Code (Unique) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Unique Product Code (SKU) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.productCode}
                  onChange={(e) => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. MOT-BSM-400"
                  className="w-full px-3.5 py-2 font-mono bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 placeholder-slate-400 focus:outline-none focus:border-indigo-500 uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Must be unique across the entire product catalog (Business Rule 1)
                </span>
              </div>

              {/* Category Dropdown + Quick Add */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(true)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    + New Category
                  </button>
                </div>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Dropdown */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Primary Supplier <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.supplierName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Numbers grid: Quantity, Unit Price, Reorder Level */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Initial Qty <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Unit Price ($) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Reorder Alert Level <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Submodal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create New Category</h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Hydraulic Accessories"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="e.g. Hoses, valves and couplers"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
