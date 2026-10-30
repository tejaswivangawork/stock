import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider, useToast } from './components/Toast.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { LoginView } from './views/LoginView.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { ProductsView } from './views/ProductsView.tsx';
import { StockInView } from './views/StockInView.tsx';
import { StockOutView } from './views/StockOutView.tsx';
import { LowStockAlertsView } from './views/LowStockAlertsView.tsx';
import { SuppliersView } from './views/SuppliersView.tsx';
import { PurchaseOrdersView } from './views/PurchaseOrdersView.tsx';
import { ReportsView } from './views/ReportsView.tsx';
import { UsersView } from './views/UsersView.tsx';

import {
  Product,
  Category,
  Supplier,
  PurchaseOrder,
  DashboardMetrics,
} from './types/index.ts';
import { api } from './services/api.ts';

const MainLayout: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Preselected product for quick action transfers between views
  const [preselectedProduct, setPreselectedProduct] = useState<Product | null>(null);

  const loadAllData = useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      const [prods, cats, sups, pos, metrics, lowStock] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getSuppliers(),
        api.getPurchaseOrders(),
        api.getInventoryReport(),
        api.getLowStockProducts(),
      ]);

      setProducts(prods);
      setCategories(cats);
      setSuppliers(sups);
      setPurchaseOrders(pos);
      setDashboardMetrics(metrics);
      setLowStockProducts(lowStock);
    } catch (err: any) {
      console.error('Error fetching inventory state:', err);
      showToast(err.message || 'Error updating data', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  // Contextual transitions
  const handleOpenStockIn = (product: Product) => {
    setPreselectedProduct(product);
    setCurrentTab('stock-in');
  };

  const handleOpenStockOut = (product: Product) => {
    setPreselectedProduct(product);
    setCurrentTab('stock-out');
  };

  const handleCreatePOWithProduct = (product: Product) => {
    setPreselectedProduct(product);
    setCurrentTab('purchase-orders');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Initializing Stock Maintenance System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const lowStockCount = lowStockProducts.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      <Navbar
        lowStockCount={lowStockCount}
        onNavigateToLowStock={() => setCurrentTab('low-stock')}
        onRefreshData={loadAllData}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setPreselectedProduct(null);
            setCurrentTab(tab);
          }}
          lowStockCount={lowStockCount}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {currentTab === 'dashboard' && (
              <DashboardView
                metrics={dashboardMetrics}
                onNavigate={(tab) => {
                  setPreselectedProduct(null);
                  setCurrentTab(tab);
                }}
                onQuickRestock={handleOpenStockIn}
              />
            )}

            {currentTab === 'products' && (
              <ProductsView
                products={products}
                categories={categories}
                suppliers={suppliers}
                onRefresh={loadAllData}
                onOpenStockIn={handleOpenStockIn}
                onOpenStockOut={handleOpenStockOut}
              />
            )}

            {currentTab === 'stock-in' && (
              <StockInView
                products={products}
                selectedProduct={preselectedProduct}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'stock-out' && (
              <StockOutView
                products={products}
                selectedProduct={preselectedProduct}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'low-stock' && (
              <LowStockAlertsView
                lowStockProducts={lowStockProducts}
                suppliers={suppliers}
                onOpenStockIn={handleOpenStockIn}
                onCreatePOWithProduct={handleCreatePOWithProduct}
              />
            )}

            {currentTab === 'suppliers' && (
              <SuppliersView
                suppliers={suppliers}
                products={products}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'purchase-orders' && (
              <PurchaseOrdersView
                purchaseOrders={purchaseOrders}
                suppliers={suppliers}
                products={products}
                initialPreselectedProduct={preselectedProduct}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                metrics={dashboardMetrics}
                products={products}
              />
            )}

            {currentTab === 'users' && <UsersView />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
}
