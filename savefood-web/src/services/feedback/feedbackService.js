import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { postFunction } from '../functions/functionHttpService';

export async function getFeedbackByOrderAndUser(orderId, userId) {
  const q = query(
    collection(db, 'FEEDBACK_REVIEWS'),
    where('orderId', '==', orderId),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const item = snapshot.docs[0];

  return {
    id: item.id,
    ...item.data(),
  };
}

export async function createFeedbackReview({ orderId, calificacion, comentario }) {
  if (!orderId) {
    throw new Error('La información del pedido es obligatoria.');
  }

  if (Number(calificacion) < 1 || Number(calificacion) > 5) {
    throw new Error('La calificación debe estar entre 1 y 5.');
  }

  const response = await postFunction(
    'createFeedbackReview',
    {
      orderId,
      calificacion: Number(calificacion),
      comentario: comentario?.trim() || '',
    },
    { authenticated: true }
  );

  return response.feedbackId;
}

export async function getAdminFeedbackReviews(limitCount = 10) {
  const feedbackQuery = query(
    collection(db, 'FEEDBACK_REVIEWS'),
    orderBy('fechaValoracion', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(feedbackQuery);
  const feedbackItems = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  const enrichedItems = await Promise.all(
    feedbackItems.map(async (feedback) => {
      const orderRef = doc(db, 'ORDERS', feedback.orderId);
      const orderSnap = await getDoc(orderRef);
      const order = orderSnap.exists() ? orderSnap.data() : null;

      const userRef = doc(db, 'USERS', feedback.userId);
      const userSnap = await getDoc(userRef);
      const user = userSnap.exists() ? userSnap.data() : null;

      const orderItemsQuery = query(
        collection(db, 'ORDER_ITEMS'),
        where('orderId', '==', feedback.orderId)
      );
      const orderItemsSnap = await getDocs(orderItemsQuery);
      const orderItems = orderItemsSnap.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      return {
        ...feedback,
        clientName:
          [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
          || 'Cliente sin nombre registrado',
        clientEmail: user?.email || '',
        orderNumber: order?.orderId || feedback.orderId,
        orderStatus: order?.estadoPedido || '',
        orderTotal: Number(order?.totalPedido || 0),
        orderItems,
      };
    })
  );

  return enrichedItems;
}
