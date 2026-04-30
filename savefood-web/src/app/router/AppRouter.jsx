import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../components/routes/ProtectedRoute';
import RoleRoute from '../../components/routes/RoleRoute';
import PublicLayout from '../../layouts/PublicLayout';
import ClientLayout from '../../layouts/ClientLayout';
import AdminLayout from '../../layouts/AdminLayout';

import HomePage from '../../pages/public/HomePage';
import LoginPage from '../../pages/public/LoginPage';
import RegisterPage from '../../pages/public/RegisterPage';
import ForgotPasswordPage from '../../pages/public/ForgotPasswordPage';
import UnauthorizedPage from '../../pages/public/UnauthorizedPage';
import NotFoundPage from '../../pages/public/NotFoundPage';

import ClientDashboardPage from '../../pages/client/ClientDashboardPage';
import ClientCatalogPage from '../../pages/client/ClientCatalogPage';
import ProductDetailPage from '../../pages/client/ProductDetailPage';
import CartPage from '../../pages/client/CartPage';
import CheckoutPage from '../../pages/client/CheckoutPage';
import PaymentPage from '../../pages/client/PaymentPage';
import PaymentSuccessPage from '../../pages/client/PaymentSuccessPage';
import ClientOrdersPage from '../../pages/client/ClientOrdersPage';
import OrderDetailPage from '../../pages/client/OrderDetailPage';
import ClientNotificationsPage from '../../pages/client/ClientNotificationsPage';
import ContactStorePage from '../../pages/client/ContactStorePage';
import FeedbackPage from '../../pages/client/FeedbackPage';

import AdminDashboardPage from '../../pages/admin/AdminDashboardPage';
import AdminOrdersPage from '../../pages/admin/AdminOrdersPage';
import AdminNotificationsPage from '../../pages/admin/AdminNotificationsPage';
import AdminAnalyticsPage from '../../pages/admin/AdminAnalyticsPage';
import ProfilePage from '../../pages/shared/ProfilePage';

import CatalogTotalPage from '../../pages/admin/CatalogTotalPage';
import CreateCatalogProductPage from '../../pages/admin/CreateCatalogProductPage';
import EditCatalogProductPage from '../../pages/admin/EditCatalogProductPage';

import SelectExpiringProductsPage from '../../pages/admin/SelectExpiringProductsPage';
import CreateExpiringProductPage from '../../pages/admin/CreateExpiringProductPage';
import ExpiringProductsPage from '../../pages/admin/ExpiringProductsPage';
import EditExpiringProductPage from '../../pages/admin/EditExpiringProductPage';

export default function AppRouter() {
  return (
    <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<ClientCatalogPage />} />
          <Route path="/catalog/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['CLIENTE']} />}>
            <Route element={<ClientLayout />}>
              <Route path="/client" element={<ClientDashboardPage />} />
              <Route path="/client/catalog" element={<ClientCatalogPage />} />
              <Route path="/client/catalog/:id" element={<ProductDetailPage />} />
              <Route path="/client/cart" element={<CartPage />} />
              <Route path="/client/checkout" element={<CheckoutPage />} />
              <Route path="/client/payment/:orderId" element={<PaymentPage />} />
              <Route path="/client/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/client/orders" element={<ClientOrdersPage />} />
              <Route path="/client/orders/:id" element={<OrderDetailPage />} />
              <Route path="/client/orders/:id/contact" element={<ContactStorePage />} />
              <Route path="/client/orders/:id/feedback" element={<FeedbackPage />} />
              <Route path="/client/notifications" element={<ClientNotificationsPage />} />
              <Route path="/client/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/catalog-total" element={<CatalogTotalPage />} />
              <Route path="/admin/catalog-total/new" element={<CreateCatalogProductPage />} />
              <Route path="/admin/catalog-total/edit/:id" element={<EditCatalogProductPage />} />
              <Route path="/admin/expiring" element={<ExpiringProductsPage />} />
              <Route path="/admin/expiring/select" element={<SelectExpiringProductsPage />} />
              <Route path="/admin/expiring/new/:productId" element={<CreateExpiringProductPage />} />
              <Route path="/admin/expiring/edit/:id" element={<EditExpiringProductPage />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
              <Route path="/admin/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
  );
}
