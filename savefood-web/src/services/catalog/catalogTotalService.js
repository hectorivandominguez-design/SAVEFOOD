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
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { db, storage } from '../firebase/config';

const COLLECTION_NAME = 'PRODUCTS_CATALOG';

function sanitizeFileName(fileName = '') {
  return fileName.replace(/\s+/g, '-').toLowerCase();
}

async function uploadProductImage(file, adminId) {
  if (!file) return '';

  const safeName = sanitizeFileName(file.name);
  const filePath = `products_catalog/${adminId}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function getCatalogProducts() {
  const collectionRef = collection(db, COLLECTION_NAME);
  const q = query(collectionRef, orderBy('fechaRegistro', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function getCatalogProductById(productId) {
  const docRef = doc(db, COLLECTION_NAME, productId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('Producto no encontrado.');
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function createCatalogProduct({
  formData,
  imageFile,
  adminId,
}) {
  const docRef = doc(collection(db, COLLECTION_NAME));

  let imageUrl = '';

  if (imageFile) {
    imageUrl = await uploadProductImage(imageFile, adminId);
  }

  const payload = {
    productId: docRef.id,
    nombreProducto: formData.nombreProducto.trim(),
    descripcion: formData.descripcion.trim(),
    categoria: formData.categoria,
    precioBase: Number(formData.precioBase),
    imagenUrl: imageUrl,
    estadoProducto: formData.estadoProducto,
    sede: formData.sede,
    creadoPorAdminId: adminId,
    fechaRegistro: serverTimestamp(),
    fechaActualizacion: serverTimestamp(),
  };

  await setDoc(docRef, payload);

  return docRef.id;
}

export async function updateCatalogProduct({
  productId,
  formData,
  imageFile,
  adminId,
}) {
  const docRef = doc(db, COLLECTION_NAME, productId);

  const updatePayload = {
    nombreProducto: formData.nombreProducto.trim(),
    descripcion: formData.descripcion.trim(),
    categoria: formData.categoria,
    precioBase: Number(formData.precioBase),
    estadoProducto: formData.estadoProducto,
    sede: formData.sede,
    fechaActualizacion: serverTimestamp(),
  };

  if (imageFile) {
    const imageUrl = await uploadProductImage(imageFile, adminId);
    updatePayload.imagenUrl = imageUrl;
  }

  await updateDoc(docRef, updatePayload);
}