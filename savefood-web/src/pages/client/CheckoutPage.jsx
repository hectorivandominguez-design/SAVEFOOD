import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../app/router/Provider/CartProvider';
import { useAuth } from '../../app/router/Provider/useAuth';
import { createOrderWithItems } from '../../services/orders/orderMutationService';
import '../../styles/App.css';

function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { items, totalAmount, clearCart } = useCart();

  const [comentarioPedido, setComentarioPedido] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateOrder() {
    setError('');

    if (!currentUser?.uid) {
      setError('Debes iniciar sesión para continuar.');
      return;
    }

    if (!items.length) {
      setError('No hay productos en el carrito.');
      return;
    }

    setLoading(true);

    try {
      const orderId = await createOrderWithItems({
        sede: 'Bosa',
        items,
        comentarioPedido,
      });

      clearCart();
      navigate(`/client/payment/${orderId}`);
    } catch (err) {
      setError(err.message || 'No fue posible generar el pedido.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sf-clientSection">
      <div className="sf-clientSectionHeader">
        <h1>Checkout</h1>
        <p className="sf-clientSectionSubtitle">
          Confirma tu pedido y revisa cada producto antes de continuar al pago en línea.
        </p>
      </div>

      <div className="sf-checkoutCard sf-checkoutCardWide">
        {items.length === 0 ? (
          <div className="sf-emptyState">No hay productos seleccionados.</div>
        ) : (
          <>
            <div className="sf-orderVisualHero">
              <div className="sf-orderVisualHeroCopy">
                <span className="sf-detailMetaPill">Resumen previo al pago</span>
                <h2>Verifica lo que vas a comprar</h2>
                <p>
                  Conservamos imagen, descripción, cantidades y total para que el flujo se sienta
                  claro y continuo antes de enviarte a Stripe.
                </p>
              </div>

              <div className="sf-orderVisualHeroStats">
                <article className="sf-orderVisualHeroStat">
                  <span>Productos</span>
                  <strong>{items.length}</strong>
                </article>
                <article className="sf-orderVisualHeroStat">
                  <span>Retiro</span>
                  <strong>Sede Bosa</strong>
                </article>
                <article className="sf-orderVisualHeroStat">
                  <span>Total</span>
                  <strong>{formatPrice(totalAmount)}</strong>
                </article>
              </div>
            </div>

            <div className="sf-checkoutProductsGrid">
              {items.map((item) => (
                <article key={item.expiringProductId} className="sf-orderProductCard">
                  <div className="sf-orderProductCardMedia">
                    {item.imagenUrl ? (
                      <img
                        src={item.imagenUrl}
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
                      <span className="sf-detailMetaPill">x{item.quantity}</span>
                    </div>

                    <div className="sf-orderProductCardHeading">
                      <strong>{item.nombreProductoSnapshot}</strong>
                      <p>
                        {item.descripcionSnapshot?.trim()
                          ? item.descripcionSnapshot
                          : 'Producto reservado para retiro en tienda en la sede Bosa.'}
                      </p>
                    </div>

                    <div className="sf-orderProductCardFooter">
                      <div className="sf-orderProductCardMeta">
                        <span>{formatPrice(item.precioUnitarioSnapshot)} c/u</span>
                        <span>Retiro en tienda</span>
                      </div>
                      <div className="sf-checkoutAmount">
                        <strong>{formatPrice(item.subtotal)}</strong>
                        <span>COP</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="sf-checkoutSummary">
              <div className="sf-checkoutSummaryLine">
                <span>Total del pedido</span>
                <div className="sf-checkoutAmount sf-checkoutAmount--total">
                  <strong>{formatPrice(totalAmount)}</strong>
                  <span>COP</span>
                </div>
              </div>

              <div className="sf-detailMetaBar">
                <span className="sf-detailMetaPill">Recoger en tienda</span>
                <span className="sf-detailMetaPill">Sede Bosa</span>
                <span className="sf-detailMetaText">
                  Al confirmar, el sistema genera tu pedido, reserva el stock y te dirige al pago
                  en línea.
                </span>
                <span className="sf-detailMetaText">
                  Tendrás 30 minutos para completar el pago antes de que el pedido se libere
                  automáticamente.
                </span>
              </div>
            </div>

            <div className="sf-checkoutNoteCard">
              <div className="sf-checkoutNoteHead">
                <label htmlFor="comentarioPedido" className="sf-checkoutNoteLabel">
                  Comentario para tu pedido
                </label>
                <span className="sf-checkoutNoteBadge">Opcional</span>
              </div>

              <p className="sf-checkoutNoteHelp">
                Aquí puedes indicar ajustes como: sin tomate, poca salsa, sin lechuga o cualquier
                detalle importante para la preparación.
              </p>

              <div className="sf-checkoutNoteSurface">
                <textarea
                  id="comentarioPedido"
                  className="sf-checkoutNoteInput"
                  rows={4}
                  maxLength={280}
                  placeholder="Ejemplo: sin cebolla, salsa aparte, poca mayonesa..."
                  value={comentarioPedido}
                  onChange={(event) => setComentarioPedido(event.target.value.slice(0, 280))}
                />
                <div className="sf-checkoutNoteCounter">
                  <span>Máximo recomendado para cocina</span>
                  <span>{comentarioPedido.length}/280</span>
                </div>
              </div>
            </div>

            {error && <p className="sf-feedbackError">{error}</p>}

            <button onClick={handleCreateOrder} className="sf-btn sf-btnSolid" disabled={loading}>
              {loading ? 'Generando pedido...' : 'Confirmar pedido'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
