const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');
const { defineSecret, defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const Stripe = require('stripe');

admin.initializeApp();

const db = admin.firestore();
const timestamp = admin.firestore.FieldValue.serverTimestamp;
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const appUrl = defineString('APP_URL');
const PAYMENT_PENDING_TTL_MINUTES = 30;
const STRIPE_CHECKOUT_EXPIRATION_BUFFER_SECONDS = 60;

function getStripeClient() {
  return new Stripe(stripeSecretKey.value());
}

function buildPaymentExpirationDate() {
  return new Date(
    Date.now()
      + PAYMENT_PENDING_TTL_MINUTES * 60 * 1000
      + STRIPE_CHECKOUT_EXPIRATION_BUFFER_SECONDS * 1000
  );
}

function getTimestampMillis(value) {
  if (!value) return null;

  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function sanitizeStatusCode(status) {
  return Number.isInteger(status) && status >= 100 && status < 600 ? status : 500;
}

function jsonResponse(res, status, payload) {
  return res.status(status).json(payload);
}

async function authenticateRequest(req) {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    throw httpError(401, 'No se enviaron credenciales de autenticación.');
  }

  const token = authorization.slice(7).trim();
  const decodedToken = await admin.auth().verifyIdToken(token);
  const profileSnap = await db.collection('USERS').doc(decodedToken.uid).get();

  if (!profileSnap.exists) {
    throw httpError(403, 'El usuario autenticado no tiene perfil registrado.');
  }

  return {
    uid: decodedToken.uid,
    profile: profileSnap.data(),
  };
}

function assertRole(profile, allowedRoles) {
  if (!allowedRoles.includes(profile?.rol)) {
    throw httpError(403, 'No tienes permisos para realizar esta acción.');
  }
}

function randomPickupCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function getOrderWithItems(orderId) {
  const orderRef = db.collection('ORDERS').doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw httpError(404, 'Pedido no encontrado.');
  }

  const itemsSnap = await db
    .collection('ORDER_ITEMS')
    .where('orderId', '==', orderId)
    .get();

  return {
    orderRef,
    order: orderSnap.data(),
    items: itemsSnap.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })),
  };
}

async function createClientNotification(userId, orderId, titulo, mensaje, tipo = 'PEDIDO') {
  const ref = db.collection('NOTIFICATIONS').doc();

  return {
    ref,
    data: {
      notificationId: ref.id,
      userId,
      rolDestinatario: 'CLIENTE',
      orderId,
      tipoNotificacion: tipo,
      titulo,
      mensaje,
      leida: false,
      fechaNotificacion: timestamp(),
    },
  };
}

async function createAdminNotifications(orderId, titulo, mensaje, tipo = 'PEDIDO') {
  const adminsSnap = await db
    .collection('USERS')
    .where('rol', '==', 'ADMIN')
    .get();

  return adminsSnap.docs.map((adminDoc) => {
    const ref = db.collection('NOTIFICATIONS').doc();

    return {
      ref,
      data: {
        notificationId: ref.id,
        userId: adminDoc.id,
        rolDestinatario: 'ADMIN',
        orderId,
        tipoNotificacion: tipo,
        titulo,
        mensaje,
        leida: false,
        fechaNotificacion: timestamp(),
      },
    };
  });
}

async function createAuditLog({
  actorId,
  actorRol,
  orderId,
  referenciaTipo,
  referenciaId,
  descripcionEvento,
  tipoEvento,
}) {
  const ref = db.collection('AUDIT_LOGS').doc();

  return {
    ref,
    data: {
      logId: ref.id,
      tipoEvento,
      actorId,
      actorRol,
      orderId: orderId || null,
      expiringProductId: null,
      productId: null,
      referenciaTipo,
      referenciaId,
      descripcionEvento,
      fechaEvento: timestamp(),
    },
  };
}

