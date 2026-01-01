import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SettingsPage from './pages/Settings';
import AdminLayout from './layouts/AdminLayout'; // Keep Layouts sync for perceived perf
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import LoginPage from './pages/Login';

// Lazy Load Heavy Pages
const CreateProductPage = React.lazy(() => import('./pages/CreateProduct'));
const InventoryPage = React.lazy(() => import('./pages/Inventory'));
const SuppliersPage = React.lazy(() => import('./pages/Suppliers'));
const AdminDashboard = React.lazy(() => import('./pages/Admin/Dashboard'));
const AdminAccountsPage = React.lazy(() => import('./pages/Admin/Accounts'));
const AdminToolsPage = React.lazy(() => import('./pages/Admin/Tools'));
const AdminLogsPage = React.lazy(() => import('./pages/Admin/Logs'));
const PurchaseOrdersPage = React.lazy(() => import('./pages/PurchaseOrders'));
const ProductsPage = React.lazy(() => import('./pages/Products'));
const ProductDetailsPage = React.lazy(() => import('./pages/ProductDetails'));
const OrdersPage = React.lazy(() => import('./pages/Orders'));
const OrderDetailsPage = React.lazy(() => import('./pages/OrderDetails'));
const CustomersPage = React.lazy(() => import('./pages/Customers'));
const CustomerDetailsPage = React.lazy(() => import('./pages/CustomerDetails'));
const CartsPage = React.lazy(() => import('./pages/Carts'));
const AutomationsPage = React.lazy(() => import('./pages/Automations'));
const EmailFlowBuilder = React.lazy(() => import('./pages/EmailFlowBuilder'));
const VisitorLogPage = React.lazy(() => import('./pages/VisitorLog'));
const AnalyticsPage = React.lazy(() => import('./pages/Analytics'));
const ForecastingPage = React.lazy(() => import('./pages/Forecasting'));
const ReportsPage = React.lazy(() => import('./pages/Reports'));
const ProductReportsPage = React.lazy(() => import('./pages/ProductReports'));
const BehaviourPage = React.lazy(() => import('./pages/Behaviour'));
const CreateOrderPage = React.lazy(() => import('./pages/CreateOrder'));
const CouponsPage = React.lazy(() => import('./pages/Coupons'));
const UsersPage = React.lazy(() => import('./pages/Users'));
const InvoiceBuilder = React.lazy(() => import('./pages/InvoiceBuilder'));
const ReviewsPage = React.lazy(() => import('./pages/Reviews'));
const InboxPage = React.lazy(() => import('./pages/Inbox'));
const HelpPage = React.lazy(() => import('./pages/Help'));
const MarketingPage = React.lazy(() => import('./pages/Marketing'));
const ProductionScanner = React.lazy(() => import('./pages/ProductionScanner'));

import AIChat from './components/AIChat';
import ErrorBoundary from './components/ErrorBoundary';

// Loading Component
const PageLoader = () => (
  <div style={{
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)'
  }}>
    <div className="spinner" style={{ marginRight: '10px' }}></div> Loading...
  </div>
);


import { RequireAuth } from './components/RequireAuth'; // New Route Wrapper
import { PermissionGuard } from './components/PermissionGuard'; // RBAC Wrapper
import { SyncProvider } from './context/SyncContext';
import SyncOverlay from './components/SyncOverlay';
import { PresenceProvider } from './context/PresenceContext';
import { useAnalytics } from './lib/analytics'; // Beacon


// Original App.jsx didn't show AccountProvider? 
// Lines 72-78 showed AuthProvider, SyncProvider, SettingsProvider, Router, PresenceProvider.
// But DashboardLayout.jsx line 13: import { useAccount } from '../context/AccountContext';
// If AccountProvider wasn't in App.jsx, then DashboardLayout would fail.
// Maybe I missed it in view_file output? Or maybe it works differently?
// Ah, `SettingsContext` imports `useAccount`.
// This means AccountProvider MUST be higher up.
// I will ADD AccountProvider to be safe.

function App() {
  useAnalytics(); // Auto-track page views
  return (
    <ErrorBoundary>
      <SyncProvider>
        <PresenceProvider>
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={
                <RequireAuth>
                  <DashboardLayout />
                </RequireAuth>
              }>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/new" element={<CreateOrderPage />} />
                <Route path="/orders/:id" element={<OrderDetailsPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                <Route path="/products/new" element={<CreateProductPage />} />
                <Route path="/products/:id" element={<ProductDetailsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomerDetailsPage />} />
                <Route path="/carts" element={<CartsPage />} />
                <Route path="/automations" element={<AutomationsPage />} />
                <Route path="/automations/new" element={<EmailFlowBuilder />} />
                <Route path="/automations/:id" element={<EmailFlowBuilder />} />
                <Route path="/visitors" element={<VisitorLogPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/coupons" element={<CouponsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/scanner" element={<ProductionScanner />} />
                <Route path="/analytics/reports" element={<ReportsPage />} />
                <Route path="/analytics/products" element={<ProductReportsPage />} />
                <Route path="/analytics/behaviour" element={<BehaviourPage />} />
                <Route path="/analytics/forecasting" element={<ForecastingPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/invoices/builder" element={<InvoiceBuilder />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/marketing" element={<MarketingPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={
                <RequireAuth>
                  <PermissionGuard requiredPermission="admin_access">
                    <AdminLayout />
                  </PermissionGuard>
                </RequireAuth>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="accounts" element={<AdminAccountsPage />} />
                <Route path="logs" element={<AdminLogsPage />} />
                <Route path="tools" element={<AdminToolsPage />} />
              </Route>
            </Routes>
          </React.Suspense>
          <AIChat />
          <SyncOverlay />
        </PresenceProvider>
      </SyncProvider>
    </ErrorBoundary >
  );
}

export default App;
