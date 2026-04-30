import { useMemo, useState } from 'react';

const initialState = {
  nombreProducto: '',
  descripcion: '',
  categoria: '',
  precioBase: '',
  estadoProducto: 'ACTIVO',
  sede: 'Bosa',
};

const categories = [
  'Salchipapas',
  'Hamburguesas',
  'Perros calientes',
  'Adiciones',
  'Bebidas',
];

const statusOptions = ['ACTIVO', 'INACTIVO', 'RETIRADO'];

export default function ProductCatalogForm({
  initialValues,
  onSubmit,
  submitText = 'Guardar producto',
  loading = false,
  isEdit = false,
}) {
  const values = useMemo(
    () => ({
      ...initialState,
      ...initialValues,
      precioBase: initialValues?.precioBase ?? '',
    }),
    [initialValues]
  );

  const [form, setForm] = useState(values);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.nombreProducto.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    if (!form.descripcion.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }

    if (!form.categoria) {
      setError('Debe seleccionar una categoría.');
      return;
    }

    if (!form.precioBase || Number(form.precioBase) <= 0) {
      setError('El precio base debe ser mayor a cero.');
      return;
    }

    try {
      await onSubmit(form, imageFile);
    } catch (err) {
      setError(err.message || 'No fue posible guardar el producto.');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.grid}>
        <div>
          <label style={styles.label}>Nombre del producto</label>
          <input
            type="text"
            name="nombreProducto"
            value={form.nombreProducto}
            onChange={handleChange}
            style={styles.input}
            maxLength={100}
            required
          />
        </div>

        <div>
          <label style={styles.label}>Categoría</label>
          <select
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="">Seleccione una categoría</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.block}>
        <label style={styles.label}>Descripción</label>
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          style={styles.textarea}
          maxLength={500}
          rows={5}
          required
        />
      </div>

      <div style={styles.grid}>
        <div>
          <label style={styles.label}>Precio base</label>
          <input
            type="number"
            name="precioBase"
            value={form.precioBase}
            onChange={handleChange}
            style={styles.input}
            min="1"
            step="0.01"
            required
          />
        </div>

        <div>
          <label style={styles.label}>Estado del producto</label>
          <select
            name="estadoProducto"
            value={form.estadoProducto}
            onChange={handleChange}
            style={styles.input}
            required
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.grid}>
        <div>
          <label style={styles.label}>Sede</label>
          <input
            type="text"
            name="sede"
            value={form.sede}
            onChange={handleChange}
            style={styles.input}
            maxLength={80}
            required
          />
        </div>

        <div>
          <label style={styles.label}>
            {isEdit ? 'Cambiar imagen (opcional)' : 'Imagen del producto'}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.input}
          />
        </div>
      </div>

      {initialValues?.imagenUrl && (
        <div style={styles.previewWrap}>
          <span style={styles.label}>Imagen actual</span>
          <img
            src={initialValues.imagenUrl}
            alt={initialValues.nombreProducto || 'Producto'}
            style={styles.preview}
          />
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      <button type="submit" style={styles.button} disabled={loading}>
        {loading ? 'Guardando...' : submitText}
      </button>
    </form>
  );
}

const styles = {
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
  block: {
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
  textarea: {
    width: '100%',
    padding: '0.85rem',
    border: '1px solid #ddd',
    borderRadius: '10px',
    resize: 'vertical',
    background: '#fff',
  },
  button: {
    marginTop: '1rem',
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
  previewWrap: {
    marginTop: '1rem',
  },
  preview: {
    marginTop: '0.6rem',
    width: 'min(100%, 240px)',
    height: '140px',
    objectFit: 'cover',
    borderRadius: '12px',
    border: '1px solid #ddd',
  },
};
