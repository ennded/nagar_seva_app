import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import type { Role } from '../graphql/types';

export function ProtectedRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const { citySlug } = useParams<{ citySlug: string }>();
  const { session, isAuthenticated } = useAuth();

  if (!isAuthenticated || !session) {
    return <Navigate to={`/${citySlug}/login`} replace />;
  }
  if (!allowedRoles.includes(session.user.role)) {
    return <Navigate to={`/${session.citySlug}`} replace />;
  }
  return <Outlet />;
}
