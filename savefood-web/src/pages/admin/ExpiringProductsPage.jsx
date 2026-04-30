import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExpiringProducts } from '../../services/catalog/expiringProductsService';

function isExpiredByDate(dateValue) {
  if (!dateValue) return false;

  const rawDate =
    typeof dateValue?.toDate === 'function'
      ? dateValue.toDate()
      : dateValue instanceof Date
        ? dateValue
        : new Date(`${String(dateValue).slice(0, 10)}T23:59:59`);

  if (Number.isNaN(rawDate.getTime())) return false;

  const parsed = new Date(
    rawDate.getFullYear(),
    rawDate.getMonth(),
    rawDate.getDate(),
    23,
    59,
    59,
    999
  );

  return parsed.getTime() < Date.now();
}

function formatExpirationDate(dateValue) {
  if (!dateValue) return 'Fecha por confirmar';

  const parsed =
    typeof dateValue?.toDate === 'function'
      ? dateValue.toDate()
      : dateValue instanceof Date
        ? dateValue
        : new Date(`${String(dateValue).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return String(dateValue);

  return parsed.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getEffectiveStatus(product) {
  if (product?.estadoPublicacion === 'RETIRADO') {
    return 'RETIRADO';
  }

  if (product?.estadoPublicacion === 'VENCIDO' || isExpiredByDate(product?.fechaVencimiento)) {
    return 'VENCIDO';
  }

  return product?.estadoPublicacion || 'SIN_ESTADO';
}

function getPublicationStatusTone(status) {
  if (status === 'DISPONIBLE') return { background: '#e8f7ee', color: '#15803d' };
  if (status === 'AGOTADO') return { background: '#fff6e8', color: '#b45309' };
  if (status === 'VENCIDO' || status === 'RETIRADO') {
    return { background: '#fdecec', color: '#c62828' };
  }

  return { background: '#f4f5f7', color: '#374151' };
}

export default function ExpiringProductsPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const result = await getExpiringProducts();
      setProducts(result);
      setFiltered(result);
    } catch (err) {
      setError('No fue posible cargar los productos publicados.');
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
      item.nombreProductoSnapshot?.toLowerCase().includes(text)
    );

    setFiltered(result);
  }, [search, products]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h1>Productos próximos a vencer</h1>
          <p style={styles.subtitle}>
            Gestiona el catálogo visible para los clientes.
          </p>
        </div>

        <Link to="/admin/expiring/select" style={styles.primaryBtn}>
          + Publicar producto
        </Link>
      </div>

      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Buscar producto publicado"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      {loading && <div style={styles.loadingCard}>Cargando publicaciones activas...</div>}
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
            <div style={styles.empty}>No hay productos publicados.</div>
          ) : (
            filtered.map((product) => {
              const publicationStatus = getEffectiveStatus(product);

              return (
                <article key={product.id} style={styles.card}>
                  <div style={styles.imageWrap}>
                    {product.imagenUrl ? (
                      <img
                        src={product.imagenUrl}
                        alt={product.nombreProductoSnapshot}
                        style={styles.image}
                      />
                    ) : (
                      <div style={styles.placeholder}>Sin imagen</div>
                    )}
                  </div>

                  <div style={styles.content}>
                    <h3 style={styles.title}>{product.nombreProductoSnapshot}</h3>
                    <p style={styles.meta}>{product.categoriaSnapshot}</p>

                    <div style={styles.infoBlock}>
                      <p>
                        <b>Precio base:</b>{' '}
                        ${Number(product.precioBaseSnapshot || 0).toLocaleString('es-CO')}
                      </p>
                      <p>
                        <b>Precio especial:</b>{' '}
                        ${Number(product.precioEspecial || 0).toLocaleString('es-CO')}
                      </p>
                      <p><b>Cantidad disponible:</b> {product.cantidadDisponible}</p>
                      <p><b>Vence:</b> {formatExpirationDate(product.fechaVencimiento)}</p>
                    </div>

                    <div style={styles.row}>
                      <span
                        style={{
                          ...styles.status,
                          ...getPublicationStatusTone(publicationStatus),
                        }}
                      >
                        {publicationStatus}
                      </span>
                      <Link
                        to={`/admin/expiring/edit/${product.id}`}
                        style={styles.secondaryBtn}
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
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
  title: {
    marginBottom: '0.35rem',
  },
  meta: {
    color: '#6b7280',
    marginBottom: '0.7rem',
  },
  infoBlock: {
    fontSize: '0.95rem',
    color: '#374151',
    display: 'grid',
    gap: '0.3rem',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: '1rem',
    gap: '1rem',
  },
  status: {
    padding: '0.35rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: '600',
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
