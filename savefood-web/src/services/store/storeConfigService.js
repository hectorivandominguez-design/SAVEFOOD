import {
  collection,
  getDocs,
  query,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getStoreConfig() {
  const snapshot = await getDocs(query(collection(db, 'STORE_CONFIG')));

  if (snapshot.empty) {
    throw new Error('No existe configuración de tienda registrada.');
  }

  const firstDoc = snapshot.docs[0];

  return {
    id: firstDoc.id,
    ...firstDoc.data(),
  };
}