async function createFeedbackReviewTransaction({
  orderId,
  userId,
  calificacion,
  comentario,
}) {
  if (!orderId) {
    throw httpError(400, 'El orderId es obligatorio.');
  }

  const rating = Number(calificacion);

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw httpError(400, 'La calificación debe estar entre 1 y 5.');
  }

  const orderRef = db.collection('ORDERS').doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw httpError(404, 'El pedido no existe.');
  }

  const order = orderSnap.data();

  if (order.userId !== userId) {
    throw httpError(403, 'No tienes permisos para valorar este pedido.');
  }

  if (order.estadoPedido !== 'ENTREGADO') {
    throw httpError(400, 'Solo puedes valorar pedidos entregados.');
  }

  const existingFeedbackSnap = await db
    .collection('FEEDBACK_REVIEWS')
    .where('orderId', '==', orderId)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if (!existingFeedbackSnap.empty) {
    throw httpError(400, 'Este pedido ya tiene una valoración registrada.');
  }

  const feedbackRef = db.collection('FEEDBACK_REVIEWS').doc();
  const batch = db.batch();

  batch.set(feedbackRef, {
    feedbackId: feedbackRef.id,
    orderId,
    userId,
    calificacion: rating,
    comentario: String(comentario || '').trim(),
    fechaValoracion: timestamp(),
    estadoFeedback: 'REGISTRADO',
  });

  const auditLog = await createAuditLog({
    actorId: userId,
    actorRol: 'CLIENTE',
    orderId,
    referenciaTipo: 'FEEDBACK',
    referenciaId: feedbackRef.id,
    descripcionEvento: `El cliente registró feedback para el pedido ${orderId}.`,
    tipoEvento: 'FEEDBACK_REGISTRADO',
  });

  batch.set(auditLog.ref, auditLog.data);

  const adminNotifications = await createAdminNotifications(
    orderId,
    'Nuevo feedback registrado',
    `El cliente registró una valoración para el pedido ${orderId}.`,
    'PEDIDO'
  );

  adminNotifications.forEach((item) => batch.set(item.ref, item.data));

  await batch.commit();

  return feedbackRef.id;
}

