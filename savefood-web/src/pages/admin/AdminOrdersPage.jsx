import { useEffect, useState } from 'react';
import { useAuth } from '../../app/router/Provider/useAuth';
import { updateOrderStatusByAdmin } from '../../services/orders/orderMutationService';
import { getAdminOrders } from '../../services/orders/orderService';
import {
  buildInternationalPhone,
  formatPhoneForDisplay,
  toWhatsAppPhone,
} from '../../services/utils/phoneUtils';

function getStatusLabel(status) {
  if (status === 'PENDIENTE_PAGO') return 'Pendiente de pago';
  if (status === 'PAGADO') return 'Pagado';
  if (status === 'LISTO_PARA_RECOGER') return 'Listo para recoger';
  if (status === 'ENTREGADO') return 'Entregado';
  if (status === 'CANCELADO') return 'Cancelado';
  return status;
}

function getStatusTone(status) {
  if (status === 'ENTREGADO') return { background: '#e8f7ee', color: '#15803d' };
  if (status === 'CANCELADO') return { background: '#fdecec', color: '#c62828' };
  if (status === 'LISTO_PARA_RECOGER') return { background: '#fff6e8', color: '#b45309' };
  if (status === 'PAGADO') return { background: '#eef2ff', color: '#1d4ed8' };
  return { background: '#f4f5f7', color: '#374151' };
}

function canMarkReady(status) {
  return ['PAGADO'].includes(status);
}

function canMarkDelivered(status) {
  return ['PAGADO', 'LISTO_PARA_RECOGER'].includes(status);
}

function canCancel(status) {
  return !['ENTREGADO', 'CANCELADO'].includes(status);
}

function getReadyButtonLabel(status) {
  if (status === 'LISTO_PARA_RECOGER') return 'Ya listo para recoger';
  if (status === 'ENTREGADO') return 'Pedido entregado';
  if (status === 'CANCELADO') return 'Pedido cancelado';
  if (status === 'PENDIENTE_PAGO') return 'Esperando pago';
  return 'Listo para recoger';
}

function getDeliveredButtonLabel(status) {
  if (status === 'ENTREGADO') return 'Ya entregado';
  if (status === 'CANCELADO') return 'Pedido cancelado';
  if (status === 'PENDIENTE_PAGO') return 'Esperando pago';
  return 'Entregado';
}

function getCancelButtonLabel(status) {
  if (status === 'ENTREGADO') return 'No cancelable';
  if (status === 'CANCELADO') return 'Ya cancelado';
  return 'Cancelar pedido';
}

function getStatusHelperText(status) {
  if (status === 'ENTREGADO') {
    return 'Este pedido ya fue entregado y no puede cancelarse ni modificarse.';
  }

  if (status === 'CANCELADO') {
    return 'Este pedido ya fue cancelado y no admite nuevas acciones.';
  }

  if (status === 'PENDIENTE_PAGO') {
    return 'Primero debe confirmarse el pago para avanzar con la preparación o la entrega.';
  }

  if (status === 'LISTO_PARA_RECOGER') {
    return 'El pedido ya está listo. Ahora puedes marcarlo como entregado o cancelarlo si aplica.';
  }

  return 'Puedes actualizar el estado según la etapa actual del pedido.';
}

