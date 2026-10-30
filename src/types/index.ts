export type UserRole = 'Admin' | 'Staff';

export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: string;
}

export interface Category {
  _id: string;
  categoryName: string;
  description: string;
}

export interface Supplier {
  _id: string;
  supplierName: string;
  contactNumber: string;
  email: string;
  address: string;
  createdAt?: string;
}

export interface Product {
  _id: string;
  productName: string;
  productCode: string; // Unique
  categoryId: string;
  quantity: number;
  unitPrice: number;
  supplierId: string;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
  // Denormalized/joined helpers
  categoryName?: string;
  supplierName?: string;
}

export type StockInReason = 'Purchase' | 'Return';
export type StockOutReason = 'Sale' | 'Issue';
export type TransactionReason = StockInReason | StockOutReason;

export interface StockTransaction {
  _id: string;
  productId: string;
  productName: string;
  productCode: string;
  transactionType: 'Stock-In' | 'Stock-Out';
  quantity: number;
  reason: TransactionReason;
  performedBy: string; // user id
  performedByName: string; // user display name
  transactionDate: string;
  notes?: string;
  unitPrice?: number;
  totalValue?: number;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type PurchaseOrderStatus = 'Pending' | 'Ordered' | 'Received' | 'Cancelled';

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  products: PurchaseOrderItem[];
  totalAmount: number;
  orderDate: string;
  status: PurchaseOrderStatus;
  createdBy: string;
  createdByName: string;
  notes?: string;
  receivedAt?: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalStockQuantity: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalSuppliers: number;
  totalPurchaseOrders: number;
  recentTransactions: StockTransaction[];
  lowStockProducts: Product[];
  categoryBreakdown: { categoryName: string; productCount: number; totalQty: number; value: number }[];
}
