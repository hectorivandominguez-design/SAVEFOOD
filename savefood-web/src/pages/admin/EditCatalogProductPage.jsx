import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductCatalogForm from '../../components/forms/ProductCatalogForm';
import { useAuth } from '../../app/router/Provider/useAuth';
import {
  getCatalogProductById,
  updateCatalogProduct,
} from '../../services/catalog/catalogTotalService';

export default function EditCatalogProductPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProduct() {
      setLoadingPage(true);
      setError('');

      try {
        const data = await getCatalogProductById(id);
        setProduct(data);
      } catch (err) {
        setError('No fue posible cargar el producto.');
      } finally {
        setLoadingPage(false);
      }
    }

    if (id) {
      loadProduct();
    }
  }, [id]);

  async function handleUpdate(formData, imageFile) {
    if (!currentUser?.uid) {
      throw new Error('No hay administrador autenticado.');
    }

    setLoadingSave(true);

    try {
      await updateCatalogProduct({
        productId: id,
        formData,
        imageFile,
        adminId: currentUser.uid,
      });

      navigate('/admin/catalog-total');
    } finally {
      setLoadingSave(false);
    }
  }

  if (loadingPage) {
    return <p>Cargando producto...</p>;
  }

  if (error) {
    return <p style={{ color: '#c62828' }}>{error}</p>;
  }

  if (!product) {
    return <p>No se encontró el producto.</p>;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h1>Editar producto del catálogo total</h1>
        <p style={styles.subtitle}>
          Actualiza la información base del producto seleccionado.
        </p>
      </div>

      <ProductCatalogForm
        initialValues={product}
        onSubmit={handleUpdate}
        submitText="Guardar cambios"
        loading={loadingSave}
        isEdit
      />
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'grid',
    gap: '1rem',
  },
  header: {
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: '0.35rem',
  },
};