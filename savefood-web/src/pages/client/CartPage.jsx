import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../app/router/Provider/CartProvider';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, totalAmount, updateQuantity, removeFromCart } = useCart();

  function changeQuantity(item, delta) {
    const currentQuantity = Number(item.quantity || 1);
    const maxQuantity = Number(item.availableStock || currentQuantity);
    const nextQuantity = Math.min(Math.max(currentQuantity + delta, 1), maxQuantity);
    updateQuantity(item.expiringProductId, nextQuantity);
  }

  return (
    <div style={styles.wrapper}>
      <div>
        <h1>Carrito de compra</h1>
        <p style={styles.subtitle}>
          Revisa los productos seleccionados antes de generar tu pedido.
        </p>
      </div>

      {items.length === 0 ? (
        <div style={styles.empty}>
          <p>Tu carrito está vacío.</p>
          <Link to="/client/catalog" style={styles.primaryBtn}>
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div style={styles.layout}>
          <div style={styles.list}>
            {items.map((item) => (
              <article key={item.expiringProductId} style={styles.card}>
                <div style={styles.imageWrap}>
                  {item.imagenUrl ? (
                    <img
                      src={item.imagenUrl}
                      alt={item.nombreProductoSnapshot}
                      style={styles.image}
                    />
                  ) : (
                    <div style={styles.placeholder}>Sin imagen</div>
                  )}
                </div>

                <div style={styles.content}>
                  <h3>{item.nombreProductoSnapshot}</h3>
                  <p style={styles.price}>
                    ${Number(item.precioUnitarioSnapshot).toLocaleString('es-CO')}
                  </p>

                  <div style={styles.controls}>
                    <div style={styles.stepper}>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item, -1)}
                        style={styles.stepperButton}
                        disabled={Number(item.quantity || 1) <= 1}
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="1"
                        max={item.availableStock || 1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.expiringProductId, Number(e.target.value))
                        }
                        style={styles.input}
                      />

                      <button
                        type="button"
                        onClick={() => changeQuantity(item, 1)}
                        style={styles.stepperButton}
                        disabled={Number(item.quantity || 1) >= Number(item.availableStock || 1)}
                      >
                        +
                      </button>
                    </div>

                    <span style={styles.stockText}>
                      Máximo disponible: {item.availableStock || item.quantity}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.expiringProductId)}
                      style={styles.removeBtn}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div style={styles.totalCol}>
                  <strong>${Number(item.subtotal).toLocaleString('es-CO')}</strong>
                </div>
              </article>
            ))}
          </div>

          <aside style={styles.summary}>
            <h3>Resumen del pedido</h3>
            <p>Total de productos: {items.length}</p>
            <p style={styles.summaryTotal}>
              Total: ${Number(totalAmount).toLocaleString('es-CO')}
            </p>

            <button
              onClick={() => navigate('/client/checkout')}
              style={styles.primaryBtn}
            >
              Continuar al checkout
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'grid',
    gap: '1.25rem',
  },
  subtitle: {
    marginTop: '0.35rem',
    color: '#6b7280',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
  },
  list: {
    display: 'grid',
    gap: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: '1rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1rem',
    alignItems: 'start',
  },
  imageWrap: {
    height: '100px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'grid',
    placeItems: 'center',
    color: '#777',
  },
  content: {
    display: 'grid',
    gap: '0.45rem',
  },
  price: {
    color: '#c62828',
    fontWeight: '700',
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.8rem',
    alignItems: 'center',
  },
  stepper: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid #ddd',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#fff',
  },
  stepperButton: {
    width: '42px',
    height: '42px',
    border: 'none',
    background: '#f8fafc',
    color: '#111827',
    fontSize: '1.15rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  stockText: {
    color: '#6b7280',
    fontSize: '0.9rem',
  },
  input: {
    width: '64px',
    height: '42px',
    padding: '0 0.5rem',
    border: 'none',
    borderLeft: '1px solid #ddd',
    borderRight: '1px solid #ddd',
    borderRadius: '0',
    textAlign: 'center',
  },
  removeBtn: {
    background: '#111',
    color: '#fff',
    border: 'none',
    padding: '0.7rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  totalCol: {
    fontSize: '1.1rem',
    color: '#111',
    justifySelf: 'start',
  },
  summary: {
    background: '#fff',
    borderRadius: '18px',
    padding: '1.5rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    height: 'fit-content',
  },
  summaryTotal: {
    marginTop: '1rem',
    marginBottom: '1rem',
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#c62828',
  },
  primaryBtn: {
    display: 'inline-flex',
    justifyContent: 'center',
    background: '#c62828',
    color: '#fff',
    border: 'none',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '1rem',
    width: '100%',
  },
  empty: {
    background: '#fff',
    borderRadius: '18px',
    padding: '2rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  },
};
