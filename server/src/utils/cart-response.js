import { productResponse } from './product-response.js';

export function cartResponse(user) {
  const items = user.cart
    .filter((item) => item.product)
    .map((item) => {
      const product = item.product;
      return {
        product: productResponse(product),
        quantity: item.quantity,
        lineTotal: Number((product.price * item.quantity).toFixed(2)),
      };
    });

  return {
    items,
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: Number(items.reduce((total, item) => total + item.lineTotal, 0).toFixed(2)),
  };
}
