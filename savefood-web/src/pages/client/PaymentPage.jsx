import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createStripeCheckoutSession } from '../../services/payments/stripePaymentService';
import '../../styles/App.css';

export default function PaymentPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canceled = searchParams.get('canceled');

  async function handlePay() {
    setError('');
    setLoading(true);

    try {
      const result = await createStripeCheckoutSession(orderId);

      if (result?.url) {
        window.location.href = result.url;
        return;
      }

      throw new Error('No se recibió la URL de Stripe.');
    } catch (err) {
      setError(err.message || 'No fue posible iniciar el pago.');
      setLoading(false);
    }
  }

  return (
    <div className="sf-clientSection">
      <div className="sf-paymentStartCard">
        <div className="sf-paymentStartCopy">
          <h1>Pago del pedido</h1>
          <p className="sf-clientSectionSubtitle">
            Pedido generado correctamente con ID: <strong>{orderId}</strong>
          </p>
          <p className="sf-detailMetaText">
            Serás redirigido a Stripe Checkout para completar el pago en línea de forma segura.
          </p>
          <p className="sf-detailMetaText">
            Por seguridad, el pedido se libera automáticamente si no se paga dentro de los 30 minutos disponibles.
          </p>
        </div>

        <div className="sf-detailMetaBar">
          <span className="sf-detailMetaPill">Pago seguro</span>
          <span className="sf-detailMetaPill">Stripe Checkout</span>
          <span className="sf-detailMetaPill">30 minutos para pagar</span>
        </div>

        {canceled === '1' && (
          <div className="sf-paymentWarningCard">
            <strong>Pago cancelado</strong>
            <p>El proceso fue interrumpido antes de finalizar. Puedes volver a intentarlo cuando quieras.</p>
          </div>
        )}

        {error && <p className="sf-feedbackError">{error}</p>}

        <div className="sf-orderDetailActions">
          <button onClick={handlePay} className="sf-btn sf-btnSolid" disabled={loading}>
            {loading ? 'Redirigiendo a Stripe...' : 'Pagar con Stripe'}
          </button>

          <button onClick={() => navigate('/client/orders')} className="sf-btn sf-btnDark">
            Ir a mis pedidos
          </button>
        </div>
      </div>
    </div>
  );
}