function toDateKey(dateValue) {
  if (!dateValue) return null;

  const parsed =
    typeof dateValue?.toDate === 'function'
      ? dateValue.toDate()
      : new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
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

function isExpiredProductByDate(dateValue) {
  const expirationDate = parseExpirationDate(dateValue);

  if (!expirationDate) {
    return false;
  }

  return expirationDate.getTime() < Date.now();
}

async function replaceCollectionDocuments(collectionName, documents) {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();

  snapshot.docs.forEach((docItem) => {
    batch.delete(docItem.ref);
  });

  documents.forEach((item) => {
    const docRef = db.collection(collectionName).doc(item.id);
    batch.set(docRef, item.data);
  });

  await batch.commit();
}

async function syncAnalyticsMaterializedViews() {
  const [ordersSnap, orderItemsSnap, expiringSnap] = await Promise.all([
    db.collection('ORDERS').get(),
    db.collection('ORDER_ITEMS').get(),
    db.collection('EXPIRING_PRODUCTS').get(),
  ]);

  const validOrderStatuses = ['PAGADO', 'LISTO_PARA_RECOGER', 'ENTREGADO'];

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

  const expiringMap = new Map(
    expiringProducts.map((item) => [item.expiringProductId || item.id, item])
  );

  const orderMap = new Map(
    orders.map((item) => [item.orderId || item.id, item])
  );

  const dailyAccumulator = new Map();
  const productAccumulator = new Map();

  function getDailyBucket(dateKey) {
    if (!dailyAccumulator.has(dateKey)) {
      dailyAccumulator.set(dateKey, {
        analyticsDailyId: dateKey,
        fecha: dateKey,
        totalPedidos: 0,
        pedidosPagados: 0,
        pedidosEntregados: 0,
        pedidosCancelados: 0,
        totalVentas: 0,
        productosVendidos: 0,
        ahorroEstimado: 0,
        fechaActualizacion: timestamp(),
      });
    }

    return dailyAccumulator.get(dateKey);
  }

  orders.forEach((order) => {
    const dateKey = toDateKey(order.fechaPedido);
    if (!dateKey) return;

    const bucket = getDailyBucket(dateKey);
    bucket.totalPedidos += 1;

    if (order.estadoPedido === 'PAGADO') {
      bucket.pedidosPagados += 1;
    }

    if (order.estadoPedido === 'ENTREGADO') {
      bucket.pedidosEntregados += 1;
    }

    if (order.estadoPedido === 'CANCELADO') {
      bucket.pedidosCancelados += 1;
    }

    if (validOrderStatuses.includes(order.estadoPedido)) {
      bucket.totalVentas += Number(order.totalPedido || 0);
    }
  });

  orderItems.forEach((item) => {
    const relatedOrder = orderMap.get(item.orderId);

    if (!relatedOrder || !validOrderStatuses.includes(relatedOrder.estadoPedido)) {
      return;
    }

    const dateKey = toDateKey(relatedOrder.fechaPedido);
    if (!dateKey) return;

    const bucket = getDailyBucket(dateKey);
    const quantity = Number(item.cantidad || 0);
    const subtotal = Number(item.subtotal || 0);
    const relatedExpiring =
      expiringMap.get(item.expiringProductId) || null;

    bucket.productosVendidos += quantity;

    if (relatedExpiring) {
      const ahorroUnitario =
        Number(relatedExpiring.precioBaseSnapshot || 0) -
        Number(relatedExpiring.precioEspecial || 0);

      if (ahorroUnitario > 0) {
        bucket.ahorroEstimado += ahorroUnitario * quantity;
      }
    }

    const productKey = item.productId || item.expiringProductId;

    if (!productAccumulator.has(productKey)) {
      productAccumulator.set(productKey, {
        analyticsProductId: productKey,
        productId: item.productId || null,
        expiringProductId: item.expiringProductId || null,
        nombreProducto: item.nombreProductoSnapshot || 'Producto',
        unidadesVendidas: 0,
        ingresosGenerados: 0,
        ahorroEstimado: 0,
        fechaActualizacion: timestamp(),
      });
    }

    const productBucket = productAccumulator.get(productKey);
    productBucket.unidadesVendidas += quantity;
    productBucket.ingresosGenerados += subtotal;

    if (relatedExpiring) {
      const ahorroUnitario =
        Number(relatedExpiring.precioBaseSnapshot || 0) -
        Number(relatedExpiring.precioEspecial || 0);

      if (ahorroUnitario > 0) {
        productBucket.ahorroEstimado += ahorroUnitario * quantity;
      }
    }
  });

  const dailyDocuments = [...dailyAccumulator.entries()].map(([id, data]) => ({
    id,
    data,
  }));

  const productDocuments = [...productAccumulator.entries()].map(([id, data]) => ({
    id,
    data,
  }));

  await Promise.all([
    replaceCollectionDocuments('ANALYTICS_DAILY', dailyDocuments),
    replaceCollectionDocuments('ANALYTICS_PRODUCTS', productDocuments),
  ]);
}

async function writePostOrderArtifacts({
  actorId,
  actorRol,
  orderId,
  orderUserId,
  title,
  message,
  type,
  eventType,
  description,
  notifyAdmins = false,
  adminTitle,
  adminMessage,
}) {
  const batch = db.batch();

  if (title && message) {
    const clientNotification = await createClientNotification(orderUserId, orderId, title, message, type);
    batch.set(clientNotification.ref, clientNotification.data);
  }

  if (notifyAdmins) {
    const adminNotifications = await createAdminNotifications(
      orderId,
      adminTitle || title,
      adminMessage || message,
      type
    );
    adminNotifications.forEach((item) => batch.set(item.ref, item.data));
  }

  const auditLog = await createAuditLog({
    actorId,
    actorRol,
    orderId,
    referenciaTipo: 'ORDER',
    referenciaId: orderId,
    descripcionEvento: description,
    tipoEvento: eventType,
  });

  batch.set(auditLog.ref, auditLog.data);
  await batch.commit();
}

async function createOrderTransaction({ uid, sede, items, comentarioPedido = '' }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'El carrito está vacío.');
  }

  const orderRef = db.collection('ORDERS').doc();
  const paymentExpirationDate = buildPaymentExpirationDate();
  const cleanComentarioPedido = String(comentarioPedido || '').trim().slice(0, 280);
  let orderTotal = 0;

  await db.runTransaction(async (transaction) => {
    const preparedItems = [];

    for (const rawItem of items) {
      const expiringProductId = String(rawItem?.expiringProductId || '').trim();
      const quantity = Number(rawItem?.quantity || 0);

      if (!expiringProductId) {
        throw httpError(400, 'Cada item debe incluir un producto próximo a vencer.');
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw httpError(400, 'Todas las cantidades del pedido deben ser válidas.');
      }

      const expiringRef = db.collection('EXPIRING_PRODUCTS').doc(expiringProductId);
      const expiringSnap = await transaction.get(expiringRef);

      if (!expiringSnap.exists) {
        throw httpError(404, `El producto ${expiringProductId} no existe.`);
      }

      const expiringData = expiringSnap.data();
      const currentStock = Number(expiringData.cantidadDisponible || 0);

      if (expiringData.estadoPublicacion !== 'DISPONIBLE') {
        throw httpError(400, `El producto ${expiringData.nombreProductoSnapshot} no está disponible.`);
      }

      if (isExpiredProductByDate(expiringData.fechaVencimiento)) {
        throw httpError(
          400,
          `El producto ${expiringData.nombreProductoSnapshot} ya superó su fecha de vencimiento.`
        );
      }

      if (quantity > currentStock) {
        throw httpError(
          400,
          `No hay stock suficiente para ${expiringData.nombreProductoSnapshot}. Disponible: ${currentStock}.`
        );
      }

      const unitPrice = Number(expiringData.precioEspecial || 0);
      const subtotal = unitPrice * quantity;
      const newStock = currentStock - quantity;
      const nextStatus = newStock === 0 ? 'AGOTADO' : 'DISPONIBLE';

      orderTotal += subtotal;
      preparedItems.push({
        expiringProductId,
        quantity,
        expiringRef,
        expiringData,
        currentStock,
        newStock,
        nextStatus,
        unitPrice,
        subtotal,
      });
    }

    for (const item of preparedItems) {
      transaction.update(item.expiringRef, {
        cantidadDisponible: item.newStock,
        estadoPublicacion: item.nextStatus,
        fechaActualizacion: timestamp(),
      });

      const movementRef = db.collection('INVENTORY_MOVEMENTS').doc();
      transaction.set(movementRef, {
        movementId: movementRef.id,
        expiringProductId: item.expiringProductId,
        productId: item.expiringData.productId || null,
        orderId: orderRef.id,
        actorId: uid,
        tipoMovimiento: 'COMPRA',
        cantidadMovimiento: item.quantity,
        stockAnterior: item.currentStock,
        stockNuevo: item.newStock,
        observacion: 'Descuento de inventario por creación de pedido.',
        fechaMovimiento: timestamp(),
      });

      const orderItemRef = db.collection('ORDER_ITEMS').doc();
      transaction.set(orderItemRef, {
        orderItemId: orderItemRef.id,
        orderId: orderRef.id,
        expiringProductId: item.expiringProductId,
        productId: item.expiringData.productId || null,
        nombreProductoSnapshot: item.expiringData.nombreProductoSnapshot,
        categoriaSnapshot: item.expiringData.categoriaSnapshot || '',
        descripcionSnapshot: item.expiringData.descripcionSnapshot || '',
        imagenUrlSnapshot: item.expiringData.imagenUrl || '',
        precioUnitarioSnapshot: item.unitPrice,
        cantidad: item.quantity,
        subtotal: item.subtotal,
      });
    }

    transaction.set(orderRef, {
      orderId: orderRef.id,
      userId: uid,
      sede: sede || 'Bosa',
      metodoEntrega: 'RECOGER_EN_TIENDA',
      estadoPedido: 'PENDIENTE_PAGO',
      codigoRecogida: randomPickupCode(),
      comentarioPedido: cleanComentarioPedido,
      totalPedido: orderTotal,
      motivoCancelacion: '',
      fechaPedido: timestamp(),
      fechaExpiracionPago: admin.firestore.Timestamp.fromDate(paymentExpirationDate),
      tiempoLimitePagoMinutos: PAYMENT_PENDING_TTL_MINUTES,
      fechaCancelacion: null,
      fechaActualizacion: timestamp(),
    });
  });

  await writePostOrderArtifacts({
    actorId: uid,
    actorRol: 'CLIENTE',
    orderId: orderRef.id,
    orderUserId: uid,
    title: 'Pedido creado',
    message: `Tu pedido ${orderRef.id} fue creado correctamente y está pendiente de pago.`,
    type: 'PEDIDO',
    eventType: 'PEDIDO_CREADO',
    description: `Se creó el pedido ${orderRef.id} desde el checkout.`,
  });

  await syncAnalyticsMaterializedViews();

  return orderRef.id;
}

