import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../app/router/Provider/useAuth';
import ExpiringProductForm from '../../components/forms/ExpiringProductForm';
import {
  createExpiringProduct,
  getCatalogProductForPublishing,
} from '../../services/catalog/expiringProductsService';

export default function CreateExpiringProductPage() {
  const { productId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [catalogProduct, setCatalogProduct] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProduct() {
      setLoadingPage(true);
      setError('');

      try {
        const result = await getCatalogProductForPublishing(productId);
        setCatalogProduct(result);
      } catch (err) {
        setError('No fue posible cargar el producto seleccionado.');
      } finally {
        setLoadingPage(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  async function handleCreate(formData) {
    if (!currentUser?.uid) {
      throw new Error('No hay administrador autenticado.');
    }

    if (!catalogProduct) {
      throw new Error('No hay producto base cargado.');
    }

    setLoadingSave(true);

    try {
      await createExpiringProduct({
        catalogProduct,
        publishData: formData,
        adminId: currentUser.uid,
      });

      navigate('/admin/expiring');
    } finally {
      setLoadingSave(false);
    }
  }

  if (loadingPage) {
    return <div style={styles.loadingCard}>Cargando producto base seleccionado...</div>;
  }

  if (error) {
    return (
      <div style={styles.errorCard}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  if (!catalogProduct) {
    return <p>No se encontró el producto base.</p>;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h1>Publicar producto próximo a vencer</h1>
        <p style={styles.subtitle}>
          Configura precio especial, cantidad disponible, vencimiento y estado de publicación.
        </p>
      </div>

      <ExpiringProductForm
        catalogProduct={catalogProduct}
        onSubmit={handleCreate}
        submitText="Publicar producto"
        loading={loadingSave}
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
