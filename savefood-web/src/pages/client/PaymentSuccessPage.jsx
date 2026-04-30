import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmStripeCheckoutSession } from '../../services/payments/stripePaymentService';
import '../../styles/App.css';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    async function confirmPayment() {
      if (!sessionId) {
        setError('No se recibió el identificador de la sesión de pago.');
        setLoading(false);
        return;
      }

      try {
        const data = await confirmStripeCheckoutSession(sessionId);
        setResult(data);
      } catch (err) {
        setError(err.message || 'No fue posible confirmar el pago.');
      } finally {
        setLoading(false);
      }
    }

    confirmPayment();
  }, [sessionId]);

  return (
    <div className="sf-clientSection">
      <div className="sf-paymentSuccessCard">
        <div className="sf-paymentSuccessTop">
          <span className="sf-paymentSuccessIcon">✓</span>
          <div className="sf-paymentSuccessCopy">
            <h1>Pago confirmado</h1>
            <p className="sf-clientSectionSubtitle">
              Tu compra fue registrada correctamente y ya puedes seguir el pedido desde tu cuenta.
            </p>
          </div>
        </div>

        {loading && <div className="sf-clientInfoCard">Confirmando información del pago...</div>}

        {!loading && error && <p className="sf-feedbackError">{error}</p>}

        {!loading && result && (
          <>
            <div className="sf-orderDetailMetaGrid">
              <article className="sf-orderDetailMetaCard">
                <span>Pedido</span>
                <strong>{result.orderId || orderId}</strong>
              </article>
              <article className="sf-orderDetailMetaCard">
                <span>Estado del pago</span>
                <strong>{result.paymentStatus}</strong>
              </article>
              <article className="sf-orderDetailMetaCard">
                <span>Total pagado</span>
                <strong>${Number((result.amountTotal || 0) / 100).toLocaleString('es-CO')} COP</strong>
              </article>
              <article className="sf-orderDetailMetaCard">
                <span>Correo del comprador</span>
                <strong>{result.customerEmail || 'No disponible'}</strong>
              </article>
            </div>

            <div className="sf-detailMetaBar">
              <span className="sf-detailMetaPill">Pedido registrado</span>
              <span className="sf-detailMetaPill">Notificaciones activas</span>
              <span className="sf-detailMetaText">
                Recibirás seguimiento del estado del pedido hasta su recogida en tienda.
              </span>
            </div>

            <div className="sf-orderDetailActions">
              <Link to="/client/orders" className="sf-btn sf-btnSolid">
                Ver mis pedidos
              </Link>

              <Link to="/client/catalog" className="sf-btn sf-btnDark">
                Volver al catálogo
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