function formatOrderDateTime(value) {
  if (!value) return 'Sin registro';

  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin registro';
  }

  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function AdminOrdersPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');

  async function loadOrders() {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch {
      setError('No fue posible cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleUpdate(orderId, newStatus) {
    if (!currentUser?.uid) return;

    setProcessingId(orderId);
    setActionError('');
    setMessage('');

    try {
      await updateOrderStatusByAdmin({
        orderId,
        newStatus,
      });

      setMessage(`El pedido ${orderId} fue actualizado a ${getStatusLabel(newStatus).toLowerCase()}.`);
      await loadOrders();
    } catch (err) {
      setActionError(err.message || 'No fue posible actualizar el pedido.');
    } finally {
      setProcessingId('');
    }
  }

  return (
    <div style={styles.wrapper}>
      <div>
        <h1>Gestión de pedidos</h1>
        <p style={styles.subtitle}>
          Visualiza los pedidos, su fecha y hora de creación, el código de recogida y las
          observaciones del cliente para operar mejor cada entrega.
        </p>
      </div>

      {loading && <div style={styles.loadingCard}>Cargando pedidos del sistema...</div>}

      {!loading && error && (
        <div style={styles.errorCard}>
          <p style={styles.error}>{error}</p>
          <button style={styles.retryButton} onClick={loadOrders}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {message && <div style={styles.successCard}>{message}</div>}
          {actionError && <div style={styles.errorCardInline}>{actionError}</div>}

          <div style={styles.list}>
            {orders.length === 0 ? (
              <div style={styles.empty}>No hay pedidos registrados.</div>
            ) : (
              orders.map((order) => {
                const isProcessing = processingId === order.id;
                const readyDisabled = isProcessing || !canMarkReady(order.estadoPedido);
                const deliveredDisabled = isProcessing || !canMarkDelivered(order.estadoPedido);
                const cancelDisabled = isProcessing || !canCancel(order.estadoPedido);
                const readyLabel = isProcessing
                  ? 'Actualizando...'
                  : getReadyButtonLabel(order.estadoPedido);
                const deliveredLabel = isProcessing
                  ? 'Actualizando...'
                  : getDeliveredButtonLabel(order.estadoPedido);
                const cancelLabel = isProcessing
                  ? 'Actualizando...'
                  : getCancelButtonLabel(order.estadoPedido);
                const helperText = getStatusHelperText(order.estadoPedido);
                const displayPhone = formatPhoneForDisplay(
                  order.clientPhone,
                  order.clientCountryCode || '+57'
                );
                const telPhone = buildInternationalPhone(
                  order.clientCountryCode || '+57',
                  order.clientPhone
                );
                const whatsappPhone = toWhatsAppPhone(
                  order.clientPhone,
                  order.clientCountryCode || '+57'
                );
                const whatsappLink = whatsappPhone ? `https://wa.me/${whatsappPhone}` : '';

                return (
                  <article key={order.id} style={styles.card}>
                    <div style={styles.info}>
                      <div style={styles.cardTop}>
                        <h3 style={styles.title}>{order.orderId}</h3>
                        <span style={{ ...styles.statusBadge, ...getStatusTone(order.estadoPedido) }}>
                          {getStatusLabel(order.estadoPedido)}
                        </span>
                      </div>

                      <div style={styles.operationGrid}>
                        <div style={styles.operationBox}>
                          <span style={styles.operationLabel}>Código de recogida</span>
                          <strong style={styles.operationValue}>{order.codigoRecogida || 'Pendiente'}</strong>
                        </div>
                        <div style={styles.operationBox}>
                          <span style={styles.operationLabel}>Sede</span>
                          <strong style={styles.operationValue}>{order.sede || 'Bosa'}</strong>
                        </div>
                        <div style={styles.operationBox}>
                          <span style={styles.operationLabel}>Total</span>
                          <strong style={styles.operationValue}>
                            ${Number(order.totalPedido || 0).toLocaleString('es-CO')}
                          </strong>
                        </div>
                        <div style={styles.operationBox}>
                          <span style={styles.operationLabel}>Fecha y hora del pedido</span>
                          <strong style={styles.operationValue}>{formatOrderDateTime(order.fechaPedido)}</strong>
                        </div>
                      </div>

                      <p style={styles.meta}>
                        Cliente: <strong style={styles.metaStrong}>{order.clientName}</strong>
                      </p>
                      {order.clientEmail && <p style={styles.meta}>Correo: {order.clientEmail}</p>}
                      {displayPhone ? (
                        <p style={styles.meta}>Contacto: {displayPhone}</p>
                      ) : (
                        <p style={styles.meta}>Contacto: no registrado</p>
                      )}
                      <p style={styles.meta}>ID cliente: {order.userId}</p>

                      <div style={styles.noteCard}>
                        <span style={styles.noteLabel}>Comentario del pedido</span>
                        <p style={styles.noteText}>
                          {order.comentarioPedido?.trim()
                            ? order.comentarioPedido
                            : 'El cliente no dejó instrucciones adicionales para este pedido.'}
                        </p>
                      </div>
                    </div>

                    <div style={styles.actions}>
                      <div style={styles.contactButtons}>
                        <a
                          href={telPhone ? `tel:${telPhone}` : '#'}
                          style={{
                            ...styles.quickContactButton,
                            ...(telPhone ? {} : styles.buttonDisabled),
                          }}
                          onClick={(event) => {
                            if (!telPhone) event.preventDefault();
                          }}
                        >
                          Llamar cliente
                        </a>
                        <a
                          href={whatsappLink || '#'}
                          target={whatsappPhone ? '_blank' : undefined}
                          rel={whatsappPhone ? 'noreferrer' : undefined}
                          style={{
                            ...styles.quickWhatsAppButton,
                            ...(whatsappPhone ? {} : styles.buttonDisabled),
                          }}
                          onClick={(event) => {
                            if (!whatsappPhone) event.preventDefault();
                          }}
                        >
                          WhatsApp cliente
                        </a>
                      </div>

                      <div style={styles.buttons}>
                        <button
                          style={{
                            ...styles.buttonDark,
                            ...(readyDisabled ? styles.buttonDisabled : {}),
                          }}
                          onClick={() => handleUpdate(order.id, 'LISTO_PARA_RECOGER')}
                          disabled={readyDisabled}
                        >
                          {readyLabel}
                        </button>

                        <button
                          style={{
                            ...styles.buttonSuccess,
                            ...(deliveredDisabled ? styles.buttonDisabled : {}),
                          }}
                          onClick={() => handleUpdate(order.id, 'ENTREGADO')}
                          disabled={deliveredDisabled}
                        >
                          {deliveredLabel}
                        </button>

                        <button
                          style={{
                            ...styles.buttonDanger,
                            ...(cancelDisabled ? styles.buttonDisabled : {}),
                          }}
                          onClick={() => handleUpdate(order.id, 'CANCELADO')}
                          disabled={cancelDisabled}
                        >
                          {cancelLabel}
                        </button>
                      </div>

                      <p style={styles.helperText}>{helperText}</p>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  wrapper: { display: 'grid', gap: '1rem' },
  subtitle: { marginTop: '0.35rem', color: '#6b7280', lineHeight: 1.7 },
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
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  info: { minWidth: 0, flex: '1 1 420px', display: 'grid', gap: '0.9rem' },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: { margin: 0, color: '#111827' },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '0.35rem 0.7rem',
    fontSize: '0.85rem',
    fontWeight: '700',
  },
  operationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.75rem',
  },
  operationBox: {
    display: 'grid',
    gap: '0.3rem',
    padding: '0.9rem 1rem',
    borderRadius: '14px',
    background: '#f8fafc',
    border: '1px solid #edf2f7',
  },
  operationLabel: {
    color: '#6b7280',
    fontSize: '0.85rem',
  },
  operationValue: {
    color: '#111827',
    fontSize: '1.05rem',
    lineHeight: 1.45,
  },
  meta: { color: '#6b7280', margin: 0 },
  metaStrong: { color: '#111827' },
  noteCard: {
    padding: '1rem',
    borderRadius: '14px',
    background: '#fff7ed',
    border: '1px solid rgba(180, 83, 9, 0.16)',
    display: 'grid',
    gap: '0.45rem',
  },
  noteLabel: {
    color: '#b45309',
    fontWeight: '700',
    fontSize: '0.88rem',
  },
  noteText: {
    color: '#7c2d12',
    margin: 0,
    lineHeight: 1.65,
  },
  actions: { display: 'grid', gap: '1rem', minWidth: '300px', flex: '1 1 300px' },
  contactButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.6rem',
  },
  quickContactButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f4f5f7',
    color: '#111827',
    border: '1px solid #e5e7eb',
    padding: '0.72rem 1rem',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: '700',
  },
  quickWhatsAppButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(21, 128, 61, 0.12)',
    color: '#15803d',
    border: '1px solid rgba(21, 128, 61, 0.18)',
    padding: '0.72rem 1rem',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: '700',
  },
  buttons: { display: 'grid', gap: '0.6rem' },
  helperText: {
    color: '#6b7280',
    fontSize: '0.92rem',
    lineHeight: '1.6',
    margin: 0,
  },
  buttonDark: {
    background: '#111',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    width: '100%',
  },
  buttonSuccess: {
    background: '#15803d',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    width: '100%',
  },
  buttonDanger: {
    background: '#c62828',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  empty: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '16px',
  },
  errorCard: {
    background: '#fff',
    padding: '1.25rem',
    borderRadius: '16px',
    display: 'grid',
    gap: '0.9rem',
    justifyItems: 'start',
  },
  errorCardInline: {
    background: '#fff',
    padding: '1rem 1.25rem',
    borderRadius: '16px',
    color: '#c62828',
    border: '1px solid rgba(198, 40, 40, 0.16)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
  },
  successCard: {
    background: '#fff',
    padding: '1rem 1.25rem',
    borderRadius: '16px',
    color: '#15803d',
    border: '1px solid rgba(21, 128, 61, 0.16)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
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
