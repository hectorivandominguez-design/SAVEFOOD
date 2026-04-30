import { Link } from 'react-router-dom';
import { useAuth } from '../../app/router/Provider/useAuth';

export default function ClientDashboardPage() {
  const { userProfile } = useAuth();

  if (!userProfile?.firstName || !userProfile?.lastName) {
    return (
      <div style={styles.wrapper}>
        <section style={styles.hero}>
          <div>
            <h1 style={styles.title}>Completa tu perfil</h1>
            <p style={styles.subtitle}>
              Para acceder a todas las funcionalidades, necesitas completar tu información personal.
            </p>
            <Link to="/client/profile" style={styles.completeBtn}>
              Completar perfil
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <section style={styles.hero}>
        <div>
          <h1 style={styles.title}>
            Bienvenido{userProfile?.firstName ? `, ${userProfile.firstName}` : ''}
          </h1>
          <p style={styles.subtitle}>
            Desde aquí podrás explorar productos próximos a vencer, revisar tus pedidos
            y gestionar tu perfil.
          </p>
        </div>
      </section>

      <section style={styles.grid}>
        <article style={styles.card}>
          <h3>Catálogo</h3>
          <p>Consulta productos disponibles con descuento.</p>
          <Link to="/client/catalog" style={styles.linkBtn}>
            Ir al catálogo
          </Link>
        </article>

        <article style={styles.card}>
          <h3>Mis pedidos</h3>
          <p>Consulta el estado y detalle de tus compras.</p>
          <Link to="/client/orders" style={styles.linkBtn}>
            Ver pedidos
          </Link>
        </article>

        <article style={styles.card}>
          <h3>Mi perfil</h3>
          <p>Actualiza tus datos personales.</p>
          <Link to="/client/profile" style={styles.linkBtn}>
            Editar perfil
          </Link>
        </article>

        <article style={styles.card}>
          <h3>Notificaciones</h3>
          <p>Revisa cambios importantes relacionados con tus pedidos.</p>
          <Link to="/client/notifications" style={styles.linkBtn}>
            Ver novedades
          </Link>
        </article>
      </section>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'grid',
    gap: '1.5rem',
  },
  hero: {
    background: '#fff',
    borderRadius: '18px',
    padding: 'clamp(1.25rem, 3vw, 2rem)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  },
  title: {
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#6b7280',
    maxWidth: '700px',
    lineHeight: '1.7',
  },
  completeBtn: {
    display: 'inline-block',
    marginTop: '1rem',
    background: '#c62828',
    color: '#fff',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: 'clamp(1.1rem, 2.5vw, 1.5rem)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  },
  linkBtn: {
    display: 'inline-block',
    marginTop: '1rem',
    background: '#111',
    color: '#fff',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
  },
};