async function restoreInventoryFromOrder({
  orderId,
  actorId,
  actorRol,
  motivoCancelacion,
  expectedEstadoPedido = null,
}) {
  const detail = await getOrderWithItems(orderId);

  if (detail.order.estadoPedido === 'ENTREGADO') {
    throw httpError(400, 'No es posible cancelar un pedido ya entregado.');
  }

  if (detail.order.estadoPedido === 'CANCELADO') {
    throw httpError(400, 'El pedido ya fue cancelado.');
  }

  await db.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(detail.orderRef);

    if (!orderSnap.exists) {
      throw httpError(404, 'Pedido no encontrado.');
    }

    const freshOrder = orderSnap.data();

    if (expectedEstadoPedido && freshOrder.estadoPedido !== expectedEstadoPedido) {
      throw httpError(
        409,
        `El pedido ya cambió de estado a ${freshOrder.estadoPedido}. No se libera automáticamente.`
      );
    }

    const restockItems = [];

    for (const item of detail.items) {
      const expiringRef = db.collection('EXPIRING_PRODUCTS').doc(item.expiringProductId);
      const expiringSnap = await transaction.get(expiringRef);

      if (!expiringSnap.exists) {
        continue;
      }

      const expiringData = expiringSnap.data();
      const previousStock = Number(expiringData.cantidadDisponible || 0);
      const restoredStock = previousStock + Number(item.cantidad || 0);
      const nextStatus =
        expiringData.estadoPublicacion === 'RETIRADO' || expiringData.estadoPublicacion === 'VENCIDO'
          ? expiringData.estadoPublicacion
          : 'DISPONIBLE';

      restockItems.push({
        item,
        expiringRef,
        previousStock,
        restoredStock,
        nextStatus,
      });
    }

    transaction.update(detail.orderRef, {
      estadoPedido: 'CANCELADO',
      motivoCancelacion: motivoCancelacion || 'Cancelación registrada en el sistema.',
      fechaCancelacion: timestamp(),
      fechaActualizacion: timestamp(),
    });

    for (const restockItem of restockItems) {
      transaction.update(restockItem.expiringRef, {
        cantidadDisponible: restockItem.restoredStock,
        estadoPublicacion: restockItem.nextStatus,
        fechaActualizacion: timestamp(),
      });

      const movementRef = db.collection('INVENTORY_MOVEMENTS').doc();
      transaction.set(movementRef, {
        movementId: movementRef.id,
        expiringProductId: restockItem.item.expiringProductId,
        productId: restockItem.item.productId || null,
        orderId,
        actorId,
        tipoMovimiento: 'CANCELACION',
        cantidadMovimiento: Number(restockItem.item.cantidad || 0),
        stockAnterior: restockItem.previousStock,
        stockNuevo: restockItem.restoredStock,
        observacion: 'Restauración de inventario por cancelación del pedido.',
        fechaMovimiento: timestamp(),
      });
    }
  });

  await writePostOrderArtifacts({
    actorId,
    actorRol,
    orderId,
    orderUserId: detail.order.userId,
    title: 'Pedido cancelado',
    message: `Tu pedido ${orderId} fue cancelado correctamente.`,
    type: 'CANCELACION',
    eventType: 'PEDIDO_CANCELADO',
    description: `El pedido ${orderId} fue cancelado. Motivo: ${motivoCancelacion || 'Sin motivo especificado'}.`,
    notifyAdmins: true,
    adminTitle: 'Pedido cancelado',
    adminMessage: `El pedido ${orderId} fue cancelado por el cliente o el administrador.`,
  });

  await syncAnalyticsMaterializedViews();
}

