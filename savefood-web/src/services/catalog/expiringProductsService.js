import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const CATALOG_COLLECTION = 'PRODUCTS_CATALOG';
const EXPIRING_COLLECTION = 'EXPIRING_PRODUCTS';

export async function getEligibleCatalogProducts() {
  const collectionRef = collection(db, CATALOG_COLLECTION);
  const q = query(collectionRef, orderBy('fechaRegistro', 'desc'));
  const snapshot = await getDocs(q);

  const products = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  return products.filter((item) => item.estadoProducto === 'ACTIVO');
}

export async function getCatalogProductForPublishing(productId) {
  const docRef = doc(db, CATALOG_COLLECTION, productId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('Producto base no encontrado.');
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function createExpiringProduct({
  catalogProduct,
  publishData,
  adminId,
}) {
  const collectionRef = collection(db, EXPIRING_COLLECTION);
  const newDocRef = doc(collectionRef);

  const payload = {
    expiringProductId: newDocRef.id,
    productId: catalogProduct.productId || catalogProduct.id,
    nombreProductoSnapshot: catalogProduct.nombreProducto,
    categoriaSnapshot: catalogProduct.categoria,
    descripcionSnapshot: catalogProduct.descripcion || '',
    precioBaseSnapshot: Number(catalogProduct.precioBase),
    precioEspecial: Number(publishData.precioEspecial),
    cantidadDisponible: Number(publishData.cantidadDisponible),
    fechaVencimiento: publishData.fechaVencimiento,
    estadoPublicacion: publishData.estadoPublicacion,
    imagenUrl: catalogProduct.imagenUrl || '',
    sede: catalogProduct.sede || 'Bosa',
    publicadoPorAdminId: adminId,
    fechaPublicacion: serverTimestamp(),
    fechaActualizacion: serverTimestamp(),
  };

  await setDoc(newDocRef, payload);
  return newDocRef.id;
}

export async function getExpiringProducts() {
  const collectionRef = collection(db, EXPIRING_COLLECTION);
  const q = query(collectionRef, orderBy('fechaPublicacion', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function getExpiringProductById(expiringProductId) {
  const docRef = doc(db, EXPIRING_COLLECTION, expiringProductId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('Producto próximo a vencer no encontrado.');
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function updateExpiringProduct({
  expiringProductId,
  formData,
}) {
  const docRef = doc(db, EXPIRING_COLLECTION, expiringProductId);

  const payload = {
    precioEspecial: Number(formData.precioEspecial),
    cantidadDisponible: Number(formData.cantidadDisponible),
    fechaVencimiento: formData.fechaVencimiento,
    estadoPublicacion: formData.estadoPublicacion,
    fechaActualizacion: serverTimestamp(),
  };

  await updateDoc(docRef, payload);
}
