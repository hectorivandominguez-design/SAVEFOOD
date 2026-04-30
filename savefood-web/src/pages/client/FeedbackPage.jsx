import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../app/router/Provider/useAuth';
import {
  createFeedbackReview,
  getFeedbackByOrderAndUser,
} from '../../services/feedback/feedbackService';
import { getOrderDetail } from '../../services/orders/orderService';
import { getExpiringProductById } from '../../services/catalog/expiringProductsService';

function renderStars(value) {
  return Array.from({ length: 5 }, (_, index) => index < value);
}

export default function FeedbackPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [itemImages, setItemImages] = useState({});
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadOrder() {
      setLoadingPage(true);
      setError('');

      try {
        const detail = await getOrderDetail(id);
        setOrder(detail.order);
        setItems(detail.items || []);

        if (currentUser?.uid) {
          const feedback = await getFeedbackByOrderAndUser(id, currentUser.uid);
          setExistingFeedback(feedback);
        }

        const visualsEntries = await Promise.all(
          (detail.items || []).map(async (item) => {
            try {
              if (!item.expiringProductId) {
                return [item.id, ''];
              }

              const product = await getExpiringProductById(item.expiringProductId);
              return [item.id, product?.imagenUrl || ''];
            } catch {
              return [item.id, ''];
            }
          })
        );

        setItemImages(Object.fromEntries(visualsEntries));
      } catch {
        setError('No fue posible cargar la información del pedido.');
      } finally {
        setLoadingPage(false);
      }
    }

    if (id) {
      loadOrder();
    }
  }, [id, currentUser]);

  const totalItems = useMemo(
    () => items.reduce((accumulator, item) => accumulator + Number(item.cantidad || 0), 0),
    [items]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      if (!currentUser?.uid) {
        throw new Error('Debes iniciar sesión para registrar tu valoración.');
      }

      if (order?.estadoPedido !== 'ENTREGADO') {
        throw new Error('Solo puedes valorar pedidos que ya fueron entregados.');
      }

      await createFeedbackReview({
        orderId: id,
        calificacion,
        comentario,
      });

      setMessage('Tu valoración fue registrada correctamente.');
      setComentario('');
      setCalificacion(5);
      const feedback = await getFeedbackByOrderAndUser(id, currentUser.uid);
      setExistingFeedback(feedback);
    } catch (err) {
      setError(err.message || 'No fue posible registrar la valoración.');
    } finally {
      setSaving(false);
    }
  }

  if (loadingPage) return <div style={styles.loadingCard}>Cargando información del pedido...</div>;
  if (error && !order) {
    return (
      <div style={styles.errorCard}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }
  if (!order) return <p>No se encontró el pedido.</p>;

  const canSubmit = currentUser?.uid && order.estadoPedido === 'ENTREGADO' && !saving;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1>Feedback y valoración</h1>
        <p style={styles.subtitle}>
          Pedido: <b>{order.orderId}</b> · Estado: <b>{order.estadoPedido}</b>
        </p>
        <p style={styles.helperText}>
          Tu opinión nos ayuda a mejorar la experiencia de compra y recogida en tienda.
        </p>

        <div style={styles.summaryGrid}>
          <div style={styles.summaryBox}>
            <span>Total del pedido</span>
            <strong>${Number(order.totalPedido || 0).toLocaleString('es-CO')}</strong>
          </div>
          <div style={styles.summaryBox}>
            <span>Productos</span>
            <strong>{totalItems}</strong>
          </div>
          <div style={styles.summaryBox}>
            <span>Sede</span>
            <strong>{order.sede || 'Bosa'}</strong>
          </div>
        </div>

        <div style={styles.itemsGrid}>
          {items.map((item) => (
            <article key={item.id} style={styles.itemCard}>
              <div style={styles.itemImageWrap}>
                {itemImages[item.id] ? (
                  <img
                    src={itemImages[item.id]}
                    alt={item.nombreProductoSnapshot}
                    style={styles.itemImage}
                  />
                ) : (
                  <div style={styles.itemPlaceholder}>Producto</div>
                )}
              </div>

              <div style={styles.itemCopy}>
                <strong style={styles.itemTitle}>{item.nombreProductoSnapshot}</strong>
                <span style={styles.itemMeta}>Cantidad: {item.cantidad}</span>
                <span style={styles.itemMeta}>
                  Precio unitario: ${Number(item.precioUnitarioSnapshot || 0).toLocaleString('es-CO')}
                </span>
                <span style={styles.itemMeta}>
                  Subtotal: ${Number(item.subtotal || 0).toLocaleString('es-CO')}
                </span>
              </div>
            </article>
          ))}
        </div>

        {existingFeedback ? (
          <div style={styles.reviewCard}>
            <p style={styles.reviewTitle}>Ya registraste tu valoración para este pedido.</p>
            <div style={styles.starRow}>
              {renderStars(Number(existingFeedback.calificacion || 0)).map((filled, index) => (
                <span key={`existing-star-${index}`} style={filled ? styles.starFilled : styles.starEmpty}>
                  ★
                </span>
              ))}
            </div>
            <p style={styles.reviewComment}>
              {existingFeedback.comentario || 'No dejaste un comentario adicional.'}
            </p>
          </div>
        ) : (
          <>
            {order.estadoPedido !== 'ENTREGADO' && (
              <p style={styles.info}>
                La valoración se habilita cuando el pedido ya fue marcado como entregado.
              </p>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div>
                <label style={styles.label}>Calificación</label>
                <div style={styles.ratingSelector}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      style={value <= calificacion ? styles.ratingButtonActive : styles.ratingButton}
                      onClick={() => setCalificacion(value)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={styles.label}>Comentario</label>
                <textarea
                  value={comentario}
                  onChange={(event) => setComentario(event.target.value)}
                  style={styles.textarea}
                  rows={5}
                  maxLength={500}
                  placeholder="Escribe tu opinión sobre la experiencia de compra"
                />
              </div>

              {message && <p style={styles.success}>{message}</p>}
              {error && <p style={styles.error}>{error}</p>}

              <button type="submit" style={styles.button} disabled={!canSubmit}>
                {saving ? 'Guardando...' : 'Enviar valoración'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'grid',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: '2rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    maxWidth: '920px',
  },
  loadingCard: {
    background: '#fff',
    padding: '1.25rem',
    borderRadius: '16px',
    color: '#6b7280',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    maxWidth: '920px',
  },
  subtitle: {
    marginTop: '0.5rem',
    color: '#6b7280',
  },
  helperText: {
    marginTop: '0.65rem',
    color: '#374151',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.9rem',
    marginTop: '1.4rem',
  },
  summaryBox: {
    display: 'grid',
    gap: '0.35rem',
    padding: '1rem',
    borderRadius: '14px',
    background: '#f8fafc',
  },
  itemsGrid: {
    display: 'grid',
    gap: '0.9rem',
    marginTop: '1.25rem',
  },
  itemCard: {
    display: 'grid',
    gridTemplateColumns: '120px minmax(0, 1fr)',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '16px',
    border: '1px solid #eceff3',
    background: '#fff',
  },
  itemImageWrap: {
    height: '120px',
    borderRadius: '14px',
    overflow: 'hidden',
    background: '#f4f5f7',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  itemPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'grid',
    placeItems: 'center',
    color: '#6b7280',
    fontWeight: '700',
  },
  itemCopy: {
    display: 'grid',
    gap: '0.45rem',
    alignContent: 'start',
  },
  itemTitle: {
    color: '#111827',
    fontSize: '1.02rem',
  },
  itemMeta: {
    color: '#6b7280',
    fontSize: '0.95rem',
  },
  info: {
    marginTop: '1rem',
    color: '#6b7280',
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '0.85rem 1rem',
  },
  reviewCard: {
    marginTop: '1.5rem',
    background: '#f8fafc',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'grid',
    gap: '0.7rem',
  },
  reviewTitle: {
    margin: 0,
    color: '#111827',
    fontWeight: '700',
  },
  reviewComment: {
    margin: 0,
    color: '#374151',
  },
  form: {
    display: 'grid',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.45rem',
    fontWeight: '600',
  },
  ratingSelector: {
    display: 'flex',
    gap: '0.45rem',
    flexWrap: 'wrap',
  },
  ratingButton: {
    border: 'none',
    background: 'transparent',
    color: '#d1d5db',
    fontSize: '2rem',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  ratingButtonActive: {
    border: 'none',
    background: 'transparent',
    color: '#f59e0b',
    fontSize: '2rem',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  starRow: {
    display: 'flex',
    gap: '0.35rem',
  },
  starFilled: {
    color: '#f59e0b',
    fontSize: '1.7rem',
    lineHeight: 1,
  },
  starEmpty: {
    color: '#d1d5db',
    fontSize: '1.7rem',
    lineHeight: 1,
  },
  textarea: {
    width: '100%',
    padding: '0.85rem',
    border: '1px solid #ddd',
    borderRadius: '10px',
    resize: 'vertical',
  },
  button: {
    background: '#c62828',
    color: '#fff',
    border: 'none',
    padding: '0.9rem 1.2rem',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  success: {
    color: '#15803d',
  },
  error: {
    color: '#c62828',
  },
  errorCard: {
    background: '#fff',
    padding: '1.25rem',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    maxWidth: '920px',
  },
};
