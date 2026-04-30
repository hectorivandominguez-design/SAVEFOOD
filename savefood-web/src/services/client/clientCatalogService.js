import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { postFunction } from '../functions/functionHttpService';

const EXPIRING_COLLECTION_NAME = 'EXPIRING_PRODUCTS';
const CATALOG_COLLECTION_NAME = 'PRODUCTS_CATALOG';

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

export function isExpiredProduct(product) {
  const expirationDate = parseExpirationDate(product?.fechaVencimiento);

  if (!expirationDate) {
    return false;
  }

  return expirationDate.getTime() < Date.now();
}

export async function getVisibleExpiringProducts() {
  const collectionRef = collection(db, EXPIRING_COLLECTION_NAME);
  const q = query(
    collectionRef,
    where('estadoPublicacion', 'in', ['DISPONIBLE', 'AGOTADO'])
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .filter((item) => !isExpiredProduct(item))
    .sort((a, b) => {
      const left = a.fechaPublicacion?.seconds || 0;
      const right = b.fechaPublicacion?.seconds || 0;
      return right - left;
    });
}

export async function getVisibleExpiringProductById(expiringProductId) {
  const docRef = doc(db, EXPIRING_COLLECTION_NAME, expiringProductId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('Producto no encontrado.');
  }

  const product = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  if (
    !['DISPONIBLE', 'AGOTADO'].includes(product.estadoPublicacion) ||
    isExpiredProduct(product)
  ) {
    throw new Error('Este producto ya no está disponible para el catálogo público.');
  }

  if (!product.descripcionSnapshot && product.productId) {
    try {
      const catalogSnapshot = await getDoc(doc(db, CATALOG_COLLECTION_NAME, product.productId));

      if (catalogSnapshot.exists()) {
        const catalogProduct = catalogSnapshot.data();
        product.descripcionSnapshot = catalogProduct.descripcion || '';
      }
    } catch (error) {
      product.descripcionSnapshot = product.descripcionSnapshot || '';
    }
  }

  if (!product.descripcionSnapshot) {
    try {
      const response = await postFunction('getPublicProductDescription', {
        expiringProductId,
      });

      product.descripcionSnapshot = response.descripcionSnapshot || '';
    } catch (error) {
      product.descripcionSnapshot = product.descripcionSnapshot || '';
    }
  }

  return product;
}