async function updateOrderStatusTransaction({ orderId, adminId, newStatus }) {
  const detail = await getOrderWithItems(orderId);

  if (newStatus === 'CANCELADO') {
    await restoreInventoryFromOrder({
      orderId,
      actorId: adminId,
      actorRol: 'ADMIN',
      motivoCancelacion: 'Cancelación realizada por el administrador.',
    });
    return;
  }

  if (!['LISTO_PARA_RECOGER', 'ENTREGADO'].includes(newStatus)) {
    throw httpError(400, 'Estado no permitido.');
  }

  if (detail.order.estadoPedido === 'CANCELADO') {
    throw httpError(400, 'No es posible actualizar un pedido cancelado.');
  }

  await detail.orderRef.update({
    estadoPedido: newStatus,
    fechaActualizacion: timestamp(),
  });

  const title =
    newStatus === 'LISTO_PARA_RECOGER' ? 'Pedido listo para recoger' : 'Pedido entregado';

  const message =
    newStatus === 'LISTO_PARA_RECOGER'
      ? `Tu pedido ${orderId} está listo para recoger en tienda.`
      : `Tu pedido ${orderId} fue marcado como entregado.`;

  const adminTitle =
    newStatus === 'LISTO_PARA_RECOGER'
      ? 'Pedido listo para recoger'
      : 'Pedido entregado';

  const adminStatusMessage =
    newStatus === 'LISTO_PARA_RECOGER'
      ? `El pedido ${orderId} fue actualizado a listo para recoger.`
      : `El pedido ${orderId} fue actualizado a entregado.`;

  await writePostOrderArtifacts({
    actorId: adminId,
    actorRol: 'ADMIN',
    orderId,
    orderUserId: detail.order.userId,
    title,
    message,
    type: 'PEDIDO',
    eventType: 'PEDIDO_ACTUALIZADO',
    description: `El administrador actualizó el pedido ${orderId} al estado ${newStatus}.`,
    notifyAdmins: true,
    adminTitle,
    adminMessage: adminStatusMessage,
  });

  await syncAnalyticsMaterializedViews();
}

