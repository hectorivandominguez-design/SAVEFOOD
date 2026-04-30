import { useMemo, useState } from 'react';

const initialState = {
  precioEspecial: '',
  cantidadDisponible: '',
  fechaVencimiento: '',
  estadoPublicacion: 'DISPONIBLE',
};

const publicationStatus = ['DISPONIBLE', 'AGOTADO', 'VENCIDO', 'RETIRADO'];

export default function ExpiringProductForm({
  catalogProduct,
  initialValues,
  onSubmit,
  submitText = 'Guardar publicación',
  loading = false,
}) {
  const values = useMemo(
    () => ({
      ...initialState,
      ...initialValues,
      precioEspecial: initialValues?.precioEspecial ?? '',
      cantidadDisponible: initialValues?.cantidadDisponible ?? '',
      fechaVencimiento: initialValues?.fechaVencimiento ?? '',
    }),
    [initialValues]
  );

  const [form, setForm] = useState(values);
  const [error, setError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.precioEspecial || Number(form.precioEspecial) <= 0) {
      setError('El precio especial debe ser mayor a cero.');
      return;
    }

    if (
      catalogProduct?.precioBase &&
      Number(form.precioEspecial) > Number(catalogProduct.precioBase)
    ) {
      setError('El precio especial no debe superar el precio base.');
      return;
    }

    if (!form.cantidadDisponible || Number(form.cantidadDisponible) < 0) {
      setError('La cantidad disponible debe ser igual o mayor a cero.');
      return;
    }

    if (!form.fechaVencimiento) {
      setError('Debe indicar la fecha de vencimiento.');
      return;
    }

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || 'No fue posible guardar la publicación.');
    }
  }

  return (
    <div style={styles.wrapper}>
      {catalogProduct && (
        <div style={styles.previewCard}>
          <h3 style={styles.previewTitle}>Producto seleccionado</h3>

          <div style={styles.previewGrid}>
            <div style={styles.imageWrap}>
              {catalogProduct.imagenUrl ? (
                <img
                  src={catalogProduct.imagenUrl}
                  alt={catalogProduct.nombreProducto}
                  style={styles.image}
                />
              ) : (
                <div style={styles.placeholder}>Sin imagen</div>
              )}
            </div>

            <div>
              <p><b>Nombre:</b> {catalogProduct.nombreProducto}</p>
              <p><b>Categoría:</b> {catalogProduct.categoria}</p>
              <p>
                <b>Precio base:</b>{' '}
                ${Number(catalogProduct.precioBase || 0).toLocaleString('es-CO')}
              </p>
              <p><b>Sede:</b> {catalogProduct.sede || 'Bosa'}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          <div>
            <label style={styles.label}>Precio especial</label>
            <input
              type="number"
              name="precioEspecial"
              value={form.precioEspecial}
              onChange={handleChange}
              style={styles.input}
              min="1"
              step="0.01"
              required
            />
          </div>

          <div>
            <label style={styles.label}>Cantidad disponible</label>
            <input
              type="number"
              name="cantidadDisponible"
              value={form.cantidadDisponible}
              onChange={handleChange}
              style={styles.input}
              min="0"
              step="1"
              required
            />
          </div>
        </div>

        <div style={styles.grid}>
          <div>
            <label style={styles.label}>Fecha de vencimiento</label>
            <input
              type="date"
              name="fechaVencimiento"
              value={form.fechaVencimiento}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div>
            <label style={styles.label}>Estado de publicación</label>
            <select
              name="estadoPublicacion"
              value={form.estadoPublicacion}
              onChange={handleChange}
              style={styles.input}
              required
            >
              {publicationStatus.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Guardando...' : submitText}
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'grid',
    gap: '1rem',
  },
  previewCard: {
    background: '#fff',
    borderRadius: '18px',
    padding: 'clamp(1.1rem, 2.5vw, 1.5rem)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  },
  previewTitle: {
    marginBottom: '1rem',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    alignItems: 'start',
  },
  imageWrap: {
    height: '160px',
    borderRadius: '14px',
    overflow: 'hidden',
    background: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'grid',
    placeItems: 'center',
    color: '#777',
  },
  form: {
    background: '#fff',
    borderRadius: '18px',
    padding: 'clamp(1.25rem, 3vw, 2rem)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.45rem',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '0.85rem',
    border: '1px solid #ddd',
    borderRadius: '10px',
    background: '#fff',
  },
  button: {
    marginTop: '0.5rem',
    background: '#c62828',
    color: '#fff',
    border: 'none',
    padding: '0.9rem 1.25rem',
    borderRadius: '10px',
    cursor: 'pointer',
    width: '100%',
  },
  error: {
    marginTop: '0.5rem',
    color: '#c62828',
  },
};
