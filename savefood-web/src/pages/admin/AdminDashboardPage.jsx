import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/router/Provider/useAuth';
import { getAnalyticsSummary } from '../../services/analytics/analyticsService';

export default function AdminDashboardPage() {
  const { userProfile } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        const result = await getAnalyticsSummary();
        setSummary(result.summary);
      } catch (error) {
        setSummary(null);
      }
    }

    loadSummary();
  }, []);

  return (
    <div style={styles.wrapper}>
      <section style={styles.hero}>
        <div>
          <h1 style={styles.title}>Panel administrativo</h1>
          <p style={styles.subtitle}>
            Sesión iniciada como {userProfile?.firstName || 'Administrador'}.
            Desde este panel podrás gestionar el catálogo total, los productos
            próximos a vencer, los pedidos, las notificaciones y los reportes del sistema.
          </p>
        </div>
      </section>

      <section style={styles.kpiGrid}>
        <MiniKpi
          label="Pedidos totales"
          value={summary?.totalPedidos ?? '—'}
          tone="neutral"
        />
        <MiniKpi
          label="Ventas registradas"
          value={
            summary
              ? `$${Number(summary.totalVentas || 0).toLocaleString('es-CO')}`
              : '—'
          }
          tone="danger"
        />
        <MiniKpi
          label="Pedidos entregados"
          value={summary?.pedidosEntregados ?? '—'}
          tone="success"
        />
        <MiniKpi
          label="Ahorro estimado"
          value={
            summary
              ? `$${Number(summary.ahorroEstimado || 0).toLocaleString('es-CO')}`
              : '—'
          }
          tone="warning"
        />
      </section>

      <section style={styles.grid}>
        <article style={styles.card}>
          <h3>Catálogo total</h3>
          <p>Administra el catálogo base del restaurante.</p>
          <Link to="/admin/catalog-total" style={styles.linkBtn}>
            Gestionar
          </Link>
        </article>

        <article style={styles.card}>
          <h3>Próximos a vencer</h3>
          <p>Publica y actualiza productos visibles para clientes.</p>
          <Link to="/admin/expiring" style={styles.linkBtn}>
            Gestionar
          </Link>
        </article>

        <article style={styles.card}>
          <h3>Pedidos</h3>
          <p>Consulta y actualiza el estado de los pedidos.</p>
          <Link to="/admin/orders" style={styles.linkBtn}>
            Ver pedidos
          </Link>
        </article>

        <article style={styles.card}>
          <h3>Reportes</h3>
          <p>Visualiza métricas e indicadores del sistema.</p>
          <Link to="/admin/analytics" style={styles.linkBtn}>
            Ver reportes
          </Link>
        </article>

        <article style={styles.card}>
          <h3>Notificaciones</h3>
          <p>Consulta compras, cancelaciones y eventos relevantes.</p>
          <Link to="/admin/notifications" style={styles.linkBtn}>
            Ver notificaciones
          </Link>
        </article>

        <article style={styles.card}>
          <h3>Mi perfil</h3>
          <p>Consulta los datos de tu cuenta administrativa.</p>
          <Link to="/admin/profile" style={styles.linkBtn}>
            Ver perfil
          </Link>
        </article>

        <article style={styles.card}>
          <h3>Publicar producto</h3>
          <p>Selecciona un producto del catálogo base para ponerlo en rescate comercial.</p>
          <Link to="/admin/expiring/select" style={styles.linkBtn}>
            Publicar ahora
          </Link>
        </article>
      </section>
    </div>
  );
}

function MiniKpi({ label, value, tone }) {
  return (
    <article
      style={{
        ...styles.kpiCard,
        ...(tone === 'danger' ? styles.kpiDanger : {}),
        ...(tone === 'success' ? styles.kpiSuccess : {}),
        ...(tone === 'warning' ? styles.kpiWarning : {}),
      }}
    >
      <span style={styles.kpiLabel}>{label}</span>
      <strong style={styles.kpiValue}>{value}</strong>
    </article>
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
    maxWidth: '760px',
    lineHeight: '1.7',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
  },
  kpiCard: {
    background: '#fff',
    borderRadius: '18px',
    padding: '1.1rem 1.2rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    display: 'grid',
    gap: '0.35rem',
    border: '1px solid #eef2f7',
  },
  kpiDanger: {
    borderColor: 'rgba(198, 40, 40, 0.14)',
  },
  kpiSuccess: {
    borderColor: 'rgba(21, 128, 61, 0.16)',
  },
  kpiWarning: {
    borderColor: 'rgba(180, 83, 9, 0.16)',
  },
  kpiLabel: {
    color: '#6b7280',
    fontSize: '0.92rem',
  },
  kpiValue: {
    color: '#111827',
    fontSize: '1.3rem',
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
