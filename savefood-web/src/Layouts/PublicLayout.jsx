import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppFooter from '../components/layout/AppFooter';
import AppHeader from '../components/layout/AppHeader';
import FloatingWhatsAppButton from '../components/layout/FloatingWhatsAppButton';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const isCatalogView = pathname.startsWith('/catalog');
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(pathname);
  const isMarketingView = isHome || isCatalogView;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  const publicNav = [
    { label: 'Inicio', to: '/' },
    { label: 'Ofertas', to: '/catalog' },
    { label: 'Cómo funciona', href: isHome ? '#como-funciona' : '/#como-funciona' },
    { label: 'Impacto', href: isHome ? '#impacto' : '/#impacto' },
    { label: 'Reseñas', href: isHome ? '#resenas' : '/#resenas' },
  ];

  return (
    <div className={isMarketingView ? 'sf-app' : 'sf-page-bg'}>
      <AppHeader
        navItems={publicNav}
        showAuthButtons
        variant={isHome || isAuthPage ? 'transparent' : 'solid'}
      />

      <main
        className={
          isHome
            ? 'sf-layoutMain sf-layoutMain--home'
            : isMarketingView
              ? 'sf-layoutMain sf-layoutMain--wide'
              : 'sf-central-card-wrapper'
        }
      >
        {isMarketingView ? (
          <Outlet />
        ) : (
          <div className={`sf-central-card ${isAuthPage ? 'sf-central-card--auth' : ''}`}>
            <Outlet />
          </div>
        )}
      </main>

      <FloatingWhatsAppButton />
      <AppFooter />
    </div>
  );
}
