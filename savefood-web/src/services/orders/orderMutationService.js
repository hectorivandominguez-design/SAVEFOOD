import { postFunction } from '../functions/functionHttpService';

export async function createOrderWithItems({
  sede = 'Bosa',
  items = [],
  comentarioPedido = '',
}) {
  const result = await postFunction(
    'createOrder',
    { sede, items, comentarioPedido: String(comentarioPedido || '').trim() },
    { authenticated: true }
  );

  return result.orderId;
}

export async function cancelOrderByClient({
  orderId,
  motivoCancelacion,
}) {
  return postFunction(
    'cancelOrder',
    { orderId, motivoCancelacion },
    { authenticated: true }
  );
}

export async function updateOrderStatusByAdmin({
  orderId,
  newStatus,
}) {
  return postFunction(
    'updateOrderStatus',
    { orderId, newStatus },
    { authenticated: true }
  );
}
