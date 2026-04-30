import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/router/Provider/useAuth';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Ingresa el correo electrónico asociado a tu cuenta.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(cleanEmail);
      setMessage('Si el correo está registrado, recibirás un enlace seguro para cambiar tu contraseña. Revisa también la carpeta de spam.');
      setEmail('');
    } catch (err) {
      if (err.code === 'auth/invalid-email') {
        setError('Ingresa un correo electrónico válido.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Se realizaron demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
      } else {
        setError('No fue posible enviar el enlace de recuperación. Inténtalo nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sf-authWrapper">
      <form className="sf-authForm" onSubmit={handleSubmit}>
        <span className="sf-authEyebrow">Recuperación</span>
        <h2>Recuperar contraseña</h2>
        <p className="sf-authSubtitle">
          Ingresa tu correo electrónico y te enviaremos un enlace seguro para cambiar tu contraseña.
        </p>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="sf-authInput"
        />

        <p className="sf-authHint">
          El enlace se envía desde Firebase Authentication y solo funciona por tiempo limitado.
        </p>

        {message && <p className="sf-authSuccess">{message}</p>}
        {error && <p className="sf-authError">{error}</p>}

        <button type="submit" className="sf-authButton" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar enlace seguro'}
        </button>

        <p className="sf-authLinksSingle">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </form>
    </div>
  );
}
