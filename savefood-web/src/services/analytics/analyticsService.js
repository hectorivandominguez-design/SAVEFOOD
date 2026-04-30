import {
  collection,
  getDocs,
  query,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const VALID_ORDER_STATUSES = ['PAGADO', 'LISTO_PARA_RECOGER', 'ENTREGADO'];

function buildEmptySummary() {
  return {
    totalPedidos: 0,
    pedidosPagados: 0,
    pedidosListos: 0,
    pedidosEntregados: 0,
    pedidosCancelados: 0,
    pedidosConVenta: 0,
    totalVentas: 0,
    ticketPromedio: 0,
    productosPublicados: 0,
    productosActivos: 0,
    productosVendidos: 0,
    productosVencidos: 0,
    ahorroEstimado: 0,
  };
}

function buildEmptyAnalyticsResponse() {
  return {
    summary: buildEmptySummary(),
    topProducts: [],
    dailySeries: [],
  };
}

function shouldFallbackToLiveData(error) {
  return (
    error?.code === 'permission-denied'
    || error?.code === 'failed-precondition'
    || error?.code === 'unavailable'
  );
}

function normalizeDateKey(value) {
  if (!value) return null;

  const parsed =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function formatSeriesLabel(dateKey) {
  if (!dateKey) return '';

  const parsed = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return dateKey;
  }

  return parsed.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
  });
}

function parseExpirationDate(dateValue) {
  if (!dateValue) return null;

  const rawDate =
    typeof dateValue?.toDate === 'function'
      ? dateValue.toDate()
      : dateValue instanceof Date
        ? dateValue
        : new Date(`${String(dateValue).slice(0, 10)}T23:59:59`);

  if (Number.isNaN(rawDate.getTime())) {
    return null;
  }

  return new Date(
    rawDate.getFullYear(),
    rawDate.getMonth(),
    rawDate.getDate(),
    23,
    59,
    59,
    999
  );
}

function isExpiredProduct(item) {
  if (item?.estadoPublicacion === 'VENCIDO') {
    return true;
  }

  const expirationDate = parseExpirationDate(item?.fechaVencimiento);

  if (!expirationDate) {
    return false;
  }

  return expirationDate.getTime() < Date.now();
}

function isActivePublishedProduct(item) {
  return (
    item?.estadoPublicacion === 'DISPONIBLE'
    && Number(item?.cantidadDisponible || 0) > 0
    && !isExpiredProduct(item)
  );
}

function buildAnalyticsFromSources({ orders, orderItems, expiringProducts }) {
  const summary = buildEmptySummary();
  const orderMap = new Map(orders.map((item) => [item.orderId || item.id, item]));
  const expiringMap = new Map(
    expiringProducts.map((item) => [item.expiringProductId || item.id, item]),
  );
  const dailyAccumulator = new Map();
  const productAccumulator = new Map();

  function getDailyBucket(dateKey) {
    if (!dailyAccumulator.has(dateKey)) {
      dailyAccumulator.set(dateKey, {
        dateKey,
        label: formatSeriesLabel(dateKey),
        totalPedidos: 0,
        pedidosConVenta: 0,
        totalVentas: 0,
        productosVendidos: 0,
        ahorroEstimado: 0,
      });
    }

    return dailyAccumulator.get(dateKey);
  }

  summary.totalPedidos = orders.length;
  summary.pedidosPagados = orders.filter((item) => item.estadoPedido === 'PAGADO').length;
  summary.pedidosListos = orders.filter((item) => item.estadoPedido === 'LISTO_PARA_RECOGER').length;
  summary.pedidosEntregados = orders.filter((item) => item.estadoPedido === 'ENTREGADO').length;
  summary.pedidosCancelados = orders.filter((item) => item.estadoPedido === 'CANCELADO').length;
  summary.pedidosConVenta = orders.filter((item) => VALID_ORDER_STATUSES.includes(item.estadoPedido)).length;

  summary.totalVentas = orders
    .filter((item) => VALID_ORDER_STATUSES.includes(item.estadoPedido))
    .reduce((acc, item) => acc + Number(item.totalPedido || 0), 0);

  summary.ticketPromedio = summary.pedidosConVenta
    ? Math.round(summary.totalVentas / summary.pedidosConVenta)
    : 0;

  summary.productosPublicados = expiringProducts.length;
  summary.productosActivos = expiringProducts.filter(isActivePublishedProduct).length;
  summary.productosVencidos = expiringProducts.filter(isExpiredProduct).length;

  orders.forEach((order) => {
    const dateKey = normalizeDateKey(order.fechaPedido);

    if (!dateKey) return;

    const bucket = getDailyBucket(dateKey);
    bucket.totalPedidos += 1;

    if (VALID_ORDER_STATUSES.includes(order.estadoPedido)) {
      bucket.pedidosConVenta += 1;
      bucket.totalVentas += Number(order.totalPedido || 0);
    }
  });

  orderItems.forEach((item) => {
    const relatedOrder = orderMap.get(item.orderId);

    if (!relatedOrder || !VALID_ORDER_STATUSES.includes(relatedOrder.estadoPedido)) {
      return;
    }

    const quantity = Number(item.cantidad || 0);
    const subtotal = Number(item.subtotal || 0);
    const relatedExpiring = expiringMap.get(item.expiringProductId) || null;
    const dateKey = normalizeDateKey(relatedOrder.fechaPedido);

    summary.productosVendidos += quantity;

    if (relatedExpiring) {
      const ahorroUnitario =
        Number(relatedExpiring.precioBaseSnapshot || 0) - Number(relatedExpiring.precioEspecial || 0);

      if (ahorroUnitario > 0) {
        summary.ahorroEstimado += ahorroUnitario * quantity;
      }
    }

    if (dateKey) {
      const bucket = getDailyBucket(dateKey);
      bucket.productosVendidos += quantity;

      if (relatedExpiring) {
        const ahorroUnitario =
          Number(relatedExpiring.precioBaseSnapshot || 0) - Number(relatedExpiring.precioEspecial || 0);

        if (ahorroUnitario > 0) {
          bucket.ahorroEstimado += ahorroUnitario * quantity;
        }
      }
    }

    const productKey = item.productId || item.expiringProductId || item.nombreProductoSnapshot || item.id;

    if (!productAccumulator.has(productKey)) {
      productAccumulator.set(productKey, {
        analyticsProductId: productKey,
        nombreProducto: item.nombreProductoSnapshot || 'Producto',
        unidadesVendidas: 0,
        ingresosGenerados: 0,
        ahorroEstimado: 0,
      });
    }

    const productBucket = productAccumulator.get(productKey);
    productBucket.unidadesVendidas += quantity;
    productBucket.ingresosGenerados += subtotal;

    if (relatedExpiring) {
      const ahorroUnitario =
        Number(relatedExpiring.precioBaseSnapshot || 0) - Number(relatedExpiring.precioEspecial || 0);

      if (ahorroUnitario > 0) {
        productBucket.ahorroEstimado += ahorroUnitario * quantity;
      }
    }
  });

  const topProducts = [...productAccumulator.values()]
    .sort((a, b) => {
      const diffUnits = Number(b.unidadesVendidas || 0) - Number(a.unidadesVendidas || 0);
      if (diffUnits !== 0) return diffUnits;

      return Number(b.ingresosGenerados || 0) - Number(a.ingresosGenerados || 0);
    })
    .slice(0, 8);

  const dailySeries = [...dailyAccumulator.values()]
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .slice(-7);

  return {
    summary,
    topProducts,
    dailySeries,
  };
}

