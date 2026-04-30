import { Link } from 'react-router-dom';

export default function AppFooter() {
  return (
    <footer className="sf-siteFooter">
      <div className="sf-siteFooterInner">
        <div className="sf-siteFooterBrand">
          <h3>SAVE FOOD</h3>
          <p>
            Plataforma orientada a la venta de productos próximos a vencer con
            descuentos claros, compra simple y retiro en tienda.
          </p>
        </div>

        <div className="sf-siteFooterColumn">
          <h4>Explorar</h4>
          <Link to="/">Inicio</Link>
          <Link to="/catalog">Ofertas</Link>
          <Link to="/register">Crear cuenta</Link>
        </div>

        <div className="sf-siteFooterColumn">
          <h4>Acceso</h4>
          <Link to="/login">Ingresar</Link>
          <Link to="/forgot-password">Recuperar contraseña</Link>
          <a href="/#como-funciona">Cómo funciona</a>
        </div>

        <div className="sf-siteFooterColumn">
          <h4>Información</h4>
          <span>Salchipapería D.C.</span>
          <span>Sede Bosa · Bogotá</span>
          <span>Proyecto SAVE FOOD 2026</span>
        </div>
      </div>

      <div className="sf-siteFooterBottom">
        <span>© 2026 SAVE FOOD. Todos los derechos reservados.</span>
        <span>Compra con descuento, reduce desperdicio y recoge en tienda.</span>
      </div>
    </footer>
  );
}
