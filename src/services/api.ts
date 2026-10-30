import {
  User,
  Category,
  Supplier,
  Product,
  StockTransaction,
  PurchaseOrder,
  DashboardMetrics,
} from '../types/index.ts';
import { clientDb } from './clientDb.ts';

const TOKEN_KEY = 'stock_ms_auth_token';
const USER_KEY = 'stock_ms_user_info';

let isBackendUnavailable: boolean | null = null;

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
  isClientMode(): boolean {
    return isBackendUnavailable === true;
  },
};

async function safeServerFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ ok: boolean; data?: T; error?: string; status?: number }> {
  if (isBackendUnavailable === true) {
    return { ok: false, status: 404, error: 'Static host - using browser storage' };
  }

  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (response.status === 404 || (!isJson && response.status === 200)) {
      isBackendUnavailable = true;
      return { ok: false, status: 404, error: 'API route not available on static host' };
    }

    const data = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const msg = typeof data === 'object' && data !== null && 'message' in data ? (data as any).message : `Request failed (${response.status})`;
      return { ok: false, status: response.status, error: msg };
    }

    isBackendUnavailable = false;
    return { ok: true, data: data as T };
  } catch (err: any) {
    isBackendUnavailable = true;
    return { ok: false, status: 0, error: err.message || 'Network unreachable' };
  }
}

