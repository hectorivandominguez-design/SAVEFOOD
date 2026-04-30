import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

function NavItem({ item, light, onNavigate }) {
  const className = light ? 'sf-shellNavLink sf-shellNavLink--light' : 'sf-shellNavLink';

  if (item.href) {
    return (
      <a href={item.href} className={className} onClick={onNavigate}>
        {item.label}
      </a>
    );
  }

  return (
    <Link to={item.to} className={className} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

export default function AppHeader({
  navItems = [],
  userLabel = '',
  showAuthButtons = false,
  logoutLabel = 'Cerrar sesión',
  onLogout,
  variant = 'solid',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const transparent = variant === 'transparent';

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header
      className={`sf-shellHeader ${transparent ? 'sf-shellHeader--transparent' : 'sf-shellHeader--solid'}`}
    >
      <div className="sf-shellHeaderInner">
        <Link to="/" className="sf-shellBrand" aria-label="Ir al inicio de SAVE FOOD" onClick={closeMenu}>
          <img src={logo} alt="SAVE FOOD" className="sf-logo" />
        </Link>

        <button
          type="button"
          className={`sf-shellMenuButton ${transparent ? 'sf-shellMenuButton--light' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`sf-shellHeaderPanel ${menuOpen ? 'sf-shellHeaderPanel--open' : ''}`}>
          <nav className="sf-shellNav" aria-label="Navegación principal">
            {navItems.map((item) => (
              <NavItem
                key={`${item.label}-${item.to || item.href}`}
                item={item}
                light={transparent}
                onNavigate={closeMenu}
              />
            ))}
          </nav>

          <div className="sf-shellActions">
            {userLabel ? (
              <span
                className={`sf-shellUserPill ${transparent ? 'sf-shellUserPill--light' : ''}`}
              >
                {userLabel}
              </span>
            ) : null}

            {showAuthButtons ? (
              <>
                <Link
                  className={`sf-navBtn sf-navBtnOutline ${transparent ? 'sf-navBtnOutline--light' : 'sf-navBtnLight'}`}
                  to="/login"
                  onClick={closeMenu}
                >
                  Ingresar
                </Link>
                <Link className="sf-navBtn sf-navBtnSolid" to="/register" onClick={closeMenu}>
                  Crear cuenta
                </Link>
              </>
            ) : (
              <button
                type="button"
                className="sf-navBtn sf-navBtnSolid"
                onClick={() => {
                  closeMenu();
                  onLogout?.();
                }}
              >
                {logoutLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
