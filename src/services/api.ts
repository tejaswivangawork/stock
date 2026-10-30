import {
  User,
  Category,
  Supplier,
  Product,
  StockTransaction,
  PurchaseOrder,
  DashboardMetrics,
} from '../types/index.ts';

const TOKEN_KEY = 'stock_ms_auth_token';
const USER_KEY = 'stock_ms_user_info';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof data === 'object' && data !== null && 'message' in data
        ? (data as any).message
        : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }) {
    const res = await apiFetch<{ message: string; user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    return res;
  },

  async register(data: { name: string; email: string; password: string; role?: 'Admin' | 'Staff' }) {
    const res = await apiFetch<{ message: string; user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    return res;
  },

  async logout() {
    try {
      await apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST' });
    } finally {
      authStorage.clear();
    }
  },

  async getMe() {
    return apiFetch<{ user: User }>('/api/auth/me');
  },

  // Users
  async getUsers() {
    return apiFetch<User[]>('/api/users');
  },

  async createUser(data: { name: string; email: string; password: string; role: 'Admin' | 'Staff' }) {
    return apiFetch<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: string) {
    return apiFetch<{ message: string }>(`/api/users/${id}`, { method: 'DELETE' });
  },

  // Categories
  async getCategories() {
    return apiFetch<Category[]>('/api/categories');
  },

  async createCategory(data: { categoryName: string; description?: string }) {
    return apiFetch<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Products
  async getProducts(filters?: {
    search?: string;
    categoryId?: string;
    supplierId?: string;
    stockStatus?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId && filters.categoryId !== 'all') params.append('categoryId', filters.categoryId);
    if (filters?.supplierId && filters.supplierId !== 'all') params.append('supplierId', filters.supplierId);
    if (filters?.stockStatus && filters.stockStatus !== 'all') params.append('stockStatus', filters.stockStatus);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<Product[]>(`/api/products${query}`);
  },

  async getProductById(id: string) {
    return apiFetch<Product>(`/api/products/${id}`);
  },

  async createProduct(data: {
    productName: string;
    productCode: string;
    categoryId: string;
    quantity: number;
    unitPrice: number;
    supplierId: string;
    reorderLevel: number;
  }) {
    return apiFetch<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    return apiFetch<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteProduct(id: string) {
    return apiFetch<{ message: string }>(`/api/products/${id}`, { method: 'DELETE' });
  },

  // Stock operations
  async recordStockIn(data: {
    productId: string;
    quantity: number;
    reason: 'Purchase' | 'Return';
    notes?: string;
  }) {
    return apiFetch<{ message: string; product: Product; transaction: StockTransaction }>(
      '/api/stock/in',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async recordStockOut(data: {
    productId: string;
    quantity: number;
    reason: 'Sale' | 'Issue';
    notes?: string;
  }) {
    return apiFetch<{ message: string; product: Product; transaction: StockTransaction }>(
      '/api/stock/out',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async getTransactions(limit = 100) {
    return apiFetch<StockTransaction[]>(`/api/stock/transactions?limit=${limit}`);
  },

  async getLowStockProducts() {
    return apiFetch<Product[]>('/api/stock/low-stock');
  },

  // Suppliers
  async getSuppliers() {
    return apiFetch<Supplier[]>('/api/suppliers');
  },

  async createSupplier(data: {
    supplierName: string;
    contactNumber: string;
    email: string;
    address: string;
  }) {
    return apiFetch<Supplier>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSupplier(id: string, updates: Partial<Supplier>) {
    return apiFetch<Supplier>(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteSupplier(id: string) {
    return apiFetch<{ message: string }>(`/api/suppliers/${id}`, { method: 'DELETE' });
  },

  // Purchase Orders
  async getPurchaseOrders() {
    return apiFetch<PurchaseOrder[]>('/api/purchase-orders');
  },

  async createPurchaseOrder(data: {
    supplierId: string;
    products: { productId: string; quantity: number; unitPrice?: number }[];
    notes?: string;
  }) {
    return apiFetch<PurchaseOrder>('/api/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePurchaseOrderStatus(
    id: string,
    status: 'Pending' | 'Ordered' | 'Received' | 'Cancelled'
  ) {
    return apiFetch<PurchaseOrder>(`/api/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Reports
  async getInventoryReport() {
    return apiFetch<DashboardMetrics>('/api/reports/inventory');
  },

  async getStockMovementsReport(limit = 200) {
    return apiFetch<StockTransaction[]>(`/api/reports/stock-movements?limit=${limit}`);
  },

  async resetDatabase() {
    return apiFetch<{ message: string }>('/api/admin/reset-database', { method: 'POST' });
  },
};
