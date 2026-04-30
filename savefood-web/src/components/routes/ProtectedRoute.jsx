import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../app/router/Provider/useAuth';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.rol)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}