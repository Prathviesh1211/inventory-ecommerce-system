import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCartStore } from '../store/cart.store';
import api from '../services/api';
import { useToastStore } from '../store/toast.store';

export default function CartPage() {
  const cart = useCartStore((state) => state.cart);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const updateItem = useCartStore((state) => state.updateItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const [error, setError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  useEffect(() => { fetchCart().catch(() => setError('Unable to load your cart.')); }, [fetchCart]);
  async function changeQuantity(productId, quantity) { try { await updateItem(productId, quantity); showToast('Cart quantity updated.', 'success'); } catch (err) { const message = err.response?.data?.message || 'Unable to update cart.'; setError(message); showToast(message, 'error'); } }
  async function removeCartItem(productId) { try { await removeItem(productId); showToast('Item removed from cart.', 'success'); } catch (err) { const message = err.response?.data?.message || 'Unable to remove item.'; setError(message); showToast(message, 'error'); } }
  async function checkout() { setError(''); setCheckingOut(true); try { const { data } = await api.post('/orders/checkout'); showToast('Order placed successfully.', 'success'); navigate(`/orders/${data.order._id}`); } catch (err) { const message = err.response?.data?.message || 'Checkout failed.'; setError(message); showToast(message, 'error'); } finally { setCheckingOut(false); } }
  if (!cart.items.length) return <section className="mx-auto max-w-xl rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center"><h1 className="font-display text-3xl">Your cart is empty</h1><Link className="mt-5 inline-block rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white" to="/">Browse products</Link></section>;
  return <section className="mx-auto max-w-4xl"><h1 className="font-display text-4xl font-semibold">Your cart</h1>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}<div className="mt-6 grid gap-6 md:grid-cols-[1fr_18rem]"><div className="space-y-3">{cart.items.map(({ product, quantity, lineTotal }) => <article key={product._id} className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-800">{product.category}</div><div className="min-w-0 flex-1"><h2 className="font-bold">{product.name}</h2><p className="text-sm text-stone-500">${product.price.toFixed(2)} each</p><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><button onClick={() => changeQuantity(product._id, quantity - 1)} disabled={quantity === 1} className="rounded border px-2 disabled:opacity-40">−</button><span>{quantity}</span><button onClick={() => changeQuantity(product._id, quantity + 1)} className="rounded border px-2">+</button></div><button onClick={() => removeCartItem(product._id)} className="text-sm font-medium text-red-600">Remove</button></div></div><p className="font-bold">${lineTotal.toFixed(2)}</p></article>)}</div><aside className="h-fit rounded-xl bg-stone-900 p-5 text-white"><h2 className="text-lg font-bold">Order summary</h2><div className="mt-5 flex justify-between text-stone-300"><span>Items ({cart.totalItems})</span><span>${cart.subtotal.toFixed(2)}</span></div><div className="mt-4 border-t border-stone-700 pt-4 text-lg font-bold"><span>Total</span><span className="float-right">${cart.subtotal.toFixed(2)}</span></div><button onClick={checkout} disabled={checkingOut} className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold hover:bg-emerald-400 disabled:opacity-60">{checkingOut ? 'Placing order…' : 'Place order'}</button><p className="mt-3 text-xs text-stone-400">No real payment is required for this demo.</p></aside></div></section>;
}
