import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ExpiringProductForm from '../../components/forms/ExpiringProductForm';
import {
  getExpiringProductById,
  updateExpiringProduct,
} from '../../services/catalog/expiringProductsService';

export default function EditExpiringProductPage() {
  const { id } = useParams();
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
        const result = await getExpiringProductById(id);
        setProduct(result);
      } catch (err) {
        setError('No fue posible cargar la publicación.');
      } finally {
        setLoadingPage(false);
      }
    }

    if (id) {
      loadProduct();
    }
  }, [id]);

  async function handleUpdate(formData) {
    setLoadingSave(true);

    try {
      await updateExpiringProduct({
        expiringProductId: id,
        formData,
      });

      navigate('/admin/expiring');
    } finally {
      setLoadingSave(false);
    }
  }

  if (loadingPage) {
    return <div style={styles.loadingCard}>Cargando publicación seleccionada...</div>;
  }

  if (error) {
    return (
      <div style={styles.errorCard}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  if (!product) {
    return <p>No se encontró la publicación.</p>;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h1>Editar producto próximo a vencer</h1>
        <p style={styles.subtitle}>
          Actualiza la información de la publicación seleccionada.
        </p>
      </div>

      <ExpiringProductForm
        catalogProduct={{
          nombreProducto: product.nombreProductoSnapshot,
          categoria: product.categoriaSnapshot,
          precioBase: product.precioBaseSnapshot,
          imagenUrl: product.imagenUrl,
          sede: product.sede,
        }}
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
  loadingCard: {
    background: '#fff',
    padding: '1.25rem',
    borderRadius: '16px',
    color: '#6b7280',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  },
  errorCard: {
    background: '#fff',
    padding: '1.25rem',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  },
  error: {
    color: '#c62828',
    margin: 0,
  },
};
