import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../app/router/Provider/useAuth';
import {
  PHONE_COUNTRY_OPTIONS,
  buildInternationalPhone,
  extractPhoneParts,
  getPhoneInputConfig,
  sanitizePhoneDigits,
} from '../../services/utils/phoneUtils';

function normalizeGenderValue(value) {
  if (value === 'M') return 'MASCULINO';
  if (value === 'F') return 'FEMENINO';
  if (value === 'O') return 'OTRO';
  return value || '';
}

export default function ProfilePage() {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const genderOptions = [
    { value: '', label: 'Prefiero no decirlo' },
    { value: 'FEMENINO', label: 'Femenino' },
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'OTRO', label: 'Otro' },
  ];

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    genero: '',
    phoneCountryCode: '+57',
    phoneLocalNumber: '',
  });
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);

  useEffect(() => {
    const phoneParts = extractPhoneParts(
      userProfile?.telefonoContacto || '',
      userProfile?.indicativoTelefono || '+57'
    );

    setForm({
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
      genero: normalizeGenderValue(userProfile?.genero),
      phoneCountryCode: phoneParts.countryCode,
      phoneLocalNumber: phoneParts.localNumber,
    });
  }, [userProfile]);

  const phoneConfig = useMemo(
    () => getPhoneInputConfig(form.phoneCountryCode),
    [form.phoneCountryCode]
  );

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const authEmail = currentUser?.email || '';
  const profileEmail = userProfile?.email || '';
  const hasEmailMismatch = authEmail && profileEmail && authEmail !== profileEmail;

  function handleCountryCodeSelect(value) {
    setForm((prev) => ({
      ...prev,
      phoneCountryCode: value,
      phoneLocalNumber: sanitizePhoneDigits(
        prev.phoneLocalNumber,
        getPhoneInputConfig(value).maxLength
      ),
    }));
    setPhoneCodeOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        throw new Error('Completa tu nombre y apellido.');
      }

      if (form.phoneLocalNumber.length !== phoneConfig.maxLength) {
        throw new Error(`El número de contacto debe tener ${phoneConfig.maxLength} dígitos para ${phoneConfig.shortLabel}.`);
      }

      await updateUserProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        genero: form.genero,
        indicativoTelefono: form.phoneCountryCode,
        telefonoContacto: buildInternationalPhone(
          form.phoneCountryCode,
          form.phoneLocalNumber
        ),
      });
      setMessage('Perfil actualizado correctamente.');
    } catch (err) {
      setError(err.message || 'No fue posible actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Mi perfil</h1>
        <p style={styles.subtitle}>Consulta y actualiza tu información básica.</p>
        <p style={styles.helperText}>
          Mantén tus datos al día para que tu cuenta esté completa y sea más fácil gestionar tus pedidos.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Nombres</label>
              <input
                style={styles.input}
                type="text"
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Apellidos</label>
              <input
                style={styles.input}
                type="text"
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                required
              />
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.phoneGroup}>
              <div
                style={styles.phoneCodeColumn}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setPhoneCodeOpen(false);
                  }
                }}
              >
                <label style={styles.label}>Indicativo</label>
                <div style={styles.selectBox}>
                  <button
                    type="button"
                    style={{
                      ...styles.selectTrigger,
                      ...(phoneCodeOpen ? styles.selectTriggerOpen : {}),
                    }}
                    onClick={() => setPhoneCodeOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={phoneCodeOpen}
                  >
                    <span>{phoneConfig.shortLabel}</span>
                    <span style={styles.selectChevron} aria-hidden="true" />
                  </button>

                  {phoneCodeOpen && (
                    <div style={styles.selectMenu} role="listbox">
                      {PHONE_COUNTRY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          style={{
                            ...styles.selectOption,
                            ...(form.phoneCountryCode === option.value ? styles.selectOptionActive : {}),
                          }}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleCountryCodeSelect(option.value)}
                          role="option"
                          aria-selected={form.phoneCountryCode === option.value}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.phoneNumberColumn}>
                <label style={styles.label}>Número de contacto</label>
                <input
                  style={styles.input}
                  type="tel"
                  value={form.phoneLocalNumber}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      phoneLocalNumber: sanitizePhoneDigits(
                        event.target.value,
                        phoneConfig.maxLength
                      ),
                    }))
                  }
                  required
                  maxLength={phoneConfig.maxLength}
                  inputMode="numeric"
                  placeholder={phoneConfig.placeholder}
                />
              </div>
            </div>

            <div>
              <label style={styles.label}>Correo de acceso</label>
              <input style={styles.input} type="email" value={authEmail || profileEmail} disabled />
            </div>
          </div>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Género</label>
              <select
                style={styles.input}
                value={form.genero}
                onChange={(event) => setForm({ ...form, genero: event.target.value })}
              >
                {genderOptions.map((option) => (
                  <option key={option.value || 'empty'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Rol</label>
              <input style={styles.input} type="text" value={userProfile?.rol || ''} disabled />
            </div>
          </div>

          {hasEmailMismatch && (
            <div style={styles.warningBox}>
              <strong>Correo desincronizado</strong>
              <p>
                El acceso todavía usa <b>{authEmail}</b>. El correo del perfil en Firestore es <b>{profileEmail}</b>. Para iniciar sesión con el nuevo correo, también debes actualizarlo en Firebase Authentication.
              </p>
            </div>
          )}

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Estado de cuenta</label>
              <input
                style={styles.input}
                type="text"
                value={userProfile?.estadoCuenta || ''}
                disabled
              />
            </div>
          </div>

          {message && <p style={styles.success}>{message}</p>}
          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: '100%',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: 'clamp(1.25rem, 3vw, 2rem)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    maxWidth: '900px',
  },
  title: {
    marginBottom: '0.5rem',
  },
  subtitle: {
    marginBottom: '0.65rem',
    color: '#6b7280',
  },
  helperText: {
    marginBottom: '1.5rem',
    color: '#374151',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  phoneGroup: {
    display: 'grid',
    gridTemplateColumns: 'minmax(110px, 130px) minmax(0, 1fr)',
    gap: '0.75rem',
  },
  phoneCodeColumn: {
    minWidth: 0,
  },
  phoneNumberColumn: {
    minWidth: 0,
  },
  label: {
    display: 'block',
    marginBottom: '0.4rem',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '10px',
    border: '1px solid #ddd',
    background: '#fff',
  },
  selectBox: {
    position: 'relative',
    zIndex: 6,
  },
  selectTrigger: {
    position: 'relative',
    width: '100%',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '0 46px 0 14px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    background: '#fff',
    color: '#111827',
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  selectTriggerOpen: {
    borderColor: '#c62828',
    boxShadow: '0 0 0 4px rgba(198, 40, 40, 0.08)',
    outline: 'none',
  },
  selectChevron: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    width: '24px',
    height: '24px',
    borderRadius: '999px',
    background: '#f4f5f7',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  selectMenu: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 'calc(100% + 8px)',
    display: 'grid',
    gap: '4px',
    maxHeight: '240px',
    overflowY: 'auto',
    padding: '6px',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.16)',
    zIndex: 20,
  },
  selectOption: {
    width: '100%',
    minHeight: '42px',
    padding: '0 12px',
    border: 0,
    borderRadius: '10px',
    background: 'transparent',
    color: '#374151',
    font: 'inherit',
    fontWeight: '700',
    textAlign: 'left',
    cursor: 'pointer',
  },
  selectOptionActive: {
    background: '#c62828',
    color: '#ffffff',
  },
  warningBox: {
    background: '#fff7ed',
    border: '1px solid rgba(180, 83, 9, 0.22)',
    color: '#7c2d12',
    borderRadius: '14px',
    padding: '0.9rem 1rem',
    marginBottom: '1rem',
    lineHeight: '1.6',
  },
  button: {
    marginTop: '1rem',
    background: '#c62828',
    color: '#fff',
    border: 'none',
    padding: '0.9rem 1.2rem',
    borderRadius: '10px',
    cursor: 'pointer',
    width: '100%',
  },
  success: {
    color: '#15803d',
    marginTop: '0.5rem',
  },
  error: {
    color: '#c62828',
    marginTop: '0.5rem',
  },
};
