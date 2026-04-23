/**
 * ProtectedRoute.tsx
 * Bảo vệ routes dành cho staff (KDS, Admin).
 * Nếu chưa login → redirect /login
 * Nếu sai role → redirect /login với thông báo
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    // Chưa đăng nhập → về trang login, lưu lại URL để redirect sau khi login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && roles.length > 0 && !useAuthStore.getState().hasRole(roles)) {
    // Sai role → về login
    return <Navigate to="/login" state={{ from: location.pathname, error: 'insufficient_role' }} replace />;
  }

  return <>{children}</>;
};
