
import React, { useState, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider } from './components/Toaster';
import { AppSecurity } from './components/AppSecurity';
import { FloatingVisitButton } from './components/FloatingVisitButton';
import { AIChatbot } from './components/AIChatbot';
import { LiveSalesAgent } from './components/LiveSalesAgent';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScrollToTop } from './components/ScrollToTop';
import { Footer } from './components/Footer';
import { Button } from './components/Button';
import { TutorialOverlay } from './components/TutorialOverlay';
import { DemoControls } from './components/DemoControls';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { UserRole } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';

// -- LAZY LOADED COMPONENTS --
// Optimizes performance by splitting the code into chunks that are loaded on demand.

// Customer Layout Components
const CustomerNavbar = React.lazy(() => import('./pages/customer/Navbar').then(m => ({ default: m.CustomerNavbar })));

// Main Customer Pages
const CustomerHome = React.lazy(() => import('./pages/customer/Home').then(m => ({ default: m.CustomerHome })));
const Shop = React.lazy(() => import('./pages/customer/Shop').then(m => ({ default: m.Shop })));
const ProductDetail = React.lazy(() => import('./pages/customer/ProductDetail').then(m => ({ default: m.ProductDetail })));
const Cart = React.lazy(() => import('./pages/customer/Cart').then(m => ({ default: m.Cart })));
const QuickOrder = React.lazy(() => import('./pages/customer/QuickOrder').then(m => ({ default: m.QuickOrder })));

// Customer Account Pages
const OrderHistory = React.lazy(() => import('./pages/customer/OrderHistory').then(m => ({ default: m.OrderHistory })));
const Ledger = React.lazy(() => import('./pages/customer/Ledger').then(m => ({ default: m.Ledger })));
const Settings = React.lazy(() => import('./pages/customer/Settings').then(m => ({ default: m.Settings })));
const Wishlist = React.lazy(() => import('./pages/customer/Wishlist').then(m => ({ default: m.Wishlist })));
const BookVisit = React.lazy(() => import('./pages/customer/BookVisit').then(m => ({ default: m.BookVisit })));
const Support = React.lazy(() => import('./pages/customer/Support').then(m => ({ default: m.Support })));

// AI Features
const Collections = React.lazy(() => import('./pages/customer/Collections').then(m => ({ default: m.Collections }))); // Visual Scout
const MarketingKit = React.lazy(() => import('./pages/customer/MarketingKit').then(m => ({ default: m.MarketingKit })));
const DesignStudio = React.lazy(() => import('./pages/customer/DesignStudio').then(m => ({ default: m.DesignStudio })));
const SmartStocker = React.lazy(() => import('./pages/customer/SmartStocker').then(m => ({ default: m.SmartStocker })));
const VideoFeed = React.lazy(() => import('./pages/customer/VideoFeed').then(m => ({ default: m.VideoFeed })));
const DistributorFinder = React.lazy(() => import('./pages/customer/DistributorFinder').then(m => ({ default: m.DistributorFinder })));

// Public Pages
const About = React.lazy(() => import('./pages/public/About').then(m => ({ default: m.About })));
const Contact = React.lazy(() => import('./pages/public/Contact').then(m => ({ default: m.Contact })));
const EnquireFranchise = React.lazy(() => import('./pages/public/EnquireFranchise').then(m => ({ default: m.EnquireFranchise })));
const NotFound = React.lazy(() => import('./pages/public/NotFound').then(m => ({ default: m.NotFound })));

// Auth
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));

// Admin
const AdminLayout = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminLayout })));
const DashboardHome = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.DashboardHome })));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminSettings })));
const OrderManager = React.lazy(() => import('./pages/admin/OrderManager').then(m => ({ default: m.OrderManager })));
const Finance = React.lazy(() => import('./pages/admin/Finance').then(m => ({ default: m.Finance })));
const ProductEditor = React.lazy(() => import('./pages/admin/ProductEditor').then(m => ({ default: m.ProductEditor })));
const Inventory = React.lazy(() => import('./pages/admin/Inventory').then(m => ({ default: m.Inventory })));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement').then(m => ({ default: m.UserManagement })));
const VisitRequests = React.lazy(() => import('./pages/admin/VisitRequests').then(m => ({ default: m.VisitRequests })));
const Announcements = React.lazy(() => import('./pages/admin/Announcements').then(m => ({ default: m.Announcements })));
const MarketingTools = React.lazy(() => import('./pages/admin/MarketingTools').then(m => ({ default: m.MarketingTools })));
const MarketTrends = React.lazy(() => import('./pages/admin/MarketTrends').then(m => ({ default: m.MarketTrends })));
const Reports = React.lazy(() => import('./pages/admin/Reports').then(m => ({ default: m.Reports })));
const Helpdesk = React.lazy(() => import('./pages/admin/Helpdesk').then(m => ({ default: m.Helpdesk })));
const InvoiceGenerator = React.lazy(() => import('./pages/admin/InvoiceGenerator').then(m => ({ default: m.InvoiceGenerator })));
const CatalogMaker = React.lazy(() => import('./pages/admin/CatalogMaker').then(m => ({ default: m.CatalogMaker })));
const BulkOnboarding = React.lazy(() => import('./pages/admin/BulkOnboarding').then(m => ({ default: m.BulkOnboarding })));
const BulkClientOnboarding = React.lazy(() => import('./pages/admin/BulkClientOnboarding').then(m => ({ default: m.BulkClientOnboarding })));
const SystemDiagnostics = React.lazy(() => import('./pages/admin/SystemDiagnostics').then(m => ({ default: m.SystemDiagnostics })));

// Specialized Dashboards
const AgentDashboard = React.lazy(() => import('./pages/agent/AgentDashboard').then(m => ({ default: m.AgentDashboard })));
const GaddiDashboard = React.lazy(() => import('./pages/logistics/GaddiDashboard').then(m => ({ default: m.GaddiDashboard })));
const DistributorDashboard = React.lazy(() => import('./pages/distributor/DistributorDashboard').then(m => ({ default: m.DistributorDashboard })));

const CustomerLayout = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <TutorialOverlay />
      <Suspense fallback={<div className="h-16 bg-white shadow-sm border-b border-gray-100"></div>}>
        <CustomerNavbar />
      </Suspense>
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <FloatingVisitButton />
      <div className="hidden md:block">
          <AIChatbot />
      </div>
      <LiveSalesAgent />
      <DemoControls />
      <InstallPwaPrompt />
      
      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/919911076258" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 z-[45] bg-[#25D366] text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <div className="absolute right-full mr-3 bg-luxury-black text-white px-3 py-1 rounded text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {t('system.whatsappSupport')}
        </div>
      </a>
    </div>
  );
};

const MaintenanceView = () => {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="text-center max-w-md">
                <div className="text-6xl mb-6 animate-bounce-slow">🛠️</div>
                <h1 className="text-3xl font-bold text-luxury-black mb-2">{t('system.maintenance')}</h1>
                <p className="text-gray-500 mb-8">{t('system.maintenanceSub')}</p>
                <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
        </div>
    );
};

const ProtectedAdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user } = useApp();
  // Include DISPATCH as it is a sub-module of the admin system in this app
  const allowedRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DISPATCH];
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const [isMaintenance, setIsMaintenance] = useState(false); 

  if (isMaintenance) return <LanguageProvider><MaintenanceView /></LanguageProvider>;

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <AppProvider>
            <AppSecurity />
            <HashRouter>
              <Routes>
                {/* Public / Customer Routes */}
                <Route path="/" element={<CustomerLayout />}>
                  <Route index element={<CustomerHome />} />
                  <Route path="shop" element={<Shop />} />
                  <Route path="quick-order" element={<QuickOrder />} />
                  <Route path="product/:id" element={<ProductDetail />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="orders" element={<OrderHistory />} />
                  <Route path="marketing-kit" element={<MarketingKit />} />
                  <Route path="design-studio" element={<DesignStudio />} />
                  <Route path="smart-stocker" element={<SmartStocker />} />
                  <Route path="saloni-tv" element={<VideoFeed />} />
                  <Route path="distributors" element={<DistributorFinder />} />
                  <Route path="ledger" element={<Ledger />} />
                  <Route path="profile" element={<Settings />} />
                  <Route path="book-visit" element={<BookVisit />} />
                  <Route path="wishlist" element={<Wishlist />} />
                  <Route path="collections" element={<Collections />} />
                  <Route path="support" element={<Support />} />
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="franchise-enquiry" element={<EnquireFranchise />} />
                  
                  {/* Auth */}
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  
                  {/* Partner Specific Dashboards */}
                  <Route path="agent/dashboard" element={<AgentDashboard />} />
                  <Route path="logistics/dashboard" element={<GaddiDashboard />} />
                  <Route path="distributor/dashboard" element={<DistributorDashboard />} />
                  
                  {/* Fallback */}
                  <Route path="*" element={<NotFound />} />
                </Route>
                
                <Route path="/admin/login" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Login />
                  </Suspense>
                } />
                
                <Route path="/admin/invoice/:orderId" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <InvoiceGenerator />
                  </Suspense>
                } />

                <Route path="/admin" element={
                  <ProtectedAdminRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminLayout />
                    </Suspense>
                  </ProtectedAdminRoute>
                }>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardHome />} />
                  <Route path="orders" element={<OrderManager />} /> 
                  <Route path="finance" element={<Finance />} />
                  <Route path="products" element={<ProductEditor />} /> 
                  <Route path="bulk-onboarding" element={<BulkOnboarding />} />
                  <Route path="bulk-client-onboarding" element={<BulkClientOnboarding />} />
                  <Route path="catalog-maker" element={<CatalogMaker />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="visits" element={<VisitRequests />} />
                  <Route path="announcements" element={<Announcements />} />
                  <Route path="marketing" element={<MarketingTools />} />
                  <Route path="trends" element={<MarketTrends />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="helpdesk" element={<Helpdesk />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="diagnostics" element={<SystemDiagnostics />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </HashRouter>
          </AppProvider>
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
