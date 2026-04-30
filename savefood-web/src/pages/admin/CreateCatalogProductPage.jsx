import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCatalogForm from '../../components/forms/ProductCatalogForm';
import { useAuth } from '../../app/router/Provider/useAuth';
import { createCatalogProduct } from '../../services/catalog/catalogTotalService';

export default function CreateCatalogProductPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleCreate(formData, imageFile) {
    if (!currentUser?.uid) {
      throw new Error('No hay administrador autenticado.');
    }

    setLoading(true);

    try {
      await createCatalogProduct({
        formData,
        imageFile,
        adminId: currentUser.uid,
      });

      navigate('/admin/catalog-total');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h1>Crear producto en catálogo total</h1>
        <p style={styles.subtitle}>
          Registra un nuevo producto base del restaurante.
        </p>
      </div>

      <ProductCatalogForm
        onSubmit={handleCreate}
        submitText="Registrar producto"
        loading={loading}
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