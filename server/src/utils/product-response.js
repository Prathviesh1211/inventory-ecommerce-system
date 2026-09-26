export function productResponse(product) {
  const source = product.toObject ? product.toObject({ virtuals: true }) : product;
  const inventoryStatus = source.stock === 0 ? 'Out of Stock' : source.stock <= 5 ? 'Low Stock' : 'In Stock';
  return { ...source, inventoryStatus };
}