export const api = {
  isClientStorageMode(): boolean {
    return isBackendUnavailable === true;
  },

  async login(credentials: { email: string; password: string }) {
    const res = await safeServerFetch<{ message: string; user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (res.ok && res.data) {
      authStorage.setToken(res.data.token);
      authStorage.setUser(res.data.user);
      return res.data;
    }

    if (res.status === 401 || (res.status === 400 && !isBackendUnavailable)) {
      throw new Error(res.error || 'Invalid credentials');
    }

    const clientResult = clientDb.login(credentials.email, credentials.password);
    authStorage.setToken(clientResult.token);
    authStorage.setUser(clientResult.user);
    return {
      message: 'Login successful',
      user: clientResult.user,
      token: clientResult.token,
    };
  },

  async register(data: { name: string; email: string; password: string; role?: 'Admin' | 'Staff' }) {
    const res = await safeServerFetch<{ message: string; user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (res.ok && res.data) {
      authStorage.setToken(res.data.token);
      authStorage.setUser(res.data.user);
      return res.data;
    }

    if (res.status === 400 && !isBackendUnavailable) {
      throw new Error(res.error || 'Registration failed');
    }

    const clientResult = clientDb.register(data);
    authStorage.setToken(clientResult.token);
    authStorage.setUser(clientResult.user);
    return {
      message: 'Registration successful',
      user: clientResult.user,
      token: clientResult.token,
    };
  },

  async logout() {
    try {
      await safeServerFetch<{ message: string }>('/api/auth/logout', { method: 'POST' });
    } finally {
      authStorage.clear();
    }
  },

  async getMe() {
    const res = await safeServerFetch<{ user: User }>('/api/auth/me');
    if (res.ok && res.data) return res.data;
    const localUser = authStorage.getUser();
    if (localUser) return { user: localUser };
    throw new Error('Not authenticated');
  },

  async getUsers() {
    const res = await safeServerFetch<User[]>('/api/users');
    if (res.ok && res.data) return res.data;
    return clientDb.getUsers();
  },

  async createUser(data: any) {
    const res = await safeServerFetch<User>('/api/users', { method: 'POST', body: JSON.stringify(data) });
    if (res.ok && res.data) return res.data;
    return clientDb.createUser(data);
  },

  async deleteUser(id: string) {
    const res = await safeServerFetch<{ message: string }>(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok && res.data) return res.data;
    clientDb.deleteUser(id);
    return { message: 'User deleted' };
  },

  async getCategories() {
    const res = await safeServerFetch<Category[]>('/api/categories');
    if (res.ok && res.data) return res.data;
    return clientDb.getCategories();
  },

  async createCategory(data: any) {
    const res = await safeServerFetch<Category>('/api/categories', { method: 'POST', body: JSON.stringify(data) });
    if (res.ok && res.data) return res.data;
    return clientDb.createCategory(data);
  },

  async getProducts(filters?: any) {
    const res = await safeServerFetch<Product[]>('/api/products');
    if (res.ok && res.data) return res.data;
    return clientDb.getProducts(filters);
  },

  async getProductById(id: string) {
    const res = await safeServerFetch<Product>(`/api/products/${id}`);
    if (res.ok && res.data) return res.data;
    const p = clientDb.getProductById(id);
    if (!p) throw new Error('Product not found');
    return p;
  },

  async createProduct(data: any) {
    const res = await safeServerFetch<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) });
    if (res.ok && res.data) return res.data;
    return clientDb.createProduct(data);
  },

  async updateProduct(id: string, updates: any) {
    const res = await safeServerFetch<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    if (res.ok && res.data) return res.data;
    return clientDb.updateProduct(id, updates);
  },

  async deleteProduct(id: string) {
    const res = await safeServerFetch<{ message: string }>(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok && res.data) return res.data;
    clientDb.deleteProduct(id);
    return { message: 'Product deleted' };
  },

  async recordStockIn(data: any) {
    const res = await safeServerFetch<any>('/api/stock/in', { method: 'POST', body: JSON.stringify(data) });
    if (res.ok && res.data) return res.data;
    const currentUser = authStorage.getUser();
    const result = clientDb.recordStockIn({ ...data, performedBy: currentUser?._id || 'usr_staff_01', performedByName: currentUser?.name || 'Staff User' });
    return { message: `Added ${data.quantity} units`, ...result };
  },

  async recordStockOut(data: any) {
    const res = await safeServerFetch<any>('/api/stock/out', { method: 'POST', body: JSON.stringify(data) });
    if (res.ok && res.data) return res.data;
    const currentUser = authStorage.getUser();
    const result = clientDb.recordStockOut({ ...data, performedBy: currentUser?._id || 'usr_staff_01', performedByName: currentUser?.name || 'Staff User' });
    return { message: `Deducted ${data.quantity} units`, ...result };
  },

  async getTransactions(limit = 100) {
    const res = await safeServerFetch<StockTransaction[]>(`/api/stock/transactions?limit=${limit}`);
    if (res.ok && res.data) return res.data;
    return clientDb.getTransactions(limit);
  },

  async getLowStockProducts() {
    const res = await safeServerFetch<Product[]>('/api/stock/low-stock');
    if (res.ok && res.data) return res.data;
    return clientDb.getLowStockProducts();
  },

  async getSuppliers() {
    const res = await safeServerFetch<Supplier[]>('/api/suppliers');
    if (res.ok && res.data) return res.data;
    return clientDb.getSuppliers();
  },

  async createSupplier(data: any) {
    const res = await safeServerFetch<Supplier>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) });
    if (res.ok && res.data) return res.data;
    return clientDb.createSupplier(data);
  },

  async updateSupplier(id: string, updates: any) {
    const res = await safeServerFetch<Supplier>(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    if (res.ok && res.data) return res.data;
    return clientDb.updateSupplier(id, updates);
  },

  async deleteSupplier(id: string) {
    const res = await safeServerFetch<{ message: string }>(`/api/suppliers/${id}`, { method: 'DELETE' });
    if (res.ok && res.data) return res.data;
    clientDb.deleteSupplier(id);
    return { message: 'Supplier deleted' };
  },

  async getPurchaseOrders() {
    const res = await safeServerFetch<PurchaseOrder[]>('/api/purchase-orders');
    if (res.ok && res.data) return res.data;
    return clientDb.getPurchaseOrders();
  },

  async createPurchaseOrder(data: any) {
    const res = await safeServerFetch<PurchaseOrder>('/api/purchase-orders', { method: 'POST', body: JSON.stringify(data) });
    if (res.ok && res.data) return res.data;
    const currentUser = authStorage.getUser();
    return clientDb.createPurchaseOrder({ ...data, createdBy: currentUser?._id || 'usr_admin_01', createdByName: currentUser?.name || 'Administrator' });
  },

  async updatePurchaseOrderStatus(id: string, status: any) {
    const res = await safeServerFetch<PurchaseOrder>(`/api/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    if (res.ok && res.data) return res.data;
    const currentUser = authStorage.getUser();
    return clientDb.updatePurchaseOrderStatus(id, status, { id: currentUser?._id || 'usr_admin_01', name: currentUser?.name || 'Administrator' });
  },

  async getInventoryReport() {
    const res = await safeServerFetch<DashboardMetrics>('/api/reports/inventory');
    if (res.ok && res.data) return res.data;
    return clientDb.getDashboardMetrics();
  },

  async getStockMovementsReport(limit = 200) {
    const res = await safeServerFetch<StockTransaction[]>(`/api/reports/stock-movements?limit=${limit}`);
    if (res.ok && res.data) return res.data;
    return clientDb.getTransactions(limit);
  },

  async resetDatabase() {
    const res = await safeServerFetch<{ message: string }>('/api/admin/reset-database', { method: 'POST' });
    if (res.ok && res.data) return res.data;
    clientDb.reset();
    return { message: 'Database reset to default seed records' };
  },
};
