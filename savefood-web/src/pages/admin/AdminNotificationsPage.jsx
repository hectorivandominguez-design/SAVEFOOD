import { useEffect, useState } from 'react';
import { useAuth } from '../../app/router/Provider/useAuth';
import {
  getNotificationsByUser,
  markNotificationAsRead,
} from '../../services/notifications/notificationService';

function formatNotificationDate(value) {
  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : value
        ? new Date(value)
        : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Hace un momento';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getNotificationTypeLabel(type) {
  if (type === 'PAGO') return 'Pago';
  if (type === 'PEDIDO') return 'Pedido';
  if (type === 'CANCELACION') return 'Cancelación';
  return type || 'Sistema';
}

function getNotificationTone(type) {
  if (type === 'PAGO') {
    return {
      badgeBackground: 'rgba(29, 78, 216, 0.1)',
      badgeColor: '#1d4ed8',
      borderColor: 'rgba(29, 78, 216, 0.16)',
      accent: '#1d4ed8',
    };
  }

  if (type === 'CANCELACION') {
    return {
      badgeBackground: 'rgba(198, 40, 40, 0.1)',
      badgeColor: '#c62828',
      borderColor: 'rgba(198, 40, 40, 0.16)',
      accent: '#c62828',
    };
  }

  return {
    badgeBackground: 'rgba(180, 83, 9, 0.1)',
    badgeColor: '#b45309',
    borderColor: 'rgba(180, 83, 9, 0.16)',
    accent: '#b45309',
  };
}

export default function AdminNotificationsPage() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadNotifications() {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getNotificationsByUser(currentUser.uid);
      setNotifications(data);
    } catch (err) {
      setError('No fue posible cargar las notificaciones administrativas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  async function handleMarkAsRead(notificationId) {
    await markNotificationAsRead(notificationId);
    await loadNotifications();
  }

  return (
    <div style={styles.wrapper}>
      <div>
        <h1>Notificaciones del administrador</h1>
        <p style={styles.subtitle}>
          Consulta compras, cancelaciones y eventos relevantes del sistema.
        </p>
      </div>

      {loading ? (
        <div style={styles.loadingCard}>Cargando actividad administrativa...</div>
      ) : error ? (
        <div style={styles.errorCard}>
          <p style={styles.error}>{error}</p>
          <button style={styles.retryButton} onClick={loadNotifications}>
            Reintentar
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div style={styles.empty}>
          No tienes notificaciones administrativas por ahora.
        </div>
      ) : (
        <div style={styles.list}>
          {notifications.map((item) => {
            const tone = getNotificationTone(item.tipoNotificacion);

            return (
              <article
                key={item.id}
                style={{
                  ...styles.card,
                  borderColor: item.leida ? '#eef2f7' : tone.borderColor,
                  boxShadow: item.leida
                    ? '0 10px 30px rgba(0,0,0,0.06)'
                    : `0 10px 30px ${tone.borderColor}`,
                }}
              >
                <div style={styles.content}>
                  <div style={styles.cardTop}>
                    <span
                      style={{
                        ...styles.badge,
                        background: tone.badgeBackground,
                        color: tone.badgeColor,
                      }}
                    >
                      {getNotificationTypeLabel(item.tipoNotificacion)}
                    </span>
                    <span style={styles.dateLabel}>
                      {formatNotificationDate(item.fechaNotificacion)}
                    </span>
                  </div>

                  <h3 style={styles.title}>{item.titulo}</h3>
                  <p style={styles.message}>{item.mensaje}</p>
                  {!item.leida && (
                    <p style={{ ...styles.unreadLabel, color: tone.accent }}>
                      Pendiente de revisión
                    </p>
                  )}
                </div>

                {!item.leida && (
                  <button
                    style={styles.button}
                    onClick={() => handleMarkAsRead(item.id)}
                  >
                    Marcar como leída
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { display: 'grid', gap: '1rem' },
  subtitle: { marginTop: '0.35rem', color: '#6b7280' },
  list: { display: 'grid', gap: '1rem' },
  loadingCard: {
    background: '#fff',
    borderRadius: '18px',
    padding: '1.25rem',
    color: '#6b7280',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: '1.25rem',
    border: '1px solid #eef2f7',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  content: { display: 'grid', gap: '0.55rem', minWidth: 0, flex: '1 1 360px' },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.35rem 0.7rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: '700',
  },
  dateLabel: { color: '#6b7280', fontSize: '0.9rem' },
  title: { margin: 0, color: '#111827' },
  message: { marginTop: '0.4rem', color: '#374151', lineHeight: '1.65' },
  unreadLabel: { margin: 0, fontWeight: '600' },
  button: {
    background: '#111',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    height: 'fit-content',
  },
  empty: { background: '#fff', padding: '2rem', borderRadius: '16px' },
  errorCard: {
    background: '#fff',
    padding: '1.25rem',
    borderRadius: '16px',
    display: 'grid',
    gap: '0.9rem',
    justifyItems: 'start',
  },
  error: { color: '#c62828', margin: 0 },
  retryButton: {
    background: '#111827',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
  },
};
