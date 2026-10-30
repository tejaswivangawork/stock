import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { db } from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'stock-maintenance-secret-2026-key';
const PORT = 3000;

interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: 'Admin' | 'Staff';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

// Middleware to authenticate JWT
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication required. No token provided.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded) {
      res.status(403).json({ message: 'Invalid or expired authentication session.' });
      return;
    }
    req.user = decoded as AuthTokenPayload;
    next();
  });
}

// Middleware to enforce Admin role
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403).json({
      message: 'Access Denied: Administrative privileges are required for this action.',
    });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // -------------------------------------------------------------
  // API Routes: 10. Proposed API Endpoints
  // -------------------------------------------------------------

  // --- FR-01: Authentication ---
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { name, email, password, role = 'Staff' } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ message: 'Name, email, and password are required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ message: 'Password must be at least 6 characters' });
        return;
      }

      const userRole = role === 'Admin' ? 'Admin' : 'Staff';
      const newUser = db.createUser({
        name,
        email,
        password,
        role: userRole,
      });

      const tokenPayload: AuthTokenPayload = {
        userId: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        message: 'Registration successful',
        user: newUser,
        token,
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }

      const user = db.findUserByEmail(email);
      if (!user || !user.password) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const tokenPayload: AuthTokenPayload = {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...safeUser } = user;

      res.json({
        message: 'Login successful',
        user: safeUser,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.json({ message: 'Logged out successfully' });
  });

  app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const user = db.findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const { password, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  // --- Users Management (Admin) ---
  app.get('/api/users', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    res.json(db.getUsers());
  });

  app.post('/api/users', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password || !role) {
        res.status(400).json({ message: 'All fields (name, email, password, role) are required' });
        return;
      }
      const newUser = db.createUser({ name, email, password, role });
      res.status(201).json(newUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete('/api/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (id === req.user?.userId) {
      res.status(400).json({ message: 'Cannot delete your own active administrator account' });
      return;
    }
    const success = db.deleteUser(id);
    if (!success) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted successfully' });
  });

  // --- Categories ---
  app.get('/api/categories', (_req: Request, res: Response) => {
    res.json(db.getCategories());
  });

  app.post('/api/categories', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { categoryName, description } = req.body;
      if (!categoryName) {
        res.status(400).json({ message: 'Category name is required' });
        return;
      }
      const cat = db.createCategory({ categoryName, description });
      res.status(201).json(cat);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // --- FR-03: Products Management ---
  app.get('/api/products', (req: Request, res: Response) => {
    const { search, categoryId, supplierId, stockStatus } = req.query;
    const prods = db.getProducts({
      search: typeof search === 'string' ? search : undefined,
      categoryId: typeof categoryId === 'string' ? categoryId : undefined,
      supplierId: typeof supplierId === 'string' ? supplierId : undefined,
      stockStatus: typeof stockStatus === 'string' ? (stockStatus as any) : undefined,
    });
    res.json(prods);
  });

  app.get('/api/products/:id', (req: Request, res: Response) => {
    const prod = db.getProductById(req.params.id);
    if (!prod) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(prod);
  });

  app.post('/api/products', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { productName, productCode, categoryId, quantity, unitPrice, supplierId, reorderLevel } =
        req.body;

      // Validate required fields
      if (
        !productName ||
        !productCode ||
        !categoryId ||
        quantity === undefined ||
        unitPrice === undefined ||
        !supplierId ||
        reorderLevel === undefined
      ) {
        res.status(400).json({
          message:
            'All product fields (name, code, category, quantity, unit price, supplier, reorder level) are required',
        });
        return;
      }

      const newProd = db.createProduct({
        productName,
        productCode,
        categoryId,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        supplierId,
        reorderLevel: Number(reorderLevel),
      });

      res.status(201).json(newProd);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put('/api/products/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updated = db.updateProduct(id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete('/api/products/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const success = db.deleteProduct(id);
    if (!success) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  });

  // --- FR-04 & FR-05: Stock-In & Stock-Out Management ---
  app.post('/api/stock/in', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { productId, quantity, reason, notes } = req.body;
      if (!productId || !quantity || !reason) {
        res.status(400).json({ message: 'Product ID, quantity, and reason (Purchase/Return) are required' });
        return;
      }

      const result = db.recordStockIn({
        productId,
        quantity: Number(quantity),
        reason,
        performedBy: req.user!.userId,
        performedByName: req.user!.name,
        notes,
      });

      res.status(201).json({
        message: `Successfully added ${quantity} units to ${result.product.productName}`,
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post('/api/stock/out', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { productId, quantity, reason, notes } = req.body;
      if (!productId || !quantity || !reason) {
        res.status(400).json({ message: 'Product ID, quantity, and reason (Sale/Issue) are required' });
        return;
      }

      const result = db.recordStockOut({
        productId,
        quantity: Number(quantity),
        reason,
        performedBy: req.user!.userId,
        performedByName: req.user!.name,
        notes,
      });

      res.status(201).json({
        message: `Successfully deducted ${quantity} units from ${result.product.productName}`,
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get('/api/stock/transactions', (_req: Request, res: Response) => {
    res.json(db.getTransactions(100));
  });

  app.get('/api/stock/low-stock', (_req: Request, res: Response) => {
    res.json(db.getLowStockProducts());
  });

  // --- FR-08: Suppliers Management ---
  app.get('/api/suppliers', (_req: Request, res: Response) => {
    res.json(db.getSuppliers());
  });

  app.post('/api/suppliers', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { supplierName, contactNumber, email, address } = req.body;
      if (!supplierName || !contactNumber || !email || !address) {
        res.status(400).json({ message: 'All supplier details (name, contact number, email, address) are required' });
        return;
      }
      const newSup = db.createSupplier({ supplierName, contactNumber, email, address });
      res.status(201).json(newSup);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put('/api/suppliers/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updated = db.updateSupplier(id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete('/api/suppliers/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const success = db.deleteSupplier(id);
      if (!success) {
        res.status(404).json({ message: 'Supplier not found' });
        return;
      }
      res.json({ message: 'Supplier deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // --- FR-09: Purchase Orders Management ---
  app.get('/api/purchase-orders', (_req: Request, res: Response) => {
    res.json(db.getPurchaseOrders());
  });

  app.post('/api/purchase-orders', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { supplierId, products, notes } = req.body;
      if (!supplierId || !products || !Array.isArray(products) || products.length === 0) {
        res.status(400).json({ message: 'Supplier and at least one product item are required' });
        return;
      }

      const newPO = db.createPurchaseOrder({
        supplierId,
        products,
        createdBy: req.user!.userId,
        createdByName: req.user!.name,
        notes,
      });

      res.status(201).json(newPO);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put('/api/purchase-orders/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['Pending', 'Ordered', 'Received', 'Cancelled'].includes(status)) {
        res.status(400).json({ message: 'Invalid purchase order status' });
        return;
      }

      const updated = db.updatePurchaseOrderStatus(id, status, {
        id: req.user!.userId,
        name: req.user!.name,
      });

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // --- FR-10: Reports & Dashboard Metrics ---
  app.get('/api/reports/inventory', (_req: Request, res: Response) => {
    res.json(db.getDashboardMetrics());
  });

  app.get('/api/reports/stock-movements', (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 200;
    res.json(db.getTransactions(limit));
  });

  // Utility to reset database to initial state (handy for testing)
  app.post('/api/admin/reset-database', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    db.resetToDefaults();
    res.json({ message: 'Database reset to default seed data successfully' });
  });

  // -------------------------------------------------------------
  // Frontend Serving (Vite in Dev / Static in Prod)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Stock Maintenance Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
