import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/router/Provider/useAuth';
import { getClientOrders } from '../../services/orders/orderService';
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

function canRetryPayment(order) {
  return order?.estadoPedido === 'PENDIENTE_PAGO';
}

export default function ClientOrdersPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadOrders() {
    if (!currentUser?.uid) return;

    setLoading(true);
    setError('');

    try {
      const data = await getClientOrders(currentUser.uid);
      setOrders(data);
    } catch {
      setError('No fue posible cargar tus pedidos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  return (
    <div className="sf-clientSection">
      <div className="sf-clientSectionHeader">
        <h1>Mis pedidos</h1>
        <p className="sf-clientSectionSubtitle">
          Consulta el estado, el detalle y las acciones disponibles para cada compra.
        </p>
      </div>

      {loading && <div className="sf-clientInfoCard">Cargando historial de compras...</div>}

      {error && (
        <div className="sf-clientInfoCard sf-clientInfoCard--error">
          <p className="sf-feedbackError">{error}</p>
          <button className="sf-btn sf-btnDark" onClick={loadOrders}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="sf-ordersList">
          {orders.length === 0 ? (
            <div className="sf-emptyState">Aún no tienes pedidos registrados.</div>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="sf-orderCard">
                <div className="sf-orderCardMain">
                  <div className="sf-orderCardTop">
                    <div className="sf-orderCardTitleBlock">
                      <h3>Pedido {order.orderId}</h3>
                      <p>Recogida en tienda · Sede {order.sede}</p>
                    </div>
                    <span className="sf-orderStatusBadge" style={getStatusTone(order.estadoPedido)}>
                      {getStatusLabel(order.estadoPedido)}
                    </span>
                  </div>

                  <div className="sf-detailMetaBar">
                    <span className="sf-detailMetaPill">
                      {canRetryPayment(order) ? 'Pago pendiente' : 'Pedido activo'}
                    </span>
                    <span className="sf-detailMetaPill">Trazabilidad disponible</span>
                    {canRetryPayment(order) && (
                      <span className="sf-detailMetaText">
                        Si saliste de Stripe, puedes retomar el pago desde aquí sin rehacer la
                        compra.
                      </span>
                    )}
                  </div>
                </div>

                <div className="sf-orderCardSide">
                  <div className="sf-checkoutAmount sf-checkoutAmount--total">
                    <strong>${Number(order.totalPedido || 0).toLocaleString('es-CO')}</strong>
                    <span>COP</span>
                  </div>

                  <div className="sf-orderCardActions">
                    <Link to={`/client/orders/${order.id}`} className="sf-btn sf-btnDark">
                      Ver detalle
                    </Link>

                    {canRetryPayment(order) && (
                      <Link to={`/client/payment/${order.id}`} className="sf-btn sf-btnSolid">
                        Pagar ahora
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
