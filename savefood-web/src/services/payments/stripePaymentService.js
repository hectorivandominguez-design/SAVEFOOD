import { postFunction } from '../functions/functionHttpService';

export async function createStripeCheckoutSession(orderId) {
  return postFunction(
    'createCheckoutSession',
    { orderId },
    { authenticated: true }
  );
}

export async function confirmStripeCheckoutSession(sessionId) {
  return postFunction('confirmCheckoutSession', { sessionId });
}
