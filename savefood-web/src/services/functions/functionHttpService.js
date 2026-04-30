import { auth } from '../firebase/config';

const FUNCTIONS_BASE_URL = (
  import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  'https://us-central1-savefood-69626.cloudfunctions.net'
).replace(/\/+$/, '');

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error en la operación.');
  }

  return data;
}

async function buildHeaders(authenticated) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (!authenticated) {
    return headers;
  }

  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('Debes iniciar sesión para continuar.');
  }

  const token = await currentUser.getIdToken();
  headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function postFunction(path, body = {}, { authenticated = false } = {}) {
  if (!FUNCTIONS_BASE_URL) {
    throw new Error('Falta configurar VITE_FUNCTIONS_BASE_URL.');
  }

  let response;

  try {
    response = await fetch(`${FUNCTIONS_BASE_URL}/${path}`, {
      method: 'POST',
      headers: await buildHeaders(authenticated),
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(
      'No fue posible conectar con el servidor. Verifica que reiniciaste Vite y que la URL de Functions sea accesible.'
    );
  }

  return handleResponse(response);
}

