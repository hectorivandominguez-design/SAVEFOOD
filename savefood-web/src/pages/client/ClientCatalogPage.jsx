import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getVisibleExpiringProducts } from '../../services/client/clientCatalogService';

function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function formatDate(dateValue) {
  if (!dateValue) return 'Fecha por confirmar';

  const parsed =
    typeof dateValue?.toDate === 'function'
      ? dateValue.toDate()
      : dateValue instanceof Date
        ? dateValue
        : new Date(`${String(dateValue).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return String(dateValue);
  }

  return parsed.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function calculateDiscount(basePrice, specialPrice) {
  const base = Number(basePrice || 0);
  const special = Number(specialPrice || 0);

  if (!base || special >= base) return 0;

  return Math.round(((base - special) / base) * 100);
}

export default function ClientCatalogPage() {
  const { pathname } = useLocation();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);
  const detailBasePath = pathname.startsWith('/client') ? '/client/catalog' : '/catalog';

  const categories = useMemo(() => {
    const unique = new Set(products.map((item) => item.categoriaSnapshot));
    return [...unique].filter(Boolean);
  }, [products]);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);

      try {
        const data = await getVisibleExpiringProducts();
        setProducts(data);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const text = search.trim().toLowerCase();
      result = result.filter((item) =>
        item.nombreProductoSnapshot?.toLowerCase().includes(text)
      );
    }

    if (category) {
      result = result.filter((item) => item.categoriaSnapshot === category);
    }

    if (sortBy === 'priceAsc') {
      result.sort((a, b) => Number(a.precioEspecial) - Number(b.precioEspecial));
    }

    if (sortBy === 'priceDesc') {
      result.sort((a, b) => Number(b.precioEspecial) - Number(a.precioEspecial));
    }

    if (sortBy === 'expiryAsc') {
      result.sort(
        (a, b) => {
          const left =
            typeof a.fechaVencimiento?.toDate === 'function'
              ? a.fechaVencimiento.toDate()
              : new Date(`${String(a.fechaVencimiento).slice(0, 10)}T00:00:00`);
          const right =
            typeof b.fechaVencimiento?.toDate === 'function'
              ? b.fechaVencimiento.toDate()
              : new Date(`${String(b.fechaVencimiento).slice(0, 10)}T00:00:00`);

          return left - right;
        }
      );
    }

    return result;
  }, [products, search, category, sortBy]);

  return (
    <div className="sf-publicPage">
      <section className="sf-catalogHero">
        <div className="sf-sectionInner sf-catalogHeroInner">
          <div>
            <span className="sf-sectionEyebrow">Catálogo público</span>
            <h1>Productos próximos a vencer con descuento y retiro en tienda</h1>
            <p>
              Encuentra oportunidades reales de compra, con información más clara,
              mejor jerarquía visual y acceso directo al detalle del producto.
            </p>
          </div>

          <div className="sf-catalogHeroStats">
            <div className="sf-statCard sf-statCardLight">
              <strong>{products.length}</strong>
              <span>productos visibles</span>
            </div>
            <div className="sf-statCard sf-statCardLight">
              <strong>{categories.length}</strong>
              <span>categorías activas</span>
            </div>
          </div>
        </div>
      </section>

      <section className="sf-section">
        <div className="sf-sectionInner">
          <div className="sf-catalogFilterBar">
            <input
              type="text"
              placeholder="Buscar producto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sf-filterInput"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="sf-filterInput"
            >
              <option value="">Todas las categorías</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sf-filterInput"
            >
              <option value="recent">Más recientes</option>
              <option value="priceAsc">Precio menor a mayor</option>
              <option value="priceDesc">Precio mayor a menor</option>
              <option value="expiryAsc">Próximos a vencer primero</option>
            </select>
          </div>

          {loading ? (
            <div className="sf-catalogGrid">
              {Array.from({ length: 6 }).map((_, index) => (
                <article
                  key={index}
                  className="sf-catalogCard sf-featuredCardSkeleton"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="sf-emptyState">
              No se encontraron productos con esos filtros.
            </div>
          ) : (
            <div className="sf-catalogGrid">
              {filteredProducts.map((product) => (
                <article key={product.id} className="sf-catalogCard">
                  <div className="sf-catalogCardMedia">
                    {product.imagenUrl ? (
                      <img
                        src={product.imagenUrl}
                        alt={product.nombreProductoSnapshot}
                        className="sf-catalogCardImage"
                      />
                    ) : (
                      <div className="sf-featuredPlaceholder">Sin imagen</div>
                    )}

                    <span className="sf-statusBadge">{product.estadoPublicacion}</span>
                  </div>

                  <div className="sf-catalogCardBody">
                    <div className="sf-featuredTopRow">
                      <span className="sf-cardCategory">
                        {product.categoriaSnapshot || 'Oferta especial'}
                      </span>
                      <span className="sf-cardSavings">
                        Ahorra{' '}
                        {calculateDiscount(
                          product.precioBaseSnapshot,
                          product.precioEspecial
                        )}
                        %
                      </span>
                    </div>

                    <h3>{product.nombreProductoSnapshot}</h3>

                    <div className="sf-priceStack">
                      <span className="sf-basePrice">
                        {formatPrice(product.precioBaseSnapshot)}
                      </span>
                      <strong className="sf-specialPrice">
                        {formatPrice(product.precioEspecial)}
                      </strong>
                    </div>

                    <div className="sf-catalogMetaList">
                      <span>Vence: {formatDate(product.fechaVencimiento)}</span>
                      <span>Recoge en: {product.sede || 'Sede Bosa'}</span>
                    </div>

                    <Link to={`${detailBasePath}/${product.id}`} className="sf-productAction">
                      Ver detalle
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
