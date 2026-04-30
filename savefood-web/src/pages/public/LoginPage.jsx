import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/router/Provider/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(form.email, form.password);

      if (result?.profile?.rol === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/client');
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo electrónico.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Intenta más tarde.');
      } else if (err.code === 'auth/user-disabled') {
        setError('Esta cuenta ha sido deshabilitada.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else if (err.message?.includes('no está registrada completamente')) {
        setError('Esta cuenta no está registrada completamente. Por favor, regístrate primero.');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sf-authWrapper">
      <form className="sf-authForm" onSubmit={handleSubmit}>
        <span className="sf-authEyebrow">Acceso</span>
        <h2>Iniciar sesión</h2>
        <p className="sf-authSubtitle">
          Entra a SAVE FOOD para revisar ofertas, pedidos y tu información de cuenta.
        </p>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="sf-authInput"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          className="sf-authInput"
        />

        {error && <p className="sf-authError">{error}</p>}

        <button type="submit" className="sf-authButton" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div className="sf-authLinksRow">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          <Link to="/register">Crear cuenta</Link>
        </div>
      </form>
    </div>
  );
}
