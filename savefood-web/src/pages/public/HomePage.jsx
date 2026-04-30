import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVisibleExpiringProducts } from '../../services/client/clientCatalogService';
import valentinaPhoto from '../../assets/Valentina R..png';
import andresPhoto from '../../assets/Andrés M..png';
import lauraPhoto from '../../assets/Laura C..png';
import '../../styles/App.css';

const testimonials = [
  {
    name: 'Valentina R.',
    role: 'Cliente frecuente',
    image: valentinaPhoto,
    rating: 5,
    text: 'La experiencia es rápida, clara y me ayuda a ahorrar sin sacrificar calidad. Ya reviso SAVE FOOD antes de pedir.',
  },
  {
    name: 'Andrés M.',
    role: 'Compra para su familia',
    image: andresPhoto,
    rating: 5,
    text: 'Me gustó poder ver qué productos tenían descuento y recogerlos sin filas largas. Se siente ordenado y confiable.',
  },
  {
    name: 'Laura C.',
    role: 'Compra de fin de semana',
    image: lauraPhoto,
    rating: 5,
    text: 'La app transmite seguridad y el proceso es muy simple. Además, sabes que estás ayudando a reducir desperdicio.',
  },
];

const valueCards = [
  {
    title: 'Selección curada cada día',
    description:
      'Mostramos solo productos próximos a vencer que aún están aptos para la venta y la recolección en tienda.',
  },
  {
    title: 'Compra simple y trazable',
    description:
      'Desde el producto hasta el pedido y el pago, todo queda registrado para dar transparencia y control.',
  },
  {
    title: 'Ahorro con impacto real',
    description:
      'Tus compras ayudan a darle salida a inventario útil y a disminuir pérdidas por desperdicio de alimentos.',
  },
];

