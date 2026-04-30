import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEligibleCatalogProducts } from '../../services/catalog/expiringProductsService';

function getProductStatusTone(status) {
  if (status === 'ACTIVO') return { background: '#e8f7ee', color: '#15803d' };
  if (status === 'RETIRADO') return { background: '#fdecec', color: '#c62828' };
  return { background: '#f4f5f7', color: '#374151' };
}

export default function SelectExpiringProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const result = await getEligibleCatalogProducts();
      setProducts(result);
    } catch (err) {
      setError('No fue posible cargar los productos del catálogo total.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleContinue() {
    if (!selectedProductId) return;
    navigate(`/admin/expiring/new/${selectedProductId}`);
  }

  return (
    <div style={styles.wrapper}>
      <div>
        <h1>Seleccionar producto para publicación</h1>
        <p style={styles.subtitle}>
          Selecciona un producto del catálogo total para habilitarlo como producto
          próximo a vencer.
        </p>
      </div>

      {loading && <div style={styles.loadingCard}>Cargando productos elegibles para publicación...</div>}
      {error && (
        <div style={styles.errorCard}>
          <p style={styles.error}>{error}</p>
          <button style={styles.retryButton} onClick={loadData}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={styles.actions}>
            <button
              style={styles.primaryBtn}
              onClick={handleContinue}
              disabled={!selectedProductId}
            >
              Continuar con publicación
            </button>
          </div>

          <div style={styles.grid}>
            {products.length === 0 ? (
              <div style={styles.empty}>No hay productos activos disponibles.</div>
            ) : (
              products.map((product) => {
                const checked = selectedProductId === product.id;

                return (
                  <label
                    key={product.id}
                    style={{
                      ...styles.card,
                      border: checked ? '2px solid #c62828' : '1px solid #e5e7eb',
                    }}
                  >
                    <div style={styles.cardTop}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedProductId(checked ? '' : product.id)
                        }
                      />
                    </div>

                    <div style={styles.imageWrap}>
                      {product.imagenUrl ? (
                        <img
                          src={product.imagenUrl}
                          alt={product.nombreProducto}
                          style={styles.image}
                        />
                      ) : (
                        <div style={styles.placeholder}>Sin imagen</div>
                      )}
                    </div>

                    <div style={styles.content}>
                      <h3>{product.nombreProducto}</h3>
                      <p style={styles.meta}>{product.categoria}</p>
                      <p style={styles.description}>{product.descripcion}</p>

                      <div style={styles.row}>
                        <span style={styles.price}>
                          ${Number(product.precioBase || 0).toLocaleString('es-CO')}
                        </span>
                        <span style={{ ...styles.status, ...getProductStatusTone(product.estadoProducto) }}>
                          {product.estadoProducto}
                        </span>
                      </div>
                    </div>
                  </label>
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
  wrapper: {
    display: 'grid',
    gap: '1rem',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: '0.35rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  loadingCard: {
    background: '#fff',
    padding: '1.25rem',
    borderRadius: '16px',
    color: '#6b7280',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  },
  primaryBtn: {
    background: '#c62828',
    color: '#fff',
    border: 'none',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    cursor: 'pointer',
  },
  cardTop: {
    padding: '0.75rem 0.75rem 0 0.75rem',
  },
  imageWrap: {
    height: '180px',
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
    padding: '1rem',
  },
  meta: {
    color: '#6b7280',
    marginTop: '0.25rem',
  },
  description: {
    color: '#374151',
    marginTop: '0.5rem',
    fontSize: '0.95rem',
    minHeight: '54px',
  },
  row: {
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'center',
  },
  price: {
    fontWeight: '700',
    color: '#c62828',
  },
  status: {
    background: '#f3f4f6',
    padding: '0.35rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: '600',
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
  error: {
    color: '#c62828',
    margin: 0,
  },
  retryButton: {
    background: '#111827',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
  },
};