async function fulfillCheckoutSession(session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  const userId = session.metadata?.userId || null;

  if (!orderId) {
    logger.warn('La sesión de Stripe no tiene orderId en metadata.');
    return;
  }

  const paymentRef = db.collection('PAYMENTS').doc(session.id);
  const orderRef = db.collection('ORDERS').doc(orderId);

  const fulfillmentResult = await db.runTransaction(async (transaction) => {
    const paymentSnap = await transaction.get(paymentRef);

    if (paymentSnap.exists) {
      return { fulfilled: false, reason: 'PAYMENT_ALREADY_REGISTERED' };
    }

    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists) {
      return { fulfilled: false, reason: 'ORDER_NOT_FOUND' };
    }

    const order = orderSnap.data();

    if (order.estadoPedido !== 'PENDIENTE_PAGO') {
      return {
        fulfilled: false,
        reason: `ORDER_STATUS_${order.estadoPedido}`,
      };
    }

    const expirationMillis = getTimestampMillis(order.fechaExpiracionPago);

    if (expirationMillis && expirationMillis <= Date.now()) {
      return { fulfilled: false, reason: 'ORDER_PAYMENT_EXPIRED' };
    }

    transaction.set(paymentRef, {
      paymentId: session.id,
      orderId,
      estadoPago: 'APROBADO',
      referenciaPago: session.payment_intent || session.id,
      medioPago: 'STRIPE_CHECKOUT',
      valorPago: Number((session.amount_total || 0) / 100),
      fechaPago: timestamp(),
    });

    transaction.update(orderRef, {
      estadoPedido: 'PAGADO',
      fechaActualizacion: timestamp(),
    });

    return {
      fulfilled: true,
      userId: order.userId,
    };
  });

  if (!fulfillmentResult.fulfilled) {
    logger.warn(`No se confirmó el pedido ${orderId}. Motivo: ${fulfillmentResult.reason}.`);
    return;
  }

  const fulfilledUserId = userId || fulfillmentResult.userId;

  const clientNotification = await createClientNotification(
    fulfilledUserId,
    orderId,
    'Pago confirmado',
    'Tu pedido fue pagado correctamente.',
    'PAGO'
  );

  const adminNotifications = await createAdminNotifications(
    orderId,
    'Pedido pagado',
    `Se confirmó el pago del pedido ${orderId}.`,
    'PAGO'
  );

  const auditLog = await createAuditLog({
    actorId: fulfilledUserId || 'SISTEMA',
    actorRol: fulfilledUserId ? 'CLIENTE' : 'SISTEMA',
    orderId,
    referenciaTipo: 'PAYMENT',
    referenciaId: session.id,
    descripcionEvento: `Pago confirmado para el pedido ${orderId} mediante Stripe Checkout.`,
    tipoEvento: 'PAGO_CONFIRMADO',
  });

  const batchNotifications = db.batch();
  batchNotifications.set(clientNotification.ref, clientNotification.data);
  adminNotifications.forEach((item) => batchNotifications.set(item.ref, item.data));
  batchNotifications.set(auditLog.ref, auditLog.data);
  await batchNotifications.commit();

  await syncAnalyticsMaterializedViews();
}

async function expireProductsBySchedule() {
  const expiringSnap = await db
    .collection('EXPIRING_PRODUCTS')
    .where('estadoPublicacion', 'in', ['DISPONIBLE', 'AGOTADO'])
    .get();

  const expiredDocs = expiringSnap.docs.filter((docItem) =>
    isExpiredProductByDate(docItem.data()?.fechaVencimiento)
  );

  if (!expiredDocs.length) {
    logger.info('No se encontraron productos para marcar como vencidos.');
    return { updated: 0 };
  }

  let updated = 0;

  for (let index = 0; index < expiredDocs.length; index += 400) {
    const chunk = expiredDocs.slice(index, index + 400);
    const batch = db.batch();

    chunk.forEach((docItem) => {
      batch.update(docItem.ref, {
        estadoPublicacion: 'VENCIDO',
        fechaActualizacion: timestamp(),
      });
    });

    await batch.commit();
    updated += chunk.length;
  }

  const auditLog = await createAuditLog({
    actorId: 'SISTEMA',
    actorRol: 'SISTEMA',
    orderId: null,
    referenciaTipo: 'EXPIRING_PRODUCTS',
    referenciaId: 'SCHEDULED_EXPIRATION',
    descripcionEvento: `Se marcaron ${updated} productos como vencidos por tarea programada.`,
    tipoEvento: 'PRODUCTOS_VENCIDOS_ACTUALIZADOS',
  });

  await auditLog.ref.set(auditLog.data);
  await syncAnalyticsMaterializedViews();

  logger.info(`Productos marcados como vencidos: ${updated}.`);
  return { updated };
}

async function releaseExpiredPendingOrders() {
  const now = admin.firestore.Timestamp.now();
  const ordersSnap = await db
    .collection('ORDERS')
    .where('estadoPedido', '==', 'PENDIENTE_PAGO')
    .where('fechaExpiracionPago', '<=', now)
    .limit(50)
    .get();

  if (ordersSnap.empty) {
    logger.info('No se encontraron pedidos pendientes de pago para liberar.');
    return { released: 0 };
  }

  let released = 0;

  for (const orderDoc of ordersSnap.docs) {
    try {
      await restoreInventoryFromOrder({
        orderId: orderDoc.id,
        actorId: 'SISTEMA',
        actorRol: 'SISTEMA',
        motivoCancelacion: `Liberación automática por superar ${PAYMENT_PENDING_TTL_MINUTES} minutos sin pago.`,
        expectedEstadoPedido: 'PENDIENTE_PAGO',
      });
      released += 1;
    } catch (error) {
      logger.warn(`No fue posible liberar el pedido pendiente ${orderDoc.id}.`, error);
    }
  }

  logger.info(`Pedidos pendientes liberados automáticamente: ${released}.`);
  return { released };
}