const flowSteps = [
  'Explora las ofertas destacadas del día y revisa precios especiales.',
  'Abre el detalle del producto, valida disponibilidad y agrega al carrito.',
  'Confirma tu pedido, paga en línea y recibe el estado de tu compra.',
  'Recoge en tienda en la sede Bosa de forma rápida y sin complicaciones.',
];

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

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const featuredProducts = useMemo(() => products.slice(0, 3), [products]);

  const highlightedProduct = useMemo(() => {
    if (!products.length) return null;

    return [...products].sort((left, right) => {
      const leftDiscount = calculateDiscount(left.precioBaseSnapshot, left.precioEspecial);
      const rightDiscount = calculateDiscount(right.precioBaseSnapshot, right.precioEspecial);
      return rightDiscount - leftDiscount;
    })[0];
  }, [products]);

  const categoryCount = useMemo(() => {
    return new Set(products.map((item) => item.categoriaSnapshot).filter(Boolean)).size;
  }, [products]);

  const maxDiscount = useMemo(() => {
    return products.reduce((highest, item) => {
      return Math.max(highest, calculateDiscount(item.precioBaseSnapshot, item.precioEspecial));
    }, 0);
  }, [products]);

  return (
    <div className="sf-home">
      <section id="inicio" className="sf-heroSection">
        <div className="sf-heroOverlay" />

        <div className="sf-heroContainer">
          <div className="sf-heroText">
            <span className="sf-eyebrow">Compra inteligente, desperdicio menor</span>

            <h1>Compra con descuento y reduce el desperdicio</h1>

            <p>
              SAVE FOOD conecta a clientes con oportunidades de compra responsables en
              <strong> Salchipapería D.C. sede Bosa</strong>, con retiro en tienda,
              precios especiales y un flujo de compra mucho más claro.
            </p>

            <div className="sf-heroActions">
              <Link className="sf-btn sf-btnSolid" to="/catalog">
                Ver ofertas
              </Link>
              <a className="sf-btn sf-btnOutline" href="#como-funciona">
                Cómo funciona
              </a>
            </div>

            <div className="sf-statStrip">
              <div className="sf-statCard">
                <strong>{products.length || 0}</strong>
                <span>ofertas visibles hoy</span>
              </div>
              <div className="sf-statCard">
                <strong>{maxDiscount || 0}%</strong>
                <span>descuento máximo actual</span>
              </div>
              <div className="sf-statCard">
                <strong>{categoryCount || 0}</strong>
                <span>categorías disponibles</span>
              </div>
            </div>
          </div>

          <aside className="sf-heroCard sf-heroCard--glass">
            <div className="sf-showcaseHeader">
              <span className="sf-showcaseTag">Oferta destacada</span>
              <span className="sf-showcaseMeta">Retiro en tienda · Bosa</span>
            </div>

            {loading ? (
              <div className="sf-showcaseSkeleton" />
            ) : highlightedProduct ? (
              <>
                <div className="sf-showcaseImageWrap sf-showcaseImageWrap--hero">
                  {highlightedProduct.imagenUrl ? (
                    <img
                      src={highlightedProduct.imagenUrl}
                      alt={highlightedProduct.nombreProductoSnapshot}
                      className="sf-showcaseImage"
                    />
                  ) : (
                    <div className="sf-showcasePlaceholder">Oferta destacada</div>
                  )}
                </div>

                <div className="sf-showcaseBody">
                  <h3>{highlightedProduct.nombreProductoSnapshot}</h3>
                  <p>
                    {highlightedProduct.categoriaSnapshot || 'Producto destacado'} · vence {formatDate(highlightedProduct.fechaVencimiento)}
                  </p>

                  <div className="sf-showcaseDetailGrid">
                    <div className="sf-showcaseDetailItem">
                      <span className="sf-labelMuted">Precio especial</span>
                      <strong>{formatPrice(highlightedProduct.precioEspecial)}</strong>
                    </div>
                    <div className="sf-showcaseDetailItem">
                      <span className="sf-labelMuted">Ahorro</span>
                      <strong>-{calculateDiscount(highlightedProduct.precioBaseSnapshot, highlightedProduct.precioEspecial)}%</strong>
                    </div>
                  </div>

                  <div className="sf-showcaseActions">
                    <Link className="sf-inlineAction" to={`/catalog/${highlightedProduct.id}`}>
                      Ver producto
                    </Link>
                    <span className="sf-discountBadge">
                      {highlightedProduct.estadoPublicacion === 'AGOTADO' ? 'Últimas unidades' : 'Disponible'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="sf-emptyState">No hay ofertas disponibles en este momento.</div>
            )}
          </aside>
        </div>
      </section>

      <section className="sf-trustSection">
        <div className="sf-sectionInner sf-trustGrid">
          <div className="sf-trustChip">Compra en línea y recoge en tienda</div>
          <div className="sf-trustChip">Inventario controlado y trazabilidad</div>
          <div className="sf-trustChip">Pagos y estado del pedido centralizados</div>
          <div className="sf-trustChip">Experiencia pensada para reducir desperdicio</div>
        </div>
      </section>

      <section id="catalogo" className="sf-section">
        <div className="sf-sectionInner">
          <div className="sf-sectionHeadingRow">
            <div>
              <span className="sf-sectionEyebrow">Catálogo destacado</span>
              <h2>Tres oportunidades para comprar mejor hoy</h2>
              <p>
                Mostramos una selección breve y clara para que el usuario entienda
                rápido qué puede comprar, cuánto ahorra y cómo continuar.
              </p>
            </div>

            <Link className="sf-ghostAction" to="/catalog">
              Ver catálogo completo
            </Link>
          </div>

          <div className="sf-featuredGrid">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <article key={index} className="sf-featuredCard sf-featuredCardSkeleton" />
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => {
                const discount = calculateDiscount(product.precioBaseSnapshot, product.precioEspecial);

                return (
                  <article key={product.id} className="sf-featuredCard">
                    <div className="sf-featuredMedia">
                      {product.imagenUrl ? (
                        <img
                          src={product.imagenUrl}
                          alt={product.nombreProductoSnapshot}
                          className="sf-featuredImage"
                        />
                      ) : (
                        <div className="sf-featuredPlaceholder">Sin imagen</div>
                      )}

                      <span className="sf-statusBadge">
                        {product.estadoPublicacion === 'AGOTADO' ? 'Últimas unidades' : 'Disponible'}
                      </span>
                    </div>

                    <div className="sf-featuredBody">
                      <div className="sf-featuredTopRow">
                        <span className="sf-cardCategory">{product.categoriaSnapshot || 'Oferta especial'}</span>
                        <span className="sf-cardSavings">Ahorra {discount}%</span>
                      </div>

                      <h3>{product.nombreProductoSnapshot}</h3>
                      <p>
                        Disponible para retiro en sede Bosa. Fecha estimada de
                        vencimiento: {formatDate(product.fechaVencimiento)}.
                      </p>

                      <div className="sf-priceStack">
                        <span className="sf-basePrice">{formatPrice(product.precioBaseSnapshot)}</span>
                        <strong className="sf-specialPrice">{formatPrice(product.precioEspecial)}</strong>
                      </div>

                      <Link className="sf-productAction" to={`/catalog/${product.id}`}>
                        Ver producto
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="sf-emptyState">No hay ofertas disponibles en este momento.</div>
            )}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="sf-section sf-sectionFlow">
        <div className="sf-sectionInner">
          <div className="sf-sectionHeadingRow">
            <div>
              <span className="sf-sectionEyebrow">Experiencia de compra</span>
              <h2>Un flujo pensado para convertir y dar confianza</h2>
              <p>
                El recorrido del usuario debe sentirse corto, entendible y seguro
                desde la portada hasta la confirmación del pedido.
              </p>
            </div>
          </div>

          <div className="sf-flowGrid sf-flowGridPremium">
            {flowSteps.map((step, index) => (
              <article key={step} className="sf-flowCard">
                <span className="sf-flowNumber">0{index + 1}</span>
                <span className="sf-flowLabel">Paso {index + 1}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="impacto" className="sf-section sf-sectionImpact">
        <div className="sf-sectionInner">
          <div className="sf-sectionHeadingRow">
            <div>
              <span className="sf-sectionEyebrow">Impacto</span>
              <h2>Diseñada para vender mejor y comunicar propósito</h2>
              <p>
                No es solo una vitrina de productos. También transmite orden,
                impacto y profesionalismo para que la marca se vea confiable.
              </p>
            </div>
          </div>

          <div className="sf-valueGrid">
            {valueCards.map((card) => (
              <article key={card.title} className="sf-valueCard">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>

          <div className="sf-impactPanel sf-impactPanel--compact">
            <div className="sf-impactMetric">
              <strong>{products.length || 0}</strong>
              <span>productos visibles para rescate comercial</span>
            </div>
            <div className="sf-impactMetric">
              <strong>{maxDiscount || 0}%</strong>
              <span>ahorro máximo comunicado de forma clara</span>
            </div>
            <div className="sf-impactMetric">
              <strong>1 retiro</strong>
              <span>experiencia simple con sede y entrega bien definidas</span>
            </div>
          </div>
        </div>
      </section>

      <section id="resenas" className="sf-section sf-sectionAlt">
        <div className="sf-sectionInner">
          <div className="sf-sectionHeadingRow">
            <div>
              <span className="sf-sectionEyebrow">Reseñas</span>
              <h2>Experiencias que refuerzan la confianza</h2>
              <p>
                Una buena interfaz también debe estar acompañada de prueba social clara,
                humana y visualmente bien presentada.
              </p>
            </div>
          </div>

          <div className="sf-testimonialGrid sf-testimonialGrid--withPhotos">
            {testimonials.map((item) => (
              <article key={item.name} className="sf-testimonialCard sf-testimonialCard--rich">
                <div className="sf-testimonialHead">
                  <img src={item.image} alt={item.name} className="sf-testimonialAvatar" />
                  <div className="sf-testimonialAuthor">
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                  </div>
                </div>
                <div className="sf-testimonialStars" aria-label={`${item.rating} de 5 estrellas`}>
                  {Array.from({ length: item.rating }).map((_, index) => (
                    <span key={`${item.name}-${index}`}>★</span>
                  ))}
                </div>
                <p>“{item.text}”</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
