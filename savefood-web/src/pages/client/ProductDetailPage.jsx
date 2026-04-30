import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getVisibleExpiringProductById } from '../../services/client/clientCatalogService';
import { useCart } from '../../app/router/Provider/CartProvider';
import { useAuth } from '../../app/router/Provider/useAuth';

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
    month: 'long',
    year: 'numeric',
  });
}

function calculateDiscount(basePrice, specialPrice) {
  const base = Number(basePrice || 0);
  const special = Number(specialPrice || 0);

  if (!base || special >= base) return 0;

  return Math.round(((base - special) / base) * 100);
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const isClientView = pathname.startsWith('/client/');
  const canPurchase = isClientView && Boolean(currentUser);
  const catalogPath = isClientView ? '/client/catalog' : '/catalog';

  const [product, setProduct] = useState(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError('');

      try {
        const data = await getVisibleExpiringProductById(id);
        setProduct(data);
      } catch {
        setError('No fue posible cargar el detalle del producto.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProduct();
    }
  }, [id]);

  const discount = useMemo(() => {
    if (!product) return 0;

    return calculateDiscount(product.precioBaseSnapshot, product.precioEspecial);
  }, [product]);

  const productDescription = useMemo(() => {
    if (!product) return '';

    return (
      product.descripcionSnapshot ||
      product.descripcion ||
      'Descripción del producto no disponible en esta publicación.'
    );
  }, [product]);

  const availableStock = Math.max(Number(product?.cantidadDisponible || 0), 0);

  useEffect(() => {
    setQuantityInput('1');
  }, [id, availableStock]);

  function normalizeQuantity(rawValue, { fallbackToOne = true } = {}) {
    const trimmedValue = String(rawValue ?? '').trim();

    if (!trimmedValue) {
      return fallbackToOne ? 1 : 0;
    }

    const parsedValue = Number(trimmedValue);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return 1;
    }

    if (!availableStock) {
      return 1;
    }

    return Math.min(parsedValue, availableStock);
  }

  function handleQuantityChange(rawValue) {
    if (/^\d*$/.test(rawValue)) {
      setMessage('');
      setQuantityInput(rawValue);
    }
  }

  function handleQuantityBlur() {
    const normalized = normalizeQuantity(quantityInput);
    setQuantityInput(String(normalized));
  }

  function changeQuantity(delta) {
    const currentQuantity = normalizeQuantity(quantityInput);
    const nextQuantity = normalizeQuantity(currentQuantity + delta);
    setMessage('');
    setQuantityInput(String(nextQuantity));
  }

  function handleAddToCart() {
    if (!product) return;

    if (!canPurchase) {
      navigate('/login');
      return;
    }

    const requestedQuantity = normalizeQuantity(quantityInput);

    if (availableStock <= 0 || product.estadoPublicacion !== 'DISPONIBLE') {
      setMessage('Este producto ya no tiene unidades disponibles para agregar.');
      return;
    }

    addToCart(product, requestedQuantity);
    setQuantityInput(String(requestedQuantity));
    setMessage('Producto agregado al carrito.');
  }

  if (loading) {
    return (
      <div className="sf-publicPage">
        <section className="sf-section">
          <div className="sf-sectionInner">
            <div className="sf-detailCard sf-featuredCardSkeleton" />
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sf-publicPage">
        <section className="sf-section">
          <div className="sf-sectionInner">
            <p className="sf-feedbackError">{error}</p>
          </div>
        </section>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="sf-publicPage">
        <section className="sf-section">
          <div className="sf-sectionInner">
            <div className="sf-emptyState">Producto no encontrado.</div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="sf-publicPage">
      <section className="sf-section">
        <div className="sf-sectionInner">
          <Link to={catalogPath} className="sf-backLink">
            Volver al catálogo
          </Link>

          <div className="sf-detailCard">
            <div className="sf-detailMedia">
              {product.imagenUrl ? (
                <img
                  src={product.imagenUrl}
                  alt={product.nombreProductoSnapshot}
                  className="sf-detailImage"
                />
              ) : (
                <div className="sf-featuredPlaceholder">Sin imagen</div>
              )}
            </div>

            <div className="sf-detailContent">
              <div className="sf-featuredTopRow">
                <span className="sf-cardCategory">
                  {product.categoriaSnapshot || 'Oferta especial'}
                </span>
                <span className="sf-cardSavings">Ahorra {discount}%</span>
              </div>

              <h1>{product.nombreProductoSnapshot}</h1>
              <p className="sf-detailLead">{productDescription}</p>
              <div className="sf-detailMetaBar">
                <span className="sf-detailMetaPill">Retiro en tienda</span>
                <span className="sf-detailMetaPill">Sede {product.sede || 'Bosa'}</span>
                <span className="sf-detailMetaText">
                  Precio, disponibilidad y vencimiento actualizados para una decisión rápida.
                </span>
              </div>

              <div className="sf-priceStack sf-priceStackLarge">
                <div className="sf-priceLine">
                  <span className="sf-basePrice">
                    {formatPrice(product.precioBaseSnapshot)}
                  </span>
                  <span className="sf-currencyBadge sf-currencyBadgeMuted">COP</span>
                </div>
                <div className="sf-priceLine">
                  <strong className="sf-specialPrice">
                    {formatPrice(product.precioEspecial)}
                  </strong>
                  <span className="sf-currencyBadge">COP</span>
                </div>
              </div>

              <div className="sf-detailFacts">
                <div className="sf-detailFact">
                  <span>Vence</span>
                  <strong>{formatDate(product.fechaVencimiento)}</strong>
                </div>
                <div className="sf-detailFact">
                  <span>Disponibles</span>
                  <strong>{product.cantidadDisponible}</strong>
                </div>
                <div className="sf-detailFact">
                  <span>Sede</span>
                  <strong>{product.sede || 'Bosa'}</strong>
                </div>
                <div className="sf-detailFact">
                  <span>Estado</span>
                  <strong>{product.estadoPublicacion}</strong>
                </div>
              </div>

              {canPurchase ? (
                <div className="sf-detailActions">
                  <div className="sf-qtyStepper" aria-label="Selector de cantidad">
                    <button
                      type="button"
                      className="sf-qtyStepperButton"
                      onClick={() => changeQuantity(-1)}
                      disabled={normalizeQuantity(quantityInput) <= 1}
                      aria-label="Disminuir cantidad"
                    >
                      -
                    </button>

                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantityInput}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      onBlur={handleQuantityBlur}
                      className="sf-qtyInput sf-qtyInput--stepper"
                      aria-label="Cantidad a agregar"
                    />

                    <button
                      type="button"
                      className="sf-qtyStepperButton"
                      onClick={() => changeQuantity(1)}
                      disabled={normalizeQuantity(quantityInput) >= availableStock}
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="sf-btn sf-btnSolid"
                    disabled={product.estadoPublicacion !== 'DISPONIBLE' || availableStock <= 0}
                  >
                    Agregar al carrito
                  </button>

                  <button
                    onClick={() => navigate('/client/cart')}
                    className="sf-btn sf-btnDark"
                  >
                    Ir al carrito
                  </button>
                </div>
              ) : (
                <div className="sf-detailGuestBox">
                  {currentUser && !isClientView ? (
                    <>
                      <p>
                        Ya tienes sesión iniciada. Abre este producto dentro del catálogo de cliente
                        para continuar con el carrito y la compra.
                      </p>
                      <div className="sf-detailActions">
                        <Link to={`/client/catalog/${product.id}`} className="sf-btn sf-btnSolid">
                          Ver como cliente
                        </Link>
                        <Link to="/client/catalog" className="sf-btn sf-btnGhost">
                          Ir al catálogo cliente
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        Inicia sesión para agregar este producto al carrito y continuar con la compra.
                      </p>
                      <div className="sf-detailActions">
                        <Link to="/login" className="sf-btn sf-btnSolid">
                          Ingresar
                        </Link>
                        <Link to="/register" className="sf-btn sf-btnGhost">
                          Crear cuenta
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}

              {message && <p className="sf-feedbackSuccess">{message}</p>}
            </div>
          </div>

          <div className="sf-detailInfoGrid">
            <article className="sf-valueCard">
              <h3>Compra con más claridad</h3>
              <p>
                El detalle muestra de forma directa el ahorro, la disponibilidad
                y el punto de retiro para reducir dudas al momento de decidir.
              </p>
            </article>

            <article className="sf-valueCard">
              <h3>Retiro práctico en tienda</h3>
              <p>
                El flujo está pensado para una operación simple: compras en línea
                y recoges en la sede Bosa sin pasos innecesarios.
              </p>
            </article>

            <article className="sf-valueCard">
              <h3>Oferta con propósito</h3>
              <p>
                Al comprar productos próximos a vencer, ayudas a reducir pérdidas
                y a comunicar una propuesta más responsable al usuario final.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
