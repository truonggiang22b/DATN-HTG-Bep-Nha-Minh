import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { TrackingPage } from './pages/TrackingPage';
import { KDSPage } from './pages/KDSPage';
import { AdminLayout } from './pages/AdminLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminMenuPage } from './pages/AdminMenuPage';
import { AdminTablesPage } from './pages/AdminTablesPage';
import { AdminStaffPage } from './pages/AdminStaffPage';
// Phase 2: Online Ordering
import { OnlineLandingPage } from './pages/OnlineLandingPage';
import { OnlineOrderPage } from './pages/OnlineOrderPage';
import { OnlineTrackingPage } from './pages/OnlineTrackingPage';
// Phase 2: Admin
import { AdminDeliveryPage } from './pages/AdminDeliveryPage';
import { AdminBranchSettingsPage } from './pages/AdminBranchSettingsPage';
// Landing V2 — Redesign variants
import { LandingPageV2 } from './pages/LandingPageV2';
import { LandingPageV2_Student } from './pages/LandingPageV2_Student';
import { LandingPageV2_Hola } from './pages/LandingPageV2_Hola';

// React Query client — cấu hình mặc định
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,   // 30s
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Wrapper để extract qrToken từ URL (route: /qr/:qrToken)
const MenuPageWrapper = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  return <MenuPage qrToken={qrToken ?? ''} />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── Phase 1: QR Dine-in (unchanged) ──────────────────────── */}
          <Route path="/qr/:qrToken" element={<MenuPageWrapper />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/order/:orderId/tracking" element={<TrackingPage />} />

          {/* ── Phase 2: Online Ordering (new) ───────────────────────── */}
          <Route path="/order-online" element={<OnlineLandingPage />} />
          <Route path="/order-online/menu" element={<OnlineOrderPage />} />
          <Route path="/online-tracking/:orderId" element={<OnlineTrackingPage />} />
          {/* Landing V2 — Story-First redesign (preview) */}
          <Route path="/landing-v2" element={<LandingPageV2 />} />
          <Route path="/landing-v2-student" element={<LandingPageV2_Student />} />
          <Route path="/landing-v2-hola" element={<LandingPageV2_Hola />} />

          {/* ── Auth ──────────────────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── KDS ───────────────────────────────────────────────────── */}
          <Route
            path="/kds"
            element={
              <ProtectedRoute roles={['KITCHEN', 'MANAGER', 'ADMIN']}>
                <KDSPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin ─────────────────────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="menu" element={<AdminMenuPage />} />
            <Route path="tables" element={<AdminTablesPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="delivery" element={<AdminDeliveryPage />} />
            <Route path="branch-settings" element={<AdminBranchSettingsPage />} />
          </Route>

          {/* ── Catch-all: redirect / → landing page ──────────────────── */}
          <Route path="/" element={<Navigate to="/order-online" replace />} />
          <Route path="*" element={<Navigate to="/order-online" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
