import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Category,
  Supplier,
  Product,
  StockTransaction,
  PurchaseOrder,
} from '../types/index.ts';

interface DatabaseSchema {
  users: User[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  stockTransactions: StockTransaction[];
  purchaseOrders: PurchaseOrder[];
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'inventory_db.json');

// Helper to generate mongo-like IDs
export function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8) +
    Math.random().toString(36).substring(2, 6)
  );
}

// Initial seed data
function getInitialSeedData(): DatabaseSchema {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const staffPasswordHash = bcrypt.hashSync('staff123', 10);

  const users: User[] = [
    {
      _id: 'usr_admin_01',
      name: 'Sarah Connor (Admin)',
      email: 'admin@stockms.com',
      password: adminPasswordHash,
      role: 'Admin',
      createdAt: '2026-01-10T08:00:00.000Z',
    },
    {
      _id: 'usr_staff_01',
      name: 'Alex Rivera (Staff)',
      email: 'staff@stockms.com',
      password: staffPasswordHash,
      role: 'Staff',
      createdAt: '2026-01-15T09:30:00.000Z',
    },
  ];

  const categories: Category[] = [
    {
      _id: 'cat_01',
      categoryName: 'Industrial Components',
      description: 'Precision mechanical & electrical components for automation',
    },
    {
      _id: 'cat_02',
      categoryName: 'Electronic Hardware',
      description: 'Circuit modules, sensors, power supplies & testing equipment',
    },
    {
      _id: 'cat_03',
      categoryName: 'Safety & PPE',
      description: 'Protective gear, helmets, respirators, and workplace safety',
    },
    {
      _id: 'cat_04',
      categoryName: 'Packaging & Logistics',
      description: 'Corrugated cartons, thermal tape, pallet wrap & mailing items',
    },
    {
      _id: 'cat_05',
      categoryName: 'Fasteners & Raw Materials',
      description: 'Bolts, structural extrusions, sheet metals & brass fittings',
    },
  ];

  const suppliers: Supplier[] = [
    {
      _id: 'sup_01',
      supplierName: 'Apex Precision Mechanics Inc.',
      contactNumber: '+1 (555) 234-8901',
      email: 'sales@apexprecision.example.com',
      address: '742 Industrial Parkway, Detroit, MI 48201',
      createdAt: '2026-01-05T10:00:00.000Z',
    },
    {
      _id: 'sup_02',
      supplierName: 'Silicon Gate Micro Technologies',
      contactNumber: '+1 (555) 456-7890',
      email: 'orders@silicongate.example.com',
      address: '102 Tech Vista Blvd, San Jose, CA 95110',
      createdAt: '2026-01-06T11:15:00.000Z',
    },
    {
      _id: 'sup_03',
      supplierName: 'Vanguard Industrial Safety Goods',
      contactNumber: '+1 (555) 789-0123',
      email: 'supply@vanguardppe.example.com',
      address: '330 Harbor Terminal Rd, Houston, TX 77002',
      createdAt: '2026-01-08T14:20:00.000Z',
    },
    {
      _id: 'sup_04',
      supplierName: 'EcoPack Global Shipping Materials',
      contactNumber: '+1 (555) 890-1234',
      email: 'fulfillment@ecopack.example.com',
      address: '91 Logistics Way, Chicago, IL 60607',
      createdAt: '2026-01-09T09:45:00.000Z',
    },
  ];

  const products: Product[] = [
    {
      _id: 'prd_01',
      productName: 'NEMA 23 High-Torque Stepper Motor',
      productCode: 'IND-MTR-230',
      categoryId: 'cat_01',
      quantity: 4, // Below reorder level (12) -> LOW STOCK
      unitPrice: 42.5,
      supplierId: 'sup_01',
      reorderLevel: 12,
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-01-28T14:30:00.000Z',
    },
    {
      _id: 'prd_02',
      productName: 'Digital Multimeter True RMS 6000 Counts',
      productCode: 'ELC-DMM-600',
      categoryId: 'cat_02',
      quantity: 26,
      unitPrice: 68.0,
      supplierId: 'sup_02',
      reorderLevel: 8,
      createdAt: '2026-01-16T11:30:00.000Z',
      updatedAt: '2026-01-20T16:00:00.000Z',
    },
    {
      _id: 'prd_03',
      productName: 'Thermal Barcode Transfer Ribbon (110mm x 300m)',
      productCode: 'PKG-TBR-110',
      categoryId: 'cat_04',
      quantity: 3, // Below reorder level (15) -> LOW STOCK
      unitPrice: 11.25,
      supplierId: 'sup_04',
      reorderLevel: 15,
      createdAt: '2026-01-17T09:00:00.000Z',
      updatedAt: '2026-01-25T11:00:00.000Z',
    },
    {
      _id: 'prd_04',
      productName: 'ANSI Type 1 Industrial Hard Hat (Vented)',
      productCode: 'SFT-HAT-01',
      categoryId: 'cat_03',
      quantity: 58,
      unitPrice: 22.0,
      supplierId: 'sup_03',
      reorderLevel: 20,
      createdAt: '2026-01-18T13:45:00.000Z',
      updatedAt: '2026-01-29T10:15:00.000Z',
    },
    {
      _id: 'prd_05',
      productName: 'Anti-Static ESD Wrist Strap w/ Ground Cord',
      productCode: 'ELC-ESD-02',
      categoryId: 'cat_02',
      quantity: 0, // OUT OF STOCK
      unitPrice: 8.5,
      supplierId: 'sup_02',
      reorderLevel: 25,
      createdAt: '2026-01-19T08:30:00.000Z',
      updatedAt: '2026-01-29T17:00:00.000Z',
    },
    {
      _id: 'prd_06',
      productName: 'Heavy-Duty 32 ECT Corrugated Boxes (Pack of 25)',
      productCode: 'PKG-BOX-32',
      categoryId: 'cat_04',
      quantity: 120,
      unitPrice: 34.0,
      supplierId: 'sup_04',
      reorderLevel: 40,
      createdAt: '2026-01-20T14:10:00.000Z',
      updatedAt: '2026-01-27T12:00:00.000Z',
    },
    {
      _id: 'prd_07',
      productName: 'Stainless Steel M8 Flange Bolts (Box of 100)',
      productCode: 'RAW-BLT-M8',
      categoryId: 'cat_05',
      quantity: 5, // Below reorder level (18) -> LOW STOCK
      unitPrice: 19.8,
      supplierId: 'sup_01',
      reorderLevel: 18,
      createdAt: '2026-01-21T15:20:00.000Z',
      updatedAt: '2026-01-26T09:30:00.000Z',
    },
    {
      _id: 'prd_08',
      productName: 'Optical Sensor Break-Beam Module 5m Range',
      productCode: 'IND-SEN-05M',
      categoryId: 'cat_01',
      quantity: 34,
      unitPrice: 29.5,
      supplierId: 'sup_02',
      reorderLevel: 10,
      createdAt: '2026-01-22T11:00:00.000Z',
      updatedAt: '2026-01-28T16:45:00.000Z',
    },
  ];

  const stockTransactions: StockTransaction[] = [
    {
      _id: 'tx_01',
      productId: 'prd_01',
      productName: 'NEMA 23 High-Torque Stepper Motor',
      productCode: 'IND-MTR-230',
      transactionType: 'Stock-In',
      quantity: 20,
      reason: 'Purchase',
      performedBy: 'usr_admin_01',
      performedByName: 'Sarah Connor (Admin)',
      transactionDate: '2026-01-20T10:00:00.000Z',
      notes: 'Initial warehouse intake Batch #A-104',
      unitPrice: 42.5,
      totalValue: 850.0,
    },
    {
      _id: 'tx_02',
      productId: 'prd_01',
      productName: 'NEMA 23 High-Torque Stepper Motor',
      productCode: 'IND-MTR-230',
      transactionType: 'Stock-Out',
      quantity: 16,
      reason: 'Sale',
      performedBy: 'usr_staff_01',
      performedByName: 'Alex Rivera (Staff)',
      transactionDate: '2026-01-28T14:30:00.000Z',
      notes: 'Dispatched to Assembly Line B',
      unitPrice: 42.5,
      totalValue: 680.0,
    },
    {
      _id: 'tx_03',
      productId: 'prd_04',
      productName: 'ANSI Type 1 Industrial Hard Hat (Vented)',
      productCode: 'SFT-HAT-01',
      transactionType: 'Stock-In',
      quantity: 60,
      reason: 'Purchase',
      performedBy: 'usr_admin_01',
      performedByName: 'Sarah Connor (Admin)',
      transactionDate: '2026-01-22T09:15:00.000Z',
      notes: 'New shipment from Vanguard Safety',
      unitPrice: 22.0,
      totalValue: 1320.0,
    },
    {
      _id: 'tx_04',
      productId: 'prd_04',
      productName: 'ANSI Type 1 Industrial Hard Hat (Vented)',
      productCode: 'SFT-HAT-01',
      transactionType: 'Stock-Out',
      quantity: 2,
      reason: 'Issue',
      performedBy: 'usr_staff_01',
      performedByName: 'Alex Rivera (Staff)',
      transactionDate: '2026-01-29T10:15:00.000Z',
      notes: 'Issued to safety orientation trainees',
      unitPrice: 22.0,
      totalValue: 44.0,
    },
    {
      _id: 'tx_05',
      productId: 'prd_05',
      productName: 'Anti-Static ESD Wrist Strap w/ Ground Cord',
      productCode: 'ELC-ESD-02',
      transactionType: 'Stock-Out',
      quantity: 15,
      reason: 'Issue',
      performedBy: 'usr_staff_01',
      performedByName: 'Alex Rivera (Staff)',
      transactionDate: '2026-01-29T17:00:00.000Z',
      notes: 'Depleted remaining bench stock for plant expansion',
      unitPrice: 8.5,
      totalValue: 127.5,
    },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      _id: 'po_01',
      poNumber: 'PO-2026-001',
      supplierId: 'sup_01',
      supplierName: 'Apex Precision Mechanics Inc.',
      products: [
        {
          productId: 'prd_01',
          productName: 'NEMA 23 High-Torque Stepper Motor',
          productCode: 'IND-MTR-230',
          quantity: 25,
          unitPrice: 42.5,
          subtotal: 1062.5,
        },
        {
          productId: 'prd_07',
          productName: 'Stainless Steel M8 Flange Bolts (Box of 100)',
          productCode: 'RAW-BLT-M8',
          quantity: 30,
          unitPrice: 19.8,
          subtotal: 594.0,
        },
      ],
      totalAmount: 1656.5,
      orderDate: '2026-01-28T15:00:00.000Z',
      status: 'Ordered',
      createdBy: 'usr_admin_01',
      createdByName: 'Sarah Connor (Admin)',
      notes: 'Priority replenishment for low-stock manufacturing lines',
    },
    {
      _id: 'po_02',
      poNumber: 'PO-2026-002',
      supplierId: 'sup_02',
      supplierName: 'Silicon Gate Micro Technologies',
      products: [
        {
          productId: 'prd_05',
          productName: 'Anti-Static ESD Wrist Strap w/ Ground Cord',
          productCode: 'ELC-ESD-02',
          quantity: 50,
          unitPrice: 8.5,
          subtotal: 425.0,
        },
      ],
      totalAmount: 425.0,
      orderDate: '2026-01-29T18:00:00.000Z',
      status: 'Pending',
      createdBy: 'usr_admin_01',
      createdByName: 'Sarah Connor (Admin)',
      notes: 'Restock critical out-of-stock safety straps',
    },
  ];

  return {
    users,
    categories,
    suppliers,
    products,
    stockTransactions,
    purchaseOrders,
  };
}

class InventoryDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.products) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Error reading db file, falling back to seed data:', err);
    }

    const seed = getInitialSeedData();
    this.persist(seed);
    return seed;
  }

  private persist(dataToSave?: DatabaseSchema) {
    const toSave = dataToSave || this.data;
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(toSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public resetToDefaults() {
    this.data = getInitialSeedData();
    this.persist();
    return this.data;
  }

  // Helper to enrich product with category and supplier names
  private enrichProduct(prod: Product): Product {
    const cat = this.data.categories.find((c) => c._id === prod.categoryId);
    const sup = this.data.suppliers.find((s) => s._id === prod.supplierId);
    return {
      ...prod,
      categoryName: cat?.categoryName || 'Unassigned',
      supplierName: sup?.supplierName || 'Unassigned',
    };
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users.map(({ password, ...rest }) => rest as User);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u._id === id);
  }

  public createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: 'Admin' | 'Staff';
  }): User {
    const existing = this.findUserByEmail(userData.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      _id: generateId(),
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      password: bcrypt.hashSync(userData.password, 10),
      role: userData.role,
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.persist();

    const { password, ...safeUser } = newUser;
    return safeUser as User;
  }

  public deleteUser(id: string): boolean {
    const index = this.data.users.findIndex((u) => u._id === id);
    if (index === -1) return false;
    this.data.users.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Categories ---
  public getCategories(): Category[] {
    return [...this.data.categories];
  }

  public createCategory(data: { categoryName: string; description?: string }): Category {
    const existing = this.data.categories.find(
      (c) => c.categoryName.toLowerCase() === data.categoryName.trim().toLowerCase()
    );
    if (existing) {
      throw new Error(`Category "${data.categoryName}" already exists`);
    }

    const newCat: Category = {
      _id: generateId(),
      categoryName: data.categoryName.trim(),
      description: (data.description || '').trim(),
    };
    this.data.categories.push(newCat);
    this.persist();
    return newCat;
  }

  // --- Suppliers ---
  public getSuppliers(): Supplier[] {
    return [...this.data.suppliers];
  }

  public getSupplierById(id: string): Supplier | undefined {
    return this.data.suppliers.find((s) => s._id === id);
  }

  public createSupplier(data: {
    supplierName: string;
    contactNumber: string;
    email: string;
    address: string;
  }): Supplier {
    if (!data.supplierName || !data.email) {
      throw new Error('Supplier name and email are mandatory');
    }

    const newSup: Supplier = {
      _id: generateId(),
      supplierName: data.supplierName.trim(),
      contactNumber: data.contactNumber.trim(),
      email: data.email.trim(),
      address: data.address.trim(),
      createdAt: new Date().toISOString(),
    };

    this.data.suppliers.push(newSup);
    this.persist();
    return newSup;
  }

  public updateSupplier(
    id: string,
    updates: Partial<Omit<Supplier, '_id' | 'createdAt'>>
  ): Supplier {
    const sup = this.data.suppliers.find((s) => s._id === id);
    if (!sup) {
      throw new Error('Supplier not found');
    }

    if (updates.supplierName !== undefined) sup.supplierName = updates.supplierName.trim();
    if (updates.contactNumber !== undefined) sup.contactNumber = updates.contactNumber.trim();
    if (updates.email !== undefined) sup.email = updates.email.trim();
    if (updates.address !== undefined) sup.address = updates.address.trim();

    this.persist();
    return sup;
  }

  public deleteSupplier(id: string): boolean {
    const index = this.data.suppliers.findIndex((s) => s._id === id);
    if (index === -1) return false;

    // Check if supplier is used in products
    const inUse = this.data.products.some((p) => p.supplierId === id);
    if (inUse) {
      throw new Error('Cannot delete supplier associated with existing products');
    }

    this.data.suppliers.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Products ---
  public getProducts(filters?: {
    search?: string;
    categoryId?: string;
    supplierId?: string;
    stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  }): Product[] {
    let prods = this.data.products.map((p) => this.enrichProduct(p));

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      prods = prods.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.productCode.toLowerCase().includes(q) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
          (p.supplierName && p.supplierName.toLowerCase().includes(q))
      );
    }

    if (filters?.categoryId && filters.categoryId !== 'all') {
      prods = prods.filter((p) => p.categoryId === filters.categoryId);
    }

    if (filters?.supplierId && filters.supplierId !== 'all') {
      prods = prods.filter((p) => p.supplierId === filters.supplierId);
    }

    if (filters?.stockStatus && filters.stockStatus !== 'all') {
      if (filters.stockStatus === 'out_of_stock') {
        prods = prods.filter((p) => p.quantity <= 0);
      } else if (filters.stockStatus === 'low_stock') {
        prods = prods.filter((p) => p.quantity > 0 && p.quantity <= p.reorderLevel);
      } else if (filters.stockStatus === 'in_stock') {
        prods = prods.filter((p) => p.quantity > p.reorderLevel);
      }
    }

    return prods;
  }

  public getProductById(id: string): Product | undefined {
    const prod = this.data.products.find((p) => p._id === id);
    return prod ? this.enrichProduct(prod) : undefined;
  }

  public getProductByCode(code: string): Product | undefined {
    return this.data.products.find(
      (p) => p.productCode.trim().toLowerCase() === code.trim().toLowerCase()
    );
  }

  public createProduct(data: {
    productName: string;
    productCode: string;
    categoryId: string;
    quantity: number;
    unitPrice: number;
    supplierId: string;
    reorderLevel: number;
  }): Product {
    // Validation
    if (!data.productName || !data.productCode || !data.categoryId || !data.supplierId) {
      throw new Error('Mandatory product details are missing');
    }

    const cleanCode = data.productCode.trim().toUpperCase();
    if (this.getProductByCode(cleanCode)) {
      throw new Error(`Product with code "${cleanCode}" already exists. Product code must be unique.`);
    }

    const qty = Number(data.quantity);
    const price = Number(data.unitPrice);
    const reorder = Number(data.reorderLevel);

    if (isNaN(qty) || qty < 0) {
      throw new Error('Product quantity cannot be negative');
    }
    if (isNaN(price) || price < 0) {
      throw new Error('Unit price cannot be negative');
    }
    if (isNaN(reorder) || reorder < 0) {
      throw new Error('Reorder level cannot be negative');
    }

    const now = new Date().toISOString();
    const newProd: Product = {
      _id: generateId(),
      productName: data.productName.trim(),
      productCode: cleanCode,
      categoryId: data.categoryId,
      quantity: qty,
      unitPrice: price,
      supplierId: data.supplierId,
      reorderLevel: reorder,
      createdAt: now,
      updatedAt: now,
    };

    this.data.products.push(newProd);
    this.persist();
    return this.enrichProduct(newProd);
  }

  public updateProduct(
    id: string,
    updates: Partial<Omit<Product, '_id' | 'createdAt'>>
  ): Product {
    const prod = this.data.products.find((p) => p._id === id);
    if (!prod) {
      throw new Error('Product not found');
    }

    if (updates.productCode) {
      const cleanCode = updates.productCode.trim().toUpperCase();
      const existing = this.getProductByCode(cleanCode);
      if (existing && existing._id !== id) {
        throw new Error(`Product code "${cleanCode}" is already in use by another product`);
      }
      prod.productCode = cleanCode;
    }

    if (updates.productName !== undefined) prod.productName = updates.productName.trim();
    if (updates.categoryId !== undefined) prod.categoryId = updates.categoryId;
    if (updates.supplierId !== undefined) prod.supplierId = updates.supplierId;

    if (updates.quantity !== undefined) {
      const q = Number(updates.quantity);
      if (isNaN(q) || q < 0) throw new Error('Product quantity cannot be negative');
      prod.quantity = q;
    }

    if (updates.unitPrice !== undefined) {
      const p = Number(updates.unitPrice);
      if (isNaN(p) || p < 0) throw new Error('Unit price cannot be negative');
      prod.unitPrice = p;
    }

    if (updates.reorderLevel !== undefined) {
      const r = Number(updates.reorderLevel);
      if (isNaN(r) || r < 0) throw new Error('Reorder level cannot be negative');
      prod.reorderLevel = r;
    }

    prod.updatedAt = new Date().toISOString();
    this.persist();
    return this.enrichProduct(prod);
  }

  public deleteProduct(id: string): boolean {
    const index = this.data.products.findIndex((p) => p._id === id);
    if (index === -1) return false;

    this.data.products.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Stock Management & Transactions ---
  public recordStockIn(params: {
    productId: string;
    quantity: number;
    reason: 'Purchase' | 'Return';
    performedBy: string;
    performedByName: string;
    notes?: string;
  }): { product: Product; transaction: StockTransaction } {
    const qty = Number(params.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Stock-in quantity must be a positive number greater than 0');
    }

    const prod = this.data.products.find((p) => p._id === params.productId);
    if (!prod) {
      throw new Error('Product not found');
    }

    if (params.reason !== 'Purchase' && params.reason !== 'Return') {
      throw new Error('Stock-in reason must be either Purchase or Return');
    }

    // Business rule: automatically increase quantity
    prod.quantity += qty;
    prod.updatedAt = new Date().toISOString();

    const transaction: StockTransaction = {
      _id: generateId(),
      productId: prod._id,
      productName: prod.productName,
      productCode: prod.productCode,
      transactionType: 'Stock-In',
      quantity: qty,
      reason: params.reason,
      performedBy: params.performedBy,
      performedByName: params.performedByName,
      transactionDate: new Date().toISOString(),
      notes: params.notes?.trim() || '',
      unitPrice: prod.unitPrice,
      totalValue: Math.round(prod.unitPrice * qty * 100) / 100,
    };

    this.data.stockTransactions.unshift(transaction);
    this.persist();

    return {
      product: this.enrichProduct(prod),
      transaction,
    };
  }

  public recordStockOut(params: {
    productId: string;
    quantity: number;
    reason: 'Sale' | 'Issue';
    performedBy: string;
    performedByName: string;
    notes?: string;
  }): { product: Product; transaction: StockTransaction } {
    const qty = Number(params.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Stock-out quantity must be a positive number greater than 0');
    }

    const prod = this.data.products.find((p) => p._id === params.productId);
    if (!prod) {
      throw new Error('Product not found');
    }

    if (params.reason !== 'Sale' && params.reason !== 'Issue') {
      throw new Error('Stock-out reason must be either Sale or Issue');
    }

    // Business rule: prevent issuing more stock than is available!
    if (qty > prod.quantity) {
      throw new Error(
        `Insufficient stock! Requested ${qty} units, but only ${prod.quantity} units are currently available.`
      );
    }

    // Automatically decrease available quantity
    prod.quantity -= qty;
    prod.updatedAt = new Date().toISOString();

    const transaction: StockTransaction = {
      _id: generateId(),
      productId: prod._id,
      productName: prod.productName,
      productCode: prod.productCode,
      transactionType: 'Stock-Out',
      quantity: qty,
      reason: params.reason,
      performedBy: params.performedBy,
      performedByName: params.performedByName,
      transactionDate: new Date().toISOString(),
      notes: params.notes?.trim() || '',
      unitPrice: prod.unitPrice,
      totalValue: Math.round(prod.unitPrice * qty * 100) / 100,
    };

    this.data.stockTransactions.unshift(transaction);
    this.persist();

    return {
      product: this.enrichProduct(prod),
      transaction,
    };
  }

  public getTransactions(limit = 100): StockTransaction[] {
    return [...this.data.stockTransactions].slice(0, limit);
  }

  public getLowStockProducts(): Product[] {
    return this.data.products
      .filter((p) => p.quantity <= p.reorderLevel)
      .map((p) => this.enrichProduct(p));
  }

  // --- Purchase Orders ---
  public getPurchaseOrders(): PurchaseOrder[] {
    return [...this.data.purchaseOrders].sort(
      (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  }

  public getPurchaseOrderById(id: string): PurchaseOrder | undefined {
    return this.data.purchaseOrders.find((p) => p._id === id);
  }

  public createPurchaseOrder(params: {
    supplierId: string;
    products: { productId: string; quantity: number; unitPrice?: number }[];
    createdBy: string;
    createdByName: string;
    notes?: string;
  }): PurchaseOrder {
    const supplier = this.data.suppliers.find((s) => s._id === params.supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    if (!params.products || params.products.length === 0) {
      throw new Error('Purchase order must contain at least one item');
    }

    let totalAmount = 0;
    const poItems = params.products.map((item) => {
      const prod = this.data.products.find((p) => p._id === item.productId);
      if (!prod) {
        throw new Error(`Product ID ${item.productId} not found`);
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new Error(`Invalid quantity for product ${prod.productName}`);
      }
      const price = item.unitPrice !== undefined ? Number(item.unitPrice) : prod.unitPrice;
      const subtotal = Math.round(qty * price * 100) / 100;
      totalAmount += subtotal;

      return {
        productId: prod._id,
        productName: prod.productName,
        productCode: prod.productCode,
        quantity: qty,
        unitPrice: price,
        subtotal,
      };
    });

    const poNumber = `PO-${new Date().getFullYear()}-${String(
      this.data.purchaseOrders.length + 1
    ).padStart(3, '0')}`;

    const newPO: PurchaseOrder = {
      _id: generateId(),
      poNumber,
      supplierId: supplier._id,
      supplierName: supplier.supplierName,
      products: poItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      orderDate: new Date().toISOString(),
      status: 'Pending',
      createdBy: params.createdBy,
      createdByName: params.createdByName,
      notes: params.notes?.trim() || '',
    };

    this.data.purchaseOrders.unshift(newPO);
    this.persist();
    return newPO;
  }

  public updatePurchaseOrderStatus(
    id: string,
    status: 'Pending' | 'Ordered' | 'Received' | 'Cancelled',
    user: { id: string; name: string }
  ): PurchaseOrder {
    const po = this.data.purchaseOrders.find((p) => p._id === id);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    const previousStatus = po.status;
    po.status = status;

    // If changing to Received, automatically record Stock-In for all products in this order!
    if (status === 'Received' && previousStatus !== 'Received') {
      po.receivedAt = new Date().toISOString();
      for (const item of po.products) {
        const prod = this.data.products.find((p) => p._id === item.productId);
        if (prod) {
          prod.quantity += item.quantity;
          prod.updatedAt = new Date().toISOString();

          // record transaction
          this.data.stockTransactions.unshift({
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
            notes: `Fulfillment of Purchase Order ${po.poNumber}`,
            unitPrice: item.unitPrice,
            totalValue: item.subtotal,
          });
        }
      }
    }

    this.persist();
    return po;
  }

  // --- Reports & Dashboard Analytics ---
  public getDashboardMetrics() {
    const totalProducts = this.data.products.length;
    const totalStockQuantity = this.data.products.reduce((acc, p) => acc + p.quantity, 0);
    const totalInventoryValue = Math.round(
      this.data.products.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0) * 100
    ) / 100;

    const lowStockProducts = this.getLowStockProducts();
    const lowStockCount = lowStockProducts.filter((p) => p.quantity > 0).length;
    const outOfStockCount = lowStockProducts.filter((p) => p.quantity <= 0).length;

    const recentTransactions = this.data.stockTransactions.slice(0, 8);

    const categoryBreakdown = this.data.categories.map((cat) => {
      const catProds = this.data.products.filter((p) => p.categoryId === cat._id);
      const productCount = catProds.length;
      const totalQty = catProds.reduce((a, b) => a + b.quantity, 0);
      const value = Math.round(catProds.reduce((a, b) => a + b.quantity * b.unitPrice, 0) * 100) / 100;
      return {
        categoryName: cat.categoryName,
        productCount,
        totalQty,
        value,
      };
    });

    return {
      totalProducts,
      totalStockQuantity,
      totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      totalSuppliers: this.data.suppliers.length,
      totalPurchaseOrders: this.data.purchaseOrders.length,
      recentTransactions,
      lowStockProducts,
      categoryBreakdown,
    };
  }
}

export const db = new InventoryDatabase();
