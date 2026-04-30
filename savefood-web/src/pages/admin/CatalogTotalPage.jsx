import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCatalogProducts } from '../../services/catalog/catalogTotalService';

function getProductStatusTone(status) {
  if (status === 'ACTIVO') return { background: '#e8f7ee', color: '#15803d' };
  if (status === 'RETIRADO') return { background: '#fdecec', color: '#c62828' };
  return { background: '#f4f5f7', color: '#374151' };
}

export default function CatalogTotalPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const data = await getCatalogProducts();
      setProducts(data);
      setFiltered(data);
    } catch (err) {
      setError('No fue posible cargar el catálogo total.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const text = search.trim().toLowerCase();

    if (!text) {
      setFiltered(products);
      return;
    }

    const result = products.filter((item) =>
      item.nombreProducto?.toLowerCase().includes(text)
    );

    setFiltered(result);
  }, [search, products]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h1>Catálogo total de productos</h1>
          <p style={styles.subtitle}>
            Administra los productos base del restaurante.
          </p>
        </div>

        <Link to="/admin/catalog-total/new" style={styles.primaryBtn}>
          + Crear producto
        </Link>
      </div>

      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Buscar producto por nombre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      {loading && <div style={styles.loadingCard}>Cargando catálogo base del restaurante...</div>}
      {error && (
        <div style={styles.errorCard}>
          <p style={styles.error}>{error}</p>
          <button style={styles.retryButton} onClick={loadProducts}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <div style={styles.grid}>
          {filtered.length === 0 ? (
            <div style={styles.empty}>No se encontraron productos.</div>
          ) : (
            filtered.map((product) => (
              <article key={product.id} style={styles.card}>
                <div style={styles.imageWrap}>
                  {product.imagenUrl ? (
                    <img
                      src={product.imagenUrl}
                      alt={product.nombreProducto}
                      style={styles.image}
                    />
                  ) : (
                    <div style={styles.imagePlaceholder}>Sin imagen</div>
                  )}
                </div>

                <div style={styles.content}>
                  <h3 style={styles.productTitle}>{product.nombreProducto}</h3>
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

                  <div style={styles.actions}>
                    <Link
                      to={`/admin/catalog-total/edit/${product.id}`}
                      style={styles.secondaryBtn}
                    >
                      Editar
                    </Link>
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

const styles = {
  wrapper: {
    display: 'grid',
    gap: '1.25rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  subtitle: {
    marginTop: '0.35rem',
    color: '#6b7280',
  },
  toolbar: {
    background: '#fff',
    padding: '1rem',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  },
  loadingCard: {
    background: '#fff',
    padding: '1.25rem',
    borderRadius: '16px',
    color: '#6b7280',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  },
  search: {
    width: '100%',
    padding: '0.9rem',
    border: '1px solid #ddd',
    borderRadius: '10px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    display: 'grid',
  },
  imageWrap: {
    height: '200px',
    background: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'grid',
    placeItems: 'center',
    color: '#777',
  },
  content: {
    padding: '1rem',
  },
  productTitle: {
    marginBottom: '0.35rem',
  },
  meta: {
    color: '#6b7280',
    marginBottom: '0.6rem',
  },
  description: {
    color: '#374151',
    fontSize: '0.95rem',
    minHeight: '54px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: '1rem',
    gap: '1rem',
  },
  price: {
    fontWeight: '700',
    color: '#c62828',
  },
  status: {
    padding: '0.35rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  actions: {
    marginTop: '1rem',
  },
  primaryBtn: {
    display: 'inline-flex',
    justifyContent: 'center',
    background: '#c62828',
    color: '#fff',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    fontWeight: '600',
  },
  secondaryBtn: {
    display: 'inline-block',
    background: '#111',
    color: '#fff',
    padding: '0.7rem 1rem',
    borderRadius: '10px',
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