async function getAnalyticsSummaryFromLiveData() {
  const [ordersSnap, orderItemsSnap, expiringSnap] = await Promise.all([
    getDocs(query(collection(db, 'ORDERS'))),
    getDocs(query(collection(db, 'ORDER_ITEMS'))),
    getDocs(query(collection(db, 'EXPIRING_PRODUCTS'))),
  ]);

  const orders = ordersSnap.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));

  const orderItems = orderItemsSnap.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));

  const expiringProducts = expiringSnap.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));

  return buildAnalyticsFromSources({
    orders,
    orderItems,
    expiringProducts,
  });
}

async function getAnalyticsSummaryFromMaterializedViews() {
  const [dailySnap, productsSnap, expiringSnap] = await Promise.all([
    getDocs(query(collection(db, 'ANALYTICS_DAILY'))),
    getDocs(query(collection(db, 'ANALYTICS_PRODUCTS'))),
    getDocs(query(collection(db, 'EXPIRING_PRODUCTS'))),
  ]);

  if (dailySnap.empty && productsSnap.empty) {
    return buildEmptyAnalyticsResponse();
  }

  const dailyRows = dailySnap.docs
    .map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }))
    .sort((a, b) => String(a.fecha || a.id).localeCompare(String(b.fecha || b.id)));

  const topProducts = productsSnap.docs
    .map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }))
    .sort((a, b) => Number(b.unidadesVendidas || 0) - Number(a.unidadesVendidas || 0))
    .slice(0, 8);

  const expiringProducts = expiringSnap.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));

  const summary = dailyRows.reduce((acc, item) => {
    acc.totalPedidos += Number(item.totalPedidos || 0);
    acc.pedidosPagados += Number(item.pedidosPagados || 0);
    acc.pedidosEntregados += Number(item.pedidosEntregados || 0);
    acc.pedidosCancelados += Number(item.pedidosCancelados || 0);
    acc.totalVentas += Number(item.totalVentas || 0);
    acc.productosVendidos += Number(item.productosVendidos || 0);
    acc.ahorroEstimado += Number(item.ahorroEstimado || 0);
    return acc;
  }, buildEmptySummary());

  summary.pedidosConVenta = summary.pedidosPagados + summary.pedidosEntregados;
  summary.ticketPromedio = summary.pedidosConVenta
    ? Math.round(summary.totalVentas / summary.pedidosConVenta)
    : 0;
  summary.productosPublicados = expiringProducts.length;
  summary.productosActivos = expiringProducts.filter(isActivePublishedProduct).length;
  summary.productosVencidos = expiringProducts.filter(isExpiredProduct).length;

  const dailySeries = dailyRows.slice(-7).map((item) => {
    const dateKey = String(item.fecha || item.id);

    return {
      dateKey,
      label: formatSeriesLabel(dateKey),
      totalPedidos: Number(item.totalPedidos || 0),
      pedidosConVenta:
        Number(item.pedidosPagados || 0) + Number(item.pedidosEntregados || 0),
      totalVentas: Number(item.totalVentas || 0),
      productosVendidos: Number(item.productosVendidos || 0),
      ahorroEstimado: Number(item.ahorroEstimado || 0),
    };
  });

  return {
    summary,
    topProducts,
    dailySeries,
  };
}

export async function getAnalyticsSummary() {
  try {
    return await getAnalyticsSummaryFromLiveData();
  } catch (liveError) {
    if (!shouldFallbackToLiveData(liveError)) {
      throw liveError;
    }

    try {
      return await getAnalyticsSummaryFromMaterializedViews();
    } catch (materializedError) {
      if (shouldFallbackToLiveData(materializedError)) {
        return buildEmptyAnalyticsResponse();
      }

      throw materializedError;
    }
  }
}
