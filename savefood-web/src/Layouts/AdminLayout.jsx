import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../app/router/Provider/useAuth';
import AppFooter from '../components/layout/AppFooter';
import AppHeader from '../components/layout/AppHeader';
import FloatingWhatsAppButton from '../components/layout/FloatingWhatsAppButton';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { logout, userProfile } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  const adminNav = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Catálogo total', to: '/admin/catalog-total' },
    { label: 'Próximos a vencer', to: '/admin/expiring' },
    { label: 'Pedidos', to: '/admin/orders' },
    { label: 'Notificaciones', to: '/admin/notifications' },
    { label: 'Mi perfil', to: '/admin/profile' },
  ];

  return (
    <div className="sf-shellPage">
      <AppHeader
        navItems={adminNav}
        userLabel={userProfile?.firstName ? `Admin · ${userProfile.firstName}` : 'Administrador'}
        onLogout={logout}
      />

      <section className="sf-shellIntro">
        <div className="sf-shellIntroInner">
          <p>
            Administra el catálogo, las publicaciones, los pedidos y la operación
            general de SAVE FOOD desde un entorno consistente y ordenado.
          </p>
        </div>
      </section>

      <main className="sf-shellMain">
        <div className="sf-shellMainInner">
          <Outlet />
        </div>
      </main>

      <FloatingWhatsAppButton />
      <AppFooter />
    </div>
  );
}
