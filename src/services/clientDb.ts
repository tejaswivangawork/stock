import {
  User,
  Category,
  Supplier,
  Product,
  StockTransaction,
  PurchaseOrder,
  DashboardMetrics,
} from '../types/index.ts';

const CLIENT_DB_STORAGE_KEY = 'stock_ms_client_database_v2';

interface ClientDatabaseSchema {
  users: (User & { passwordHash?: string })[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  stockTransactions: StockTransaction[];
  purchaseOrders: PurchaseOrder[];
}

function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8) +
    Math.random().toString(36).substring(2, 6)
  );
}

function getInitialClientSeed(): ClientDatabaseSchema {
  const users: (User & { passwordHash?: string })[] = [
    {
      _id: 'usr_admin_01',
      name: 'Sarah Connor (Admin)',
      email: 'admin@stockms.com',
      passwordHash: 'admin123',
      role: 'Admin',
      createdAt: '2026-01-10T08:00:00.000Z',
    },
    {
      _id: 'usr_staff_01',
      name: 'Alex Rivera (Staff)',
      email: 'staff@stockms.com',
      passwordHash: 'staff123',
      role: 'Staff',
      createdAt: '2026-01-15T09:30:00.000Z',
    },
  ];

  const categories: Category[] = [
    { _id: 'cat_01', categoryName: 'Industrial Components', description: 'Precision mechanical & electrical components' },
    { _id: 'cat_02', categoryName: 'Electronic Hardware', description: 'Circuit modules, sensors, power supplies' },
    { _id: 'cat_03', categoryName: 'Safety & PPE', description: 'Protective gear, helmets, respirators' },
    { _id: 'cat_04', categoryName: 'Packaging & Logistics', description: 'Corrugated cartons, thermal tape, wrap' },
    { _id: 'cat_05', categoryName: 'Fasteners & Raw Materials', description: 'Bolts, structural extrusions, fittings' },
  ];

  const suppliers: Supplier[] = [
    { _id: 'sup_01', supplierName: 'Apex Precision Mechanics Inc.', contactNumber: '+1 (555) 234-8901', email: 'sales@apexprecision.example.com', address: '742 Industrial Parkway, Detroit, MI 48201' },
    { _id: 'sup_02', supplierName: 'Silicon Gate Micro Technologies', contactNumber: '+1 (555) 456-7890', email: 'orders@silicongate.example.com', address: '102 Tech Vista Blvd, San Jose, CA 95110' },
    { _id: 'sup_03', supplierName: 'Vanguard Industrial Safety Goods', contactNumber: '+1 (555) 789-0123', email: 'supply@vanguardppe.example.com', address: '330 Harbor Terminal Rd, Houston, TX 77002' },
    { _id: 'sup_04', supplierName: 'EcoPack Global Shipping Materials', contactNumber: '+1 (555) 890-1234', email: 'fulfillment@ecopack.example.com', address: '91 Logistics Way, Chicago, IL 60607' },
  ];

  const products: Product[] = [
    { _id: 'prd_01', productName: 'NEMA 23 High-Torque Stepper Motor', productCode: 'IND-MTR-230', categoryId: 'cat_01', quantity: 4, unitPrice: 42.5, supplierId: 'sup_01', reorderLevel: 12, createdAt: '2026-01-15T10:00:00.000Z', updatedAt: '2026-01-28T14:30:00.000Z' },
    { _id: 'prd_02', productName: 'Digital Multimeter True RMS 6000 Counts', productCode: 'ELC-DMM-600', categoryId: 'cat_02', quantity: 26, unitPrice: 68.0, supplierId: 'sup_02', reorderLevel: 8, createdAt: '2026-01-16T11:30:00.000Z', updatedAt: '2026-01-20T16:00:00.000Z' },
    { _id: 'prd_03', productName: 'Thermal Barcode Transfer Ribbon', productCode: 'PKG-TBR-110', categoryId: 'cat_04', quantity: 3, unitPrice: 11.25, supplierId: 'sup_04', reorderLevel: 15, createdAt: '2026-01-17T09:00:00.000Z', updatedAt: '2026-01-25T11:00:00.000Z' },
    { _id: 'prd_04', productName: 'ANSI Type 1 Industrial Hard Hat', productCode: 'SFT-HAT-01', categoryId: 'cat_03', quantity: 58, unitPrice: 22.0, supplierId: 'sup_03', reorderLevel: 20, createdAt: '2026-01-18T13:45:00.000Z', updatedAt: '2026-01-29T10:15:00.000Z' },
    { _id: 'prd_05', productName: 'Anti-Static ESD Wrist Strap', productCode: 'ELC-ESD-02', categoryId: 'cat_02', quantity: 0, unitPrice: 8.5, supplierId: 'sup_02', reorderLevel: 25, createdAt: '2026-01-19T08:30:00.000Z', updatedAt: '2026-01-29T17:00:00.000Z' },
  ];

  const stockTransactions: StockTransaction[] = [
    { _id: 'tx_01', productId: 'prd_01', productName: 'NEMA 23 High-Torque Stepper Motor', productCode: 'IND-MTR-230', transactionType: 'Stock-In', quantity: 20, reason: 'Purchase', performedBy: 'usr_admin_01', performedByName: 'Sarah Connor (Admin)', transactionDate: '2026-01-20T10:00:00.000Z', unitPrice: 42.5, totalValue: 850.0 },
    { _id: 'tx_02', productId: 'prd_01', productName: 'NEMA 23 High-Torque Stepper Motor', productCode: 'IND-MTR-230', transactionType: 'Stock-Out', quantity: 16, reason: 'Sale', performedBy: 'usr_staff_01', performedByName: 'Alex Rivera (Staff)', transactionDate: '2026-01-28T14:30:00.000Z', unitPrice: 42.5, totalValue: 680.0 },
  ];

  return { users, categories, suppliers, products, stockTransactions, purchaseOrders: [] };
}

