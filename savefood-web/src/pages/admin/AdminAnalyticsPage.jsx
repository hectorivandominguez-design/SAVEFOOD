import { useEffect, useMemo, useState } from 'react';
import { getAnalyticsSummary } from '../../services/analytics/analyticsService';
import { getAdminFeedbackReviews } from '../../services/feedback/feedbackService';
import '../../styles/App.css';

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function getMaxValue(items, key) {
  return items.reduce((max, item) => {
    const value = Number(item?.[key] || 0);
    return value > max ? value : max;
  }, 0);
}

function buildTrendPath(items, key, width = 520, height = 220) {
  if (!items.length) return '';

  const max = Math.max(getMaxValue(items, key), 1);
  const stepX = items.length > 1 ? width / (items.length - 1) : width / 2;

  return items
    .map((item, index) => {
      const x = items.length > 1 ? index * stepX : width / 2;
      const ratio = Number(item?.[key] || 0) / max;
      const y = height - ratio * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function buildTrendArea(items, key, width = 520, height = 220) {
  const linePath = buildTrendPath(items, key, width, height);

  if (!linePath) return '';

  return `${linePath} L ${width} ${height} L 0 ${height} Z`;
}

function getDonutStyle(items) {
  const total = items.reduce((acc, item) => acc + Number(item.value || 0), 0);

  if (!total) {
    return {
      background: 'conic-gradient(#ececec 0deg 360deg)',
    };
  }

  let currentAngle = 0;
  const segments = items.map((item) => {
    const angle = (Number(item.value || 0) / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;
    return `${item.color} ${start}deg ${end}deg`;
  });

  return {
    background: `conic-gradient(${segments.join(', ')})`,
  };
}

function renderStars(value) {
  return Array.from({ length: 5 }, (_, index) => index < value);
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAnalytics() {
    setLoading(true);
    setError('');

    try {
      const [analyticsResult, feedbackResult] = await Promise.all([
        getAnalyticsSummary(),
        getAdminFeedbackReviews(12),
      ]);

      setData(analyticsResult);
      setFeedbackItems(feedbackResult);
    } catch {
      setError('No fue posible cargar la analítica del sistema.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const summary = data?.summary;
  const topProducts = data?.topProducts || [];
  const dailySeries = data?.dailySeries || [];

  const statusItems = useMemo(() => {
    if (!summary) return [];

    return [
      { label: 'Pagados', value: Number(summary.pedidosPagados || 0), color: '#1d4ed8' },
      { label: 'Listos para recoger', value: Number(summary.pedidosListos || 0), color: '#b45309' },
      { label: 'Entregados', value: Number(summary.pedidosEntregados || 0), color: '#15803d' },
      { label: 'Cancelados', value: Number(summary.pedidosCancelados || 0), color: '#c62828' },
    ];
  }, [summary]);

  const topProduct = topProducts[0] || null;
  const salesTrendPath = useMemo(() => buildTrendPath(dailySeries, 'totalVentas'), [dailySeries]);
  const salesTrendArea = useMemo(() => buildTrendArea(dailySeries, 'totalVentas'), [dailySeries]);
  const maxStatusValue = Math.max(getMaxValue(statusItems, 'value'), 1);
  const maxProductUnits = Math.max(getMaxValue(topProducts, 'unidadesVendidas'), 1);
  const totalValoraciones = feedbackItems.length;
  const promedioCalificacion = totalValoraciones
    ? (
      feedbackItems.reduce((accumulator, item) => accumulator + Number(item.calificacion || 0), 0)
      / totalValoraciones
    ).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="sf-clientSection">
        <div className="sf-clientInfoCard">Cargando reportes y métricas del sistema...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sf-clientSection">
        <div className="sf-clientInfoCard sf-clientInfoCard--error">
          <h1>Reportes y analítica</h1>
          <p className="sf-clientSectionSubtitle">
            Métricas generales del comportamiento del sistema SAVE FOOD.
          </p>
          <p className="sf-feedbackError">{error}</p>
          <button className="sf-btn sf-btnDark" onClick={loadAnalytics}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="sf-clientSection">
        <div className="sf-emptyState">No hay información analítica disponible.</div>
      </div>
    );
  }

  return (
    <div className="sf-clientSection">
      <section className="sf-analyticsHero">
        <div className="sf-analyticsHeroCopy">
          <h1>Reportes y analítica</h1>
          <p className="sf-clientSectionSubtitle">
            Este módulo consolida ventas, pedidos, productos próximos a vencer y salida comercial
            a partir de compras reales registradas en el sistema.
          </p>
        </div>

        <div className="sf-analyticsHeroHighlights">
          <article className="sf-analyticsHighlight">
            <span>Ticket promedio</span>
            <strong>{formatCurrency(summary.ticketPromedio)}</strong>
          </article>
          <article className="sf-analyticsHighlight">
            <span>Productos activos</span>
            <strong>{summary.productosActivos}</strong>
          </article>
          <article className="sf-analyticsHighlight">
            <span>Pedidos con venta</span>
            <strong>{summary.pedidosConVenta}</strong>
          </article>
          <article className="sf-analyticsHighlight">
            <span>Promedio de calificación</span>
            <strong>{promedioCalificacion} / 5</strong>
          </article>
        </div>
      </section>

      <section className="sf-analyticsMetricGrid">
        <MetricCard title="Total pedidos" value={summary.totalPedidos} tone="neutral" />
        <MetricCard title="Pedidos pagados" value={summary.pedidosPagados} tone="info" />
        <MetricCard title="Listos para recoger" value={summary.pedidosListos} tone="warning" />
        <MetricCard title="Pedidos entregados" value={summary.pedidosEntregados} tone="success" />
        <MetricCard title="Pedidos cancelados" value={summary.pedidosCancelados} tone="danger" />
        <MetricCard title="Total ventas" value={formatCurrency(summary.totalVentas)} tone="danger" />
        <MetricCard title="Productos publicados" value={summary.productosPublicados} tone="neutral" />
        <MetricCard title="Productos activos" value={summary.productosActivos} tone="success" />
        <MetricCard title="Productos vendidos" value={summary.productosVendidos} tone="neutral" />
        <MetricCard title="Productos vencidos" value={summary.productosVencidos} tone="warning" />
        <MetricCard title="Ahorro estimado" value={formatCurrency(summary.ahorroEstimado)} tone="success" />
        <MetricCard title="Valoraciones registradas" value={totalValoraciones} tone="info" />
        <MetricCard title="Satisfacción promedio" value={`${promedioCalificacion} / 5`} tone="success" />
      </section>

      <section className="sf-analyticsGrid">
        <article className="sf-analyticsCard sf-analyticsCard--wide">
          <div className="sf-analyticsCardHead">
            <div>
              <h2>Tendencia de ventas recientes</h2>
              <p>Últimos días con movimiento comercial validado por pedidos del sistema.</p>
            </div>
            <span className="sf-detailMetaPill">{dailySeries.length || 0} días</span>
          </div>

          {dailySeries.length === 0 ? (
            <div className="sf-emptyState">Aún no hay ventas registradas para construir la tendencia.</div>
          ) : (
            <div className="sf-analyticsTrend">
              <div className="sf-analyticsTrendChart">
                <svg viewBox="0 0 520 220" className="sf-analyticsTrendSvg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sfSalesArea" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(198, 40, 40, 0.32)" />
                      <stop offset="100%" stopColor="rgba(198, 40, 40, 0.04)" />
                    </linearGradient>
                  </defs>
                  <path d={salesTrendArea} fill="url(#sfSalesArea)" />
                  <path d={salesTrendPath} className="sf-analyticsTrendLine" />
                </svg>
              </div>

              <div className="sf-analyticsTrendLabels">
                {dailySeries.map((item) => (
                  <div key={item.dateKey} className="sf-analyticsTrendLabel">
                    <strong>{item.label}</strong>
                    <span>{formatCurrency(item.totalVentas)}</span>
                    <small>{item.pedidosConVenta} pedido(s) con venta</small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        <article className="sf-analyticsCard">
          <div className="sf-analyticsCardHead">
            <div>
              <h2>Estado operativo</h2>
              <p>Distribución visual del ciclo de los pedidos administrados.</p>
            </div>
          </div>

          <div className="sf-analyticsBars">
            {statusItems.map((item) => {
              const width = `${(Number(item.value || 0) / maxStatusValue) * 100}%`;

              return (
                <div key={item.label} className="sf-analyticsBarRow">
                  <div className="sf-analyticsBarMeta">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="sf-analyticsBarTrack">
                    <div
                      className="sf-analyticsBarFill"
                      style={{ width, background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="sf-analyticsCard">
          <div className="sf-analyticsCardHead">
            <div>
              <h2>Composición de pedidos</h2>
              <p>Lectura rápida del balance entre conversión, entrega y cancelación.</p>
            </div>
          </div>

          <div className="sf-analyticsDonutWrap">
            <div className="sf-analyticsDonut" style={getDonutStyle(statusItems)}>
              <div className="sf-analyticsDonutCenter">
                <strong>{summary.totalPedidos}</strong>
                <span>pedidos</span>
              </div>
            </div>

            <div className="sf-analyticsLegend">
              {statusItems.map((item) => (
                <div key={item.label} className="sf-analyticsLegendItem">
                  <span className="sf-analyticsLegendDot" style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="sf-analyticsCard">
          <div className="sf-analyticsCardHead">
            <div>
              <h2>Producto líder</h2>
              <p>Referencia comercial con mejor salida según compras registradas.</p>
            </div>
          </div>

          {topProduct ? (
            <div className="sf-analyticsLeadProduct">
              <span className="sf-cardSavings">Top comercial</span>
              <h3>{topProduct.nombreProducto}</h3>
              <div className="sf-analyticsLeadStats">
                <div className="sf-orderDetailMetaCard">
                  <span>Unidades vendidas</span>
                  <strong>{topProduct.unidadesVendidas}</strong>
                </div>
                <div className="sf-orderDetailMetaCard">
                  <span>Ingresos generados</span>
                  <strong>{formatCurrency(topProduct.ingresosGenerados)}</strong>
                </div>
                <div className="sf-orderDetailMetaCard">
                  <span>Ahorro comunicado</span>
                  <strong>{formatCurrency(topProduct.ahorroEstimado)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="sf-emptyState">Todavía no hay productos vendidos para destacar.</div>
          )}
        </article>
      </section>

      <section className="sf-analyticsCard">
        <div className="sf-analyticsCardHead">
          <div>
            <h2>Productos con mayor salida</h2>
            <p>
              Ranking basado en unidades vendidas e ingresos generados a partir de pedidos válidos.
            </p>
          </div>
        </div>

        {topProducts.length === 0 ? (
          <div className="sf-emptyState">No hay ventas registradas para mostrar este ranking.</div>
        ) : (
          <>
            <div className="sf-analyticsProductBars">
              {topProducts.map((item) => {
                const width = `${(Number(item.unidadesVendidas || 0) / maxProductUnits) * 100}%`;

                return (
                  <div key={item.analyticsProductId || item.nombreProducto} className="sf-analyticsProductRow">
                    <div className="sf-analyticsProductMeta">
                      <div>
                        <strong>{item.nombreProducto}</strong>
                        <span>{formatCurrency(item.ingresosGenerados)} en ingresos</span>
                      </div>
                      <span className="sf-detailMetaPill">{item.unidadesVendidas} unid.</span>
                    </div>
                    <div className="sf-analyticsBarTrack">
                      <div
                        className="sf-analyticsBarFill sf-analyticsBarFill--gradient"
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sf-analyticsTableWrap">
              <table className="sf-analyticsTable">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Unidades vendidas</th>
                    <th>Ingresos generados</th>
                    <th>Ahorro estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((item) => (
                    <tr key={item.analyticsProductId || item.nombreProducto}>
                      <td>{item.nombreProducto}</td>
                      <td>{item.unidadesVendidas}</td>
                      <td>{formatCurrency(item.ingresosGenerados)}</td>
                      <td>{formatCurrency(item.ahorroEstimado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="sf-analyticsCard">
        <div className="sf-analyticsCardHead">
          <div>
            <h2>Feedback y valoración del prototipo</h2>
            <p>
              La información registrada podrá ser consultada posteriormente por el administrador
              como apoyo para el análisis del funcionamiento del prototipo y la percepción del usuario frente al sistema.
            </p>
          </div>
          <span className="sf-detailMetaPill">{totalValoraciones} valoración(es)</span>
        </div>

        {feedbackItems.length === 0 ? (
          <div className="sf-emptyState">Aún no hay valoraciones registradas por los clientes.</div>
        ) : (
          <div className="sf-analyticsFeedbackList">
            {feedbackItems.map((feedback) => (
              <article key={feedback.feedbackId || feedback.id} className="sf-analyticsFeedbackCard">
                <div className="sf-analyticsFeedbackHead">
                  <div>
                    <strong>{feedback.clientName}</strong>
                    <span>{feedback.clientEmail || 'Sin correo visible'}</span>
                  </div>
                  <span className="sf-detailMetaPill">Pedido {feedback.orderNumber}</span>
                </div>

                <div className="sf-analyticsFeedbackStars" aria-label={`${feedback.calificacion} de 5 estrellas`}>
                  {renderStars(Number(feedback.calificacion || 0)).map((filled, index) => (
                    <span key={`${feedback.id}-star-${index}`} className={filled ? 'sf-starFilled' : 'sf-starEmpty'}>
                      ★
                    </span>
                  ))}
                  <strong>{Number(feedback.calificacion || 0).toFixed(1)} / 5</strong>
                </div>

                <div className="sf-analyticsFeedbackMeta">
                  <span>Estado del pedido: {feedback.orderStatus || 'Sin estado'}</span>
                  <span>Total: {formatCurrency(feedback.orderTotal)}</span>
                </div>

                <div className="sf-analyticsFeedbackProducts">
                  {(feedback.orderItems || []).map((item) => (
                    <span key={item.id} className="sf-detailMetaPill">
                      {item.nombreProductoSnapshot} · {item.cantidad}
                    </span>
                  ))}
                </div>

                <p className="sf-analyticsFeedbackComment">
                  {feedback.comentario?.trim() || 'El cliente no dejó comentario adicional.'}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ title, value, tone }) {
  return (
    <article className={`sf-analyticsMetricCard sf-analyticsMetricCard--${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}
