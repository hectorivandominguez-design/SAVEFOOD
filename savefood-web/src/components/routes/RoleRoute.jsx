import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../app/router/Provider/useAuth';

export default function RoleRoute({ allowedRoles = [] }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem' }}>Cargando...</div>;
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  return allowedRoles.includes(userProfile.rol) ? (
    <Outlet />
  ) : (
    <Navigate to="/unauthorized" replace />
  );
}