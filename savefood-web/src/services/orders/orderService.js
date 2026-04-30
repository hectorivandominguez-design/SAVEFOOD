import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Read-only order queries live here.
// Order mutations are handled by /services/orders/orderMutationService.js
// and the canonical backend logic in /functions/index.js.

export async function getClientOrders(userId) {
  const ordersQuery = query(
    collection(db, 'ORDERS'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs
    .map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }))
    .sort((a, b) => {
      const aTime = a.fechaPedido?.toMillis?.() ?? 0;
      const bTime = b.fechaPedido?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
}

export async function getAdminOrders() {
  const ordersQuery = query(
    collection(db, 'ORDERS'),
    orderBy('fechaPedido', 'desc')
  );

  const snapshot = await getDocs(ordersQuery);
  const orders = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
  const uniqueUserIds = [...new Set(orders.map((order) => order.userId).filter(Boolean))];
  const usersById = new Map();

  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const userSnap = await getDoc(doc(db, 'USERS', userId));

      if (userSnap.exists()) {
        usersById.set(userId, userSnap.data());
      }
    })
  );

  return orders.map((order) => {
    const client = usersById.get(order.userId) || null;
    const clientName = [client?.firstName, client?.lastName].filter(Boolean).join(' ').trim();

    return {
      ...order,
      clientName: clientName || 'Cliente sin nombre registrado',
      clientEmail: client?.email || '',
      clientPhone: client?.telefonoContacto || '',
      clientCountryCode: client?.indicativoTelefono || '+57',
    };
  });
}

export async function getOrderDetail(orderId) {
  const orderRef = doc(db, 'ORDERS', orderId);
  const orderSnap = await getDoc(orderRef);

  if (!orderSnap.exists()) {
    throw new Error('Pedido no encontrado.');
  }

  const itemsQuery = query(
    collection(db, 'ORDER_ITEMS'),
    where('orderId', '==', orderId)
  );

  const itemsSnap = await getDocs(itemsQuery);

  return {
    order: {
      id: orderSnap.id,
      ...orderSnap.data(),
    },
    items: itemsSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })),
  };
}
