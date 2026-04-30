import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getNotificationsByUser(userId) {
  const q = query(
    collection(db, 'NOTIFICATIONS'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .sort((a, b) => {
      const aTime = a.fechaNotificacion?.toMillis?.() ?? 0;
      const bTime = b.fechaNotificacion?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
}

export async function markNotificationAsRead(notificationId) {
  const ref = doc(db, 'NOTIFICATIONS', notificationId);

  await updateDoc(ref, {
    leida: true,
  });
}
