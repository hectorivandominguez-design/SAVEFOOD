import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../app/router/Provider/useAuth';
import { getOrderDetail } from '../../services/orders/orderService';
import { cancelOrderByClient } from '../../services/orders/orderMutationService';
import '../../styles/App.css';

function getStatusLabel(status) {
  if (status === 'PENDIENTE_PAGO') return 'Pendiente de pago';
  if (status === 'PAGADO') return 'Pagado';
  if (status === 'LISTO_PARA_RECOGER') return 'Listo para recoger';
  if (status === 'ENTREGADO') return 'Entregado';
  if (status === 'CANCELADO') return 'Cancelado';
  return status || 'Sin estado';
}

function getStatusTone(status) {
  if (status === 'ENTREGADO') return { background: '#e8f7ee', color: '#15803d' };
  if (status === 'CANCELADO') return { background: '#fdecec', color: '#c62828' };
  if (status === 'LISTO_PARA_RECOGER') return { background: '#fff6e8', color: '#b45309' };
  if (status === 'PAGADO') return { background: '#eef2ff', color: '#1d4ed8' };
  return { background: '#f4f5f7', color: '#374151' };
}

function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function canRetryPayment(order) {
  return order?.estadoPedido === 'PENDIENTE_PAGO';
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadDetail() {
    setLoading(true);
    setError('');

    try {
      const data = await getOrderDetail(id);
      setDetail(data);
    } catch {
      setError('No fue posible cargar el detalle del pedido.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id]);

  async function handleCancelOrder() {
    if (!currentUser?.uid) return;

    setCancelling(true);
    setError('');
    setMessage('');

    try {
      await cancelOrderByClient({
        orderId: id,
        motivoCancelacion: 'Cancelación realizada por el cliente.',
      });

      setMessage('El pedido fue cancelado correctamente.');
      await loadDetail();
    } catch (err) {
      setError(err.message || 'No fue posible cancelar el pedido.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <div className="sf-clientInfoCard">Cargando detalle del pedido...</div>;
  }

  if (error && !detail) {
    return <p className="sf-feedbackError">{error}</p>;
  }

  if (!detail) {
    return <div className="sf-emptyState">No se encontró el pedido.</div>;
  }

  const { order, items } = detail;
  const canCancel = order.estadoPedido !== 'ENTREGADO' && order.estadoPedido !== 'CANCELADO';
  const canFeedback = order.estadoPedido === 'ENTREGADO';
  const retryPayment = canRetryPayment(order);

  return (
    <div className="sf-clientSection">
      <div className="sf-orderDetailCard">
        <div className="sf-orderDetailHeader">
          <div className="sf-orderDetailHeaderCopy">
            <h1>Detalle del pedido</h1>
            <p className="sf-clientSectionSubtitle">
              Revisa el estado, el contenido de la compra y las acciones disponibles para este
              pedido.
            </p>
          </div>

          <span className="sf-orderStatusBadge" style={getStatusTone(order.estadoPedido)}>
            {getStatusLabel(order.estadoPedido)}
          </span>
        </div>

        <div className="sf-orderVisualHero">
          <div className="sf-orderVisualHeroCopy">
            <span className="sf-detailMetaPill">Seguimiento de compra</span>
            <h2>Todo lo importante en un solo bloque</h2>
            <p>
              Conservamos el identificador, la sede, el código de recogida y tu observación para
              que puedas revisar el pedido sin perder contexto.
            </p>
          </div>

          <div className="sf-orderVisualHeroStats">
            <article className="sf-orderVisualHeroStat">
              <span>ID del pedido</span>
              <strong>{order.orderId}</strong>
            </article>
            <article className="sf-orderVisualHeroStat">
              <span>Método</span>
              <strong>Recoger en tienda</strong>
            </article>
            <article className="sf-orderVisualHeroStat">
              <span>Código</span>
              <strong>{order.codigoRecogida || 'Pendiente'}</strong>
            </article>
          </div>
        </div>

        <div className="sf-orderDetailMetaGrid">
          <article className="sf-orderDetailMetaCard">
            <span>Sede</span>
            <strong>{order.sede}</strong>
          </article>
          <article className="sf-orderDetailMetaCard">
            <span>Total</span>
            <strong>{formatPrice(order.totalPedido || 0)} COP</strong>
          </article>
          <article className="sf-orderDetailMetaCard">
            <span>Estado actual</span>
            <strong>{getStatusLabel(order.estadoPedido)}</strong>
          </article>
          <article className="sf-orderDetailMetaCard">
            <span>Productos</span>
            <strong>{items.length} registro(s)</strong>
          </article>
        </div>

        <div className="sf-checkoutNoteCard sf-checkoutNoteCardReadOnly">
          <div className="sf-checkoutNoteHead">
            <span className="sf-checkoutNoteLabel">Tu comentario para el pedido</span>
            <span className="sf-checkoutNoteBadge">Preparación</span>
          </div>
          <p className="sf-checkoutNoteHelp">
            Aquí ves exactamente la observación que quedó registrada para la preparación.
          </p>
          <div className="sf-orderNotePanel">
            <p className="sf-orderNoteText">
              {order.comentarioPedido?.trim()
                ? order.comentarioPedido
                : 'No registraste instrucciones adicionales para este pedido.'}
            </p>
          </div>
        </div>

        <div className="sf-orderDetailItemsSection">
          <div className="sf-orderDetailSectionHead">
            <h2>Productos del pedido</h2>
            <span className="sf-detailMetaPill">{items.length} producto(s)</span>
          </div>

          <div className="sf-checkoutProductsGrid">
            {items.map((item) => (
              <article key={item.id} className="sf-orderProductCard">
                <div className="sf-orderProductCardMedia">
                  {item.imagenUrlSnapshot ? (
                    <img
                      src={item.imagenUrlSnapshot}
                      alt={item.nombreProductoSnapshot}
                      className="sf-orderProductCardImage"
                    />
                  ) : (
                    <div className="sf-orderProductCardPlaceholder">Sin imagen</div>
                  )}
                </div>

                <div className="sf-orderProductCardContent">
                  <div className="sf-orderProductCardTop">
                    <span className="sf-cardCategory">
                      {item.categoriaSnapshot || 'Producto del pedido'}
                    </span>
                    <span className="sf-detailMetaPill">x{item.cantidad}</span>
                  </div>

                  <div className="sf-orderProductCardHeading">
                    <strong>{item.nombreProductoSnapshot}</strong>
                    <p>
                      {item.descripcionSnapshot?.trim()
                        ? item.descripcionSnapshot
                        : 'Producto registrado dentro de tu pedido para retiro en tienda.'}
                    </p>
                  </div>

                  <div className="sf-orderProductCardFooter">
                    <div className="sf-orderProductCardMeta">
                      <span>{formatPrice(item.precioUnitarioSnapshot || 0)} c/u</span>
                      <span>Recoger en tienda</span>
                    </div>
                    <div className="sf-checkoutAmount">
                      <strong>{formatPrice(item.subtotal || 0)}</strong>
                      <span>COP</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="sf-checkoutSummary">
          <div className="sf-checkoutSummaryLine">
            <span>Total del pedido</span>
            <div className="sf-checkoutAmount sf-checkoutAmount--total">
              <strong>{formatPrice(order.totalPedido || 0)}</strong>
              <span>COP</span>
            </div>
          </div>
          <div className="sf-detailMetaBar">
            <span className="sf-detailMetaPill">Seguimiento activo</span>
            <span className="sf-detailMetaPill">Notificaciones disponibles</span>
            {retryPayment && (
              <span className="sf-detailMetaText">
                Este pedido sigue pendiente de pago. Si saliste de Stripe antes de finalizar,
                puedes retomarlo desde aquí.
              </span>
            )}
          </div>
        </div>

        {message && <p className="sf-feedbackSuccess">{message}</p>}
        {error && <p className="sf-feedbackError">{error}</p>}

        <div className="sf-orderDetailActions">
          {retryPayment && (
            <Link to={`/client/payment/${id}`} className="sf-btn sf-btnSolid">
              Pagar ahora
            </Link>
          )}

          {canCancel && (
            <button
              onClick={handleCancelOrder}
              className={`sf-btn ${retryPayment ? 'sf-btnGhost' : 'sf-btnSolid'}`}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelando...' : 'Cancelar pedido'}
            </button>
          )}

          <Link to={`/client/orders/${id}/contact`} className="sf-btn sf-btnGhost">
            Contactar tienda
          </Link>

          {canFeedback && (
            <Link to={`/client/orders/${id}/feedback`} className="sf-btn sf-btnDark">
              Valorar pedido
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