async function handleHttpRequest(req, res, executor) {
  try {
    if (req.method !== 'POST') {
      return jsonResponse(res, 405, { error: 'Método no permitido.' });
    }

    return await executor();
  } catch (error) {
    logger.error(error);
    return jsonResponse(res, sanitizeStatusCode(error.status), {
      error: error.message || 'Ocurrió un error inesperado.',
    });
  }
}

exports.expireExpiringProducts = onSchedule(
  {
    schedule: '10 0 * * *',
    timeZone: 'America/Bogota',
    region: 'us-central1',
  },
  async () => {
    await expireProductsBySchedule();
  }
);

exports.releaseUnpaidOrders = onSchedule(
  {
    schedule: 'every 10 minutes',
    timeZone: 'America/Bogota',
    region: 'us-central1',
  },
  async () => {
    await releaseExpiredPendingOrders();
  }
);

exports.createOrder = onRequest({ cors: true, invoker: 'public' }, async (req, res) =>
  handleHttpRequest(req, res, async () => {
    const { uid, profile } = await authenticateRequest(req);
    assertRole(profile, ['CLIENTE']);

    const orderId = await createOrderTransaction({
      uid,
      sede: req.body?.sede || 'Bosa',
      items: req.body?.items || [],
      comentarioPedido: req.body?.comentarioPedido || '',
    });

    return jsonResponse(res, 200, { orderId });
  })
);

exports.cancelOrder = onRequest({ cors: true, invoker: 'public' }, async (req, res) =>
  handleHttpRequest(req, res, async () => {
    const { uid, profile } = await authenticateRequest(req);
    assertRole(profile, ['CLIENTE']);

    const orderId = String(req.body?.orderId || '').trim();
    const motivoCancelacion =
      String(req.body?.motivoCancelacion || '').trim() || 'Cancelación realizada por el cliente.';

    if (!orderId) {
      throw httpError(400, 'El orderId es obligatorio.');
    }

    const detail = await getOrderWithItems(orderId);

    if (detail.order.userId !== uid) {
      throw httpError(403, 'No tienes permisos para cancelar este pedido.');
    }

    await restoreInventoryFromOrder({
      orderId,
      actorId: uid,
      actorRol: 'CLIENTE',
      motivoCancelacion,
    });

    return jsonResponse(res, 200, { orderId, status: 'CANCELADO' });
  })
);

exports.updateOrderStatus = onRequest({ cors: true, invoker: 'public' }, async (req, res) =>
  handleHttpRequest(req, res, async () => {
    const { uid, profile } = await authenticateRequest(req);
    assertRole(profile, ['ADMIN']);

    const orderId = String(req.body?.orderId || '').trim();
    const newStatus = String(req.body?.newStatus || '').trim();

    if (!orderId || !newStatus) {
      throw httpError(400, 'El orderId y el newStatus son obligatorios.');
    }

    await updateOrderStatusTransaction({
      orderId,
      adminId: uid,
      newStatus,
    });

    return jsonResponse(res, 200, { orderId, status: newStatus });
  })
);

exports.createFeedbackReview = onRequest({ cors: true, invoker: 'public' }, async (req, res) =>
  handleHttpRequest(req, res, async () => {
    const { uid, profile } = await authenticateRequest(req);
    assertRole(profile, ['CLIENTE']);

    const feedbackId = await createFeedbackReviewTransaction({
      orderId: String(req.body?.orderId || '').trim(),
      userId: uid,
      calificacion: req.body?.calificacion,
      comentario: req.body?.comentario || '',
    });

    return jsonResponse(res, 200, { feedbackId });
  })
);

