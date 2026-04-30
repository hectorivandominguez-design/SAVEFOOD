import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../app/router/Provider/useAuth';
import { useCart } from '../app/router/Provider/CartProvider';
import AppFooter from '../components/layout/AppFooter';
import AppHeader from '../components/layout/AppHeader';
import FloatingWhatsAppButton from '../components/layout/FloatingWhatsAppButton';

export default function ClientLayout() {
  const { pathname } = useLocation();
  const { logout, userProfile } = useAuth();
  const { totalItems } = useCart();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  const clientNav = [
    { label: 'Inicio', to: '/client' },
    { label: 'Catálogo', to: '/client/catalog' },
    { label: `Carrito (${totalItems})`, to: '/client/cart' },
    { label: 'Mis pedidos', to: '/client/orders' },
    { label: 'Notificaciones', to: '/client/notifications' },
    { label: 'Mi perfil', to: '/client/profile' },
  ];

  return (
    <div className="sf-shellPage">
      <AppHeader
        navItems={clientNav}
        userLabel={userProfile?.firstName ? `Hola, ${userProfile.firstName}` : 'Cliente'}
        onLogout={logout}
      />

      <section className="sf-shellIntro">
        <div className="sf-shellIntroInner">
          <p>
            Gestiona tu experiencia de compra desde un solo lugar: explora ofertas,
            revisa tus pedidos y mantén tu perfil actualizado.
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
