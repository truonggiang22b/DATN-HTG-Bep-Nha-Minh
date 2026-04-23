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

// React Query client — cấu hình mặc định
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,   // 30s: không refetch nếu data còn "tươi"
      refetchOnWindowFocus: false, // Không refetch khi focus lại tab
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
          {/* ── Customer routes (no auth) ─────────────────────────────── */}
          <Route path="/qr/:qrToken" element={<MenuPageWrapper />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/order/:orderId/tracking" element={<TrackingPage />} />

          {/* ── Auth ─────────────────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── KDS (Kitchen & Admin) ─────────────────────────────────── */}
          <Route
            path="/kds"
            element={
              <ProtectedRoute roles={['KITCHEN', 'ADMIN']}>
                <KDSPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin (Admin only) ────────────────────────────────────── */}
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
          </Route>

          {/* ── Catch-all ─────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/qr/qr-bnm-table-01" replace />} />
          <Route path="*" element={<Navigate to="/qr/qr-bnm-table-01" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
