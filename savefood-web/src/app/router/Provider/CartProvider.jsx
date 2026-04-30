import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function getAvailableStock(product) {
    const stock = Number(product?.cantidadDisponible || 0);
    return Number.isFinite(stock) && stock > 0 ? stock : 0;
  }

  function addToCart(product, quantity = 1) {
    setItems((prev) => {
      const requestedQuantity = Number(quantity || 0);
      const availableStock = getAvailableStock(product);

      if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0 || availableStock <= 0) {
        return prev;
      }

      const existing = prev.find(
        (item) => item.expiringProductId === product.expiringProductId
      );

      if (existing) {
        const nextQuantity = Math.min(existing.quantity + requestedQuantity, existing.availableStock);

        return prev.map((item) =>
          item.expiringProductId === product.expiringProductId
            ? {
                ...item,
                availableStock,
                quantity: nextQuantity,
                subtotal: nextQuantity * item.precioEspecial,
              }
            : item
        );
      }

      const initialQuantity = Math.min(requestedQuantity, availableStock);

      return [
        ...prev,
        {
          expiringProductId: product.expiringProductId,
          productId: product.productId,
          nombreProductoSnapshot: product.nombreProductoSnapshot,
          categoriaSnapshot: product.categoriaSnapshot || product.categoria || '',
          descripcionSnapshot: product.descripcionSnapshot || product.descripcion || '',
          precioUnitarioSnapshot: Number(product.precioEspecial),
          precioEspecial: Number(product.precioEspecial),
          availableStock,
          quantity: initialQuantity,
          subtotal: Number(product.precioEspecial) * initialQuantity,
          imagenUrl: product.imagenUrl || '',
          estadoPublicacion: product.estadoPublicacion,
        },
      ];
    });
  }

  function removeFromCart(expiringProductId) {
    setItems((prev) =>
      prev.filter((item) => item.expiringProductId !== expiringProductId)
    );
  }

  function updateQuantity(expiringProductId, quantity) {
    if (quantity <= 0) {
      removeFromCart(expiringProductId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.expiringProductId === expiringProductId
          ? {
              ...item,
              quantity: Math.min(Number(quantity), Number(item.availableStock || quantity)),
              subtotal:
                Math.min(Number(quantity), Number(item.availableStock || quantity))
                * item.precioUnitarioSnapshot,
            }
          : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + item.subtotal, 0);

  const value = useMemo(
    () => ({
      items,
      totalItems,
      totalAmount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [items, totalItems, totalAmount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }

  return context;
}