class ClientStorageDatabase {
  private schema: ClientDatabaseSchema;

  constructor() {
    this.schema = this.load();
  }

  private load(): ClientDatabaseSchema {
    try {
      const raw = localStorage.getItem(CLIENT_DB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.products) return parsed;
      }
    } catch (e) {
      console.warn('Could not read client db', e);
    }
    const seed = getInitialClientSeed();
    this.save(seed);
    return seed;
  }

  private save(dataToSave?: ClientDatabaseSchema) {
    try {
      localStorage.setItem(CLIENT_DB_STORAGE_KEY, JSON.stringify(dataToSave || this.schema));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public reset() {
    this.schema = getInitialClientSeed();
    this.save();
    return this.schema;
  }

  private enrichProduct(prod: Product): Product {
    const cat = this.schema.categories.find((c) => c._id === prod.categoryId);
    const sup = this.schema.suppliers.find((s) => s._id === prod.supplierId);
    return {
      ...prod,
      categoryName: cat?.categoryName || 'Unassigned',
      supplierName: sup?.supplierName || 'Unassigned',
    };
  }

  public login(email: string, password: string): { user: User; token: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.schema.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) throw new Error('Invalid email or password');

    const valid =
      user.passwordHash === password ||
      (user.email === 'admin@stockms.com' && password === 'admin123') ||
      (user.email === 'staff@stockms.com' && password === 'staff123');
    if (!valid) throw new Error('Invalid email or password');

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, token: `client_jwt_${user._id}_${Date.now()}` };
  }

  public register(data: { name: string; email: string; password: string; role?: 'Admin' | 'Staff' }): { user: User; token: string } {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = this.schema.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) throw new Error('User with this email already exists');

    const newUser = {
      _id: generateId(),
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash: data.password,
      role: data.role || 'Staff',
      createdAt: new Date().toISOString(),
    };
    this.schema.users.push(newUser);
    this.save();
    const { passwordHash, ...safeUser } = newUser;
    return { user: safeUser, token: `client_jwt_${newUser._id}_${Date.now()}` };
  }

  public getUsers(): User[] {
    return this.schema.users.map(({ passwordHash, ...rest }) => rest);
  }

  public createUser(data: any): User {
    return this.register(data).user;
  }

  public deleteUser(id: string): boolean {
    const idx = this.schema.users.findIndex((u) => u._id === id);
    if (idx === -1) return false;
    this.schema.users.splice(idx, 1);
    this.save();
    return true;
  }

  public getCategories(): Category[] {
    return [...this.schema.categories];
  }

  public createCategory(data: { categoryName: string; description?: string }): Category {
    const newCat = { _id: generateId(), categoryName: data.categoryName.trim(), description: data.description || '' };
    this.schema.categories.push(newCat);
    this.save();
    return newCat;
  }

  public getSuppliers(): Supplier[] {
    return [...this.schema.suppliers];
  }

  public createSupplier(data: any): Supplier {
    const newSup = { _id: generateId(), ...data, createdAt: new Date().toISOString() };
    this.schema.suppliers.push(newSup);
    this.save();
    return newSup;
  }

  public updateSupplier(id: string, updates: any): Supplier {
    const sup = this.schema.suppliers.find((s) => s._id === id);
    if (!sup) throw new Error('Supplier not found');
    Object.assign(sup, updates);
    this.save();
    return sup;
  }

  public deleteSupplier(id: string): boolean {
    const idx = this.schema.suppliers.findIndex((s) => s._id === id);
    if (idx === -1) return false;
    this.schema.suppliers.splice(idx, 1);
    this.save();
    return true;
  }

  public getProducts(filters?: any): Product[] {
    let list = this.schema.products.map((p) => this.enrichProduct(p));
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((p) => p.productName.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q));
    }
    if (filters?.categoryId && filters.categoryId !== 'all') list = list.filter((p) => p.categoryId === filters.categoryId);
    if (filters?.supplierId && filters.supplierId !== 'all') list = list.filter((p) => p.supplierId === filters.supplierId);
    if (filters?.stockStatus === 'out_of_stock') list = list.filter((p) => p.quantity <= 0);
    if (filters?.stockStatus === 'low_stock') list = list.filter((p) => p.quantity > 0 && p.quantity <= p.reorderLevel);
    if (filters?.stockStatus === 'in_stock') list = list.filter((p) => p.quantity > p.reorderLevel);
    return list;
  }

  public getProductById(id: string): Product | undefined {
    const p = this.schema.products.find((prod) => prod._id === id);
    return p ? this.enrichProduct(p) : undefined;
  }

  public createProduct(data: any): Product {
    const cleanCode = data.productCode.trim().toUpperCase();
    if (this.schema.products.some((p) => p.productCode.toUpperCase() === cleanCode)) {
      throw new Error(`Product code "${cleanCode}" already exists.`);
    }
    const newProd = {
      _id: generateId(),
      productName: data.productName.trim(),
      productCode: cleanCode,
      categoryId: data.categoryId,
      quantity: Number(data.quantity) || 0,
      unitPrice: Number(data.unitPrice) || 0,
      supplierId: data.supplierId,
      reorderLevel: Number(data.reorderLevel) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.schema.products.push(newProd);
    this.save();
    return this.enrichProduct(newProd);
  }

  public updateProduct(id: string, updates: any): Product {
    const prod = this.schema.products.find((p) => p._id === id);
    if (!prod) throw new Error('Product not found');
    Object.assign(prod, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return this.enrichProduct(prod);
  }

  public deleteProduct(id: string): boolean {
    const idx = this.schema.products.findIndex((p) => p._id === id);
    if (idx === -1) return false;
    this.schema.products.splice(idx, 1);
    this.save();
    return true;
  }

  public recordStockIn(params: any) {
    const qty = Number(params.quantity);
    const prod = this.schema.products.find((p) => p._id === params.productId);
    if (!prod) throw new Error('Product not found');
    prod.quantity += qty;
    prod.updatedAt = new Date().toISOString();
    const tx = {
      _id: generateId(),
      productId: prod._id,
      productName: prod.productName,
      productCode: prod.productCode,
      transactionType: 'Stock-In' as const,
      quantity: qty,
      reason: params.reason,
      performedBy: params.performedBy,
      performedByName: params.performedByName,
      transactionDate: new Date().toISOString(),
      notes: params.notes || '',
      unitPrice: prod.unitPrice,
      totalValue: Math.round(prod.unitPrice * qty * 100) / 100,
    };
    this.schema.stockTransactions.unshift(tx);
    this.save();
    return { product: this.enrichProduct(prod), transaction: tx };
  }

  public recordStockOut(params: any) {
    const qty = Number(params.quantity);
    const prod = this.schema.products.find((p) => p._id === params.productId);
    if (!prod) throw new Error('Product not found');
    if (qty > prod.quantity) {
      throw new Error(`Insufficient stock! Requested ${qty} units, but only ${prod.quantity} available.`);
    }
    prod.quantity -= qty;
    prod.updatedAt = new Date().toISOString();
    const tx = {
      _id: generateId(),
      productId: prod._id,
      productName: prod.productName,
      productCode: prod.productCode,
      transactionType: 'Stock-Out' as const,
      quantity: qty,
      reason: params.reason,
      performedBy: params.performedBy,
      performedByName: params.performedByName,
      transactionDate: new Date().toISOString(),
      notes: params.notes || '',
      unitPrice: prod.unitPrice,
      totalValue: Math.round(prod.unitPrice * qty * 100) / 100,
    };
    this.schema.stockTransactions.unshift(tx);
    this.save();
    return { product: this.enrichProduct(prod), transaction: tx };
  }

  public getTransactions(limit = 100) {
    return this.schema.stockTransactions.slice(0, limit);
  }

  public getLowStockProducts() {
    return this.schema.products.filter((p) => p.quantity <= p.reorderLevel).map((p) => this.enrichProduct(p));
  }

  public getPurchaseOrders() {
    return [...this.schema.purchaseOrders];
  }

  public createPurchaseOrder(params: any) {
    const supplier = this.schema.suppliers.find((s) => s._id === params.supplierId);
    let total = 0;
    const poItems = params.products.map((item: any) => {
      const prod = this.schema.products.find((p) => p._id === item.productId);
      const subtotal = (item.quantity || 1) * (prod?.unitPrice || 0);
      total += subtotal;
      return { productId: prod?._id || '', productName: prod?.productName || '', productCode: prod?.productCode || '', quantity: item.quantity, unitPrice: prod?.unitPrice || 0, subtotal };
    });
    const newPO = {
      _id: generateId(),
      poNumber: `PO-${new Date().getFullYear()}-${String(this.schema.purchaseOrders.length + 1).padStart(3, '0')}`,
      supplierId: supplier?._id || '',
      supplierName: supplier?.supplierName || '',
      products: poItems,
      totalAmount: total,
      orderDate: new Date().toISOString(),
      status: 'Pending' as const,
      createdBy: params.createdBy,
      createdByName: params.createdByName,
      notes: params.notes || '',
    };
    this.schema.purchaseOrders.unshift(newPO);
    this.save();
    return newPO;
  }

  public updatePurchaseOrderStatus(id: string, status: any, user: any) {
    const po = this.schema.purchaseOrders.find((p) => p._id === id);
    if (!po) throw new Error('PO not found');
    po.status = status;
    if (status === 'Received') {
      for (const item of po.products) {
        const prod = this.schema.products.find((p) => p._id === item.productId);
        if (prod) {
          prod.quantity += item.quantity;
          this.schema.stockTransactions.unshift({
            _id: generateId(),
            productId: prod._id,
            productName: prod.productName,
            productCode: prod.productCode,
            transactionType: 'Stock-In',
            quantity: item.quantity,
            reason: 'Purchase',
            performedBy: user.id,
            performedByName: user.name,
            transactionDate: new Date().toISOString(),
            notes: `Fulfillment of PO ${po.poNumber}`,
            unitPrice: item.unitPrice,
            totalValue: item.subtotal,
          });
        }
      }
    }
    this.save();
    return po;
  }

  public getDashboardMetrics(): DashboardMetrics {
    const totalProducts = this.schema.products.length;
    const totalStockQuantity = this.schema.products.reduce((acc, p) => acc + p.quantity, 0);
    const totalInventoryValue = Math.round(this.schema.products.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0) * 100) / 100;
    const lowStockProducts = this.getLowStockProducts();
    const lowStockCount = lowStockProducts.filter((p) => p.quantity > 0).length;
    const outOfStockCount = lowStockProducts.filter((p) => p.quantity <= 0).length;
    const recentTransactions = this.schema.stockTransactions.slice(0, 8);
    const categoryBreakdown = this.schema.categories.map((cat) => {
      const prods = this.schema.products.filter((p) => p.categoryId === cat._id);
      return {
        categoryName: cat.categoryName,
        productCount: prods.length,
        totalQty: prods.reduce((a, b) => a + b.quantity, 0),
        value: Math.round(prods.reduce((a, b) => a + b.quantity * b.unitPrice, 0) * 100) / 100,
      };
    });
    return {
      totalProducts,
      totalStockQuantity,
      totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      totalSuppliers: this.schema.suppliers.length,
      totalPurchaseOrders: this.schema.purchaseOrders.length,
      recentTransactions,
      lowStockProducts,
      categoryBreakdown,
    };
  }
}

export const clientDb = new ClientStorageDatabase();