exports.getPublicProductDescription = onRequest({ cors: true, invoker: 'public' }, async (req, res) =>
  handleHttpRequest(req, res, async () => {
    const expiringProductId = String(req.body?.expiringProductId || '').trim();

    if (!expiringProductId) {
      throw httpError(400, 'El expiringProductId es obligatorio.');
    }

    const expiringRef = db.collection('EXPIRING_PRODUCTS').doc(expiringProductId);
    const expiringSnap = await expiringRef.get();

    if (!expiringSnap.exists) {
      throw httpError(404, 'El producto solicitado no existe.');
    }

    const expiringData = expiringSnap.data();

    if (
      !['DISPONIBLE', 'AGOTADO'].includes(expiringData.estadoPublicacion)
      || isExpiredProductByDate(expiringData.fechaVencimiento)
    ) {
      throw httpError(404, 'El producto solicitado ya no está disponible.');
    }

    if (expiringData.descripcionSnapshot) {
      return jsonResponse(res, 200, {
        descripcionSnapshot: expiringData.descripcionSnapshot,
      });
    }

    if (!expiringData.productId) {
      return jsonResponse(res, 200, {
        descripcionSnapshot: '',
      });
    }

    const catalogSnap = await db.collection('PRODUCTS_CATALOG').doc(String(expiringData.productId).trim()).get();
    const descripcionSnapshot = catalogSnap.exists
      ? String(catalogSnap.data()?.descripcion || '').trim()
      : '';

    if (descripcionSnapshot) {
      await expiringRef.set(
        {
          descripcionSnapshot,
          fechaActualizacion: timestamp(),
        },
        { merge: true }
      );
    }

    return jsonResponse(res, 200, { descripcionSnapshot });
  })
);

exports.createCheckoutSession = onRequest({ cors: true, invoker: 'public', secrets: [stripeSecretKey] }, async (req, res) =>
  handleHttpRequest(req, res, async () => {
    const { uid, profile } = await authenticateRequest(req);
    assertRole(profile, ['CLIENTE']);
    const stripe = getStripeClient();

    const orderId = String(req.body?.orderId || '').trim();

    if (!orderId) {
      throw httpError(400, 'El orderId es obligatorio.');
    }

    const { orderRef, order, items } = await getOrderWithItems(orderId);

    if (order.userId !== uid) {
      throw httpError(403, 'No tienes permisos para pagar este pedido.');
    }

    if (!items.length) {
      throw httpError(400, 'El pedido no tiene productos.');
    }

    if (order.estadoPedido !== 'PENDIENTE_PAGO') {
      throw httpError(400, 'Este pedido ya no está disponible para pago.');
    }

    const expirationMillis = getTimestampMillis(order.fechaExpiracionPago);

    if (expirationMillis && expirationMillis <= Date.now()) {
      throw httpError(
        400,
        'El tiempo para pagar este pedido terminó. Crea un nuevo pedido para validar disponibilidad.'
      );
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'cop',
        product_data: {
          name: item.nombreProductoSnapshot,
        },
        unit_amount: Math.round(Number(item.precioUnitarioSnapshot) * 100),
      },
      quantity: Number(item.cantidad),
    }));

    const sessionExpirationDate = buildPaymentExpirationDate();
    const sessionConfig = {
      mode: 'payment',
      line_items: lineItems,
      success_url: `${appUrl.value()}/client/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${appUrl.value()}/client/payment/${orderId}?canceled=1`,
      expires_at: Math.floor(sessionExpirationDate.getTime() / 1000),
      client_reference_id: orderId,
      metadata: {
        orderId,
        userId: order.userId,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    await orderRef.update({
      fechaExpiracionPago: admin.firestore.Timestamp.fromDate(sessionExpirationDate),
      tiempoLimitePagoMinutos: PAYMENT_PENDING_TTL_MINUTES,
      fechaActualizacion: timestamp(),
    });

    return jsonResponse(res, 200, {
      url: session.url,
      sessionId: session.id,
    });
  })
);

exports.confirmCheckoutSession = onRequest({ cors: true, invoker: 'public', secrets: [stripeSecretKey] }, async (req, res) => {
  try {
    const stripe = getStripeClient();
    const sessionId = req.method === 'POST' ? req.body?.sessionId : req.query?.session_id;

    if (!sessionId) {
      return jsonResponse(res, 400, { error: 'El sessionId es obligatorio.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && (session.status === 'complete' || session.status === 'open')) {
      await fulfillCheckoutSession(session);
    }

    return jsonResponse(res, 200, {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
      amountTotal: session.amount_total,
      customerEmail: session.customer_details?.email || '',
      orderId: session.metadata?.orderId || session.client_reference_id || '',
    });
  } catch (error) {
    logger.error(error);
    return jsonResponse(res, sanitizeStatusCode(error.status), {
      error: error.message || 'No fue posible confirmar la sesión.',
    });
  }
});

exports.stripeWebhook = onRequest({ invoker: 'public', secrets: [stripeSecretKey, stripeWebhookSecret] }, async (req, res) => {
  try {
    const stripe = getStripeClient();
    const signature = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      stripeWebhookSecret.value()
    );

    if (event.type === 'checkout.session.completed') {
      await fulfillCheckoutSession(event.data.object);
    }

    return jsonResponse(res, 200, { received: true });
  } catch (error) {
    logger.error(error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

