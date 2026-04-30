import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/router/Provider/useAuth';
import {
  PHONE_COUNTRY_OPTIONS,
  buildInternationalPhone,
  getPhoneInputConfig,
  sanitizePhoneDigits,
} from '../../services/utils/phoneUtils';

const genderOptions = [
  { value: '', label: 'Selecciona tu género' },
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'OTRO', label: 'Otro' },
];

const passwordRules = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (value) => value.length >= 8 },
  { id: 'uppercase', label: 'Una letra mayúscula', test: (value) => /[A-ZÁÉÍÓÚÑ]/.test(value) },
  { id: 'lowercase', label: 'Una letra minúscula', test: (value) => /[a-záéíóúñ]/.test(value) },
  { id: 'number', label: 'Un número', test: (value) => /\d/.test(value) },
];

function isPasswordSecure(password) {
  return passwordRules.every((rule) => rule.test(password));
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountryCode: '+57',
    phoneLocalNumber: '',
    password: '',
    confirmPassword: '',
    genero: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);

  const phoneConfig = useMemo(
    () => getPhoneInputConfig(form.phoneCountryCode),
    [form.phoneCountryCode]
  );

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === 'phoneLocalNumber') {
      setForm((prev) => ({
        ...prev,
        phoneLocalNumber: sanitizePhoneDigits(value, phoneConfig.maxLength),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCountryCodeSelect(value) {
    const nextConfig = getPhoneInputConfig(value);

    setForm((prev) => ({
      ...prev,
      phoneCountryCode: value,
      phoneLocalNumber: sanitizePhoneDigits(prev.phoneLocalNumber, nextConfig.maxLength),
    }));

    setPhoneCodeOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.firstName.trim()) {
      setError('Por favor ingresa tu nombre.');
      return;
    }

    if (!form.lastName.trim()) {
      setError('Por favor ingresa tu apellido.');
      return;
    }

    if (!form.email.trim()) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!form.phoneLocalNumber.trim()) {
      setError('Por favor ingresa tu número de contacto.');
      return;
    }

    if (form.phoneLocalNumber.length !== phoneConfig.maxLength) {
      setError(`El número debe tener ${phoneConfig.maxLength} dígitos para ${phoneConfig.shortLabel}.`);
      return;
    }

    if (!form.password) {
      setError('Por favor ingresa una contraseña.');
      return;
    }

    if (!isPasswordSecure(form.password)) {
      setError('La contraseña no cumple los requisitos mínimos de seguridad.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const telefonoContacto = buildInternationalPhone(
        form.phoneCountryCode,
        form.phoneLocalNumber
      );

      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        telefonoContacto,
        indicativoTelefono: form.phoneCountryCode,
        password: form.password,
        genero: form.genero,
      });

      navigate('/client');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo electrónico no es válido.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil. Usa mínimo 8 caracteres, mayúscula, minúscula y número.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('El registro está temporalmente deshabilitado.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Error en el proceso de registro. Inténtalo de nuevo.');
      } else {
        setError('Error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sf-authWrapper">
      <form className="sf-authForm" onSubmit={handleSubmit}>
        <span className="sf-authEyebrow">Registro</span>
        <h2>Crear cuenta</h2>
        <p className="sf-authSubtitle">
          Regístrate para acceder al catálogo con descuentos, gestionar tus pedidos y dejar tu contacto disponible.
        </p>

        <input
          type="text"
          name="firstName"
          placeholder="Nombre"
          value={form.firstName}
          onChange={handleChange}
          required
          className="sf-authInput"
        />
        <input
          type="text"
          name="lastName"
          placeholder="Apellido"
          value={form.lastName}
          onChange={handleChange}
          required
          className="sf-authInput"
        />
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          required
          className="sf-authInput"
        />

        <div className="sf-authPhoneGroup">
          <div
            className="sf-authPhoneField sf-authPhoneField--code"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setPhoneCodeOpen(false);
              }
            }}
          >
            <span className="sf-authFieldLabel">Indicativo</span>
            <div className="sf-authSelectBox sf-authSelectBox--phone">
              <button
                type="button"
                className={`sf-authSelectTrigger sf-authSelectTrigger--compact ${phoneCodeOpen ? 'sf-authSelectTrigger--open' : ''}`}
                onClick={() => {
                  setPhoneCodeOpen((prev) => !prev);
                  setGenderOpen(false);
                }}
                aria-haspopup="listbox"
                aria-expanded={phoneCodeOpen}
                aria-label="Selecciona el indicativo internacional"
              >
                <span>{phoneConfig.shortLabel}</span>
                <span className="sf-authSelectChevron" aria-hidden="true" />
              </button>

              {phoneCodeOpen && (
                <div className="sf-authSelectMenu sf-authSelectMenu--phone" role="listbox">
                  {PHONE_COUNTRY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`sf-authSelectOption ${form.phoneCountryCode === option.value ? 'sf-authSelectOption--active' : ''}`}
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

          <label className="sf-authPhoneField">
            <span className="sf-authFieldLabel">Número de contacto</span>
            <input
              type="tel"
              name="phoneLocalNumber"
              placeholder={phoneConfig.placeholder}
              value={form.phoneLocalNumber}
              onChange={handleChange}
              required
              className="sf-authInput"
              inputMode="numeric"
              maxLength={phoneConfig.maxLength}
            />
          </label>
        </div>

        <p className="sf-authHint">
          Se guardará como {form.phoneCountryCode} y ayudará a contactarte por llamada o WhatsApp si tu pedido lo requiere.
        </p>

        <div
          className="sf-authSelectBox"
          tabIndex={0}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setGenderOpen(false);
            }
          }}
        >
          <button
            type="button"
            className={`sf-authSelectTrigger ${genderOpen ? 'sf-authSelectTrigger--open' : ''}`}
            onClick={() => {
              setGenderOpen((prev) => !prev);
              setPhoneCodeOpen(false);
            }}
            aria-haspopup="listbox"
            aria-expanded={genderOpen}
          >
            <span>
              {genderOptions.find((option) => option.value === form.genero)?.label || 'Selecciona tu género'}
            </span>
            <span className="sf-authSelectChevron" aria-hidden="true" />
          </button>

          {genderOpen && (
            <div className="sf-authSelectMenu" role="listbox">
              {genderOptions.map((option) => (
                <button
                  key={option.value || 'empty'}
                  type="button"
                  className={`sf-authSelectOption ${form.genero === option.value ? 'sf-authSelectOption--active' : ''}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, genero: option.value }));
                    setGenderOpen(false);
                  }}
                  role="option"
                  aria-selected={form.genero === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          required
          className="sf-authInput"
        />

        <div className="sf-passwordRules" aria-label="Requisitos mínimos de contraseña">
          {passwordRules.map((rule) => {
            const completed = rule.test(form.password);

            return (
              <span
                key={rule.id}
                className={`sf-passwordRule ${completed ? 'sf-passwordRule--ok' : ''}`}
              >
                {rule.label}
              </span>
            );
          })}
        </div>

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirmar contraseña"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          className="sf-authInput"
        />

        {error && <p className="sf-authError">{error}</p>}

        <button type="submit" className="sf-authButton" disabled={loading}>
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>

        <div className="sf-authLinksSingle">
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
