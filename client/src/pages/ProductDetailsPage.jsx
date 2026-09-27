import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { useCartStore } from '../store/cart.store';
import { useToastStore } from '../store/toast.store';

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const user = useAuthStore((state) => state.user);
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { api.get(`/products/${productId}`).then(({ data }) => setProduct(data.product)).catch((err) => setError(err.response?.data?.message || 'Unable to load product.')); }, [productId]);
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!product) return <p className="py-16 text-center text-stone-500">Loading product…</p>;
  async function addToCart() { if (!user) return navigate('/login', { state: { from: `/products/${productId}` } }); try { await addItem(product._id); setMessage('Added to cart.'); showToast('Product added to cart.', 'success'); } catch (err) { const message = err.response?.data?.message || 'Unable to add to cart.'; setError(message); showToast(message, 'error'); } }
  return <article className="mx-auto grid max-w-4xl gap-8 rounded-2xl border border-stone-200 bg-white p-6 md:grid-cols-2 md:p-10"><div className="flex min-h-64 items-center justify-center rounded-xl bg-emerald-50 text-center font-display text-4xl text-emerald-900">{product.image ? <img src={product.image} alt={product.name} className="max-h-72 object-contain" /> : product.category}</div><div><Link to="/" className="text-sm font-medium text-emerald-700">← Back to products</Link><p className="mt-6 text-sm font-bold tracking-wider text-emerald-700 uppercase">{product.category}</p><h1 className="mt-2 font-display text-4xl font-semibold">{product.name}</h1><p className="mt-5 leading-7 text-stone-600">{product.description}</p><p className="mt-6 text-3xl font-bold">${product.price.toFixed(2)}</p><p className="mt-2 text-sm text-stone-600">{product.inventoryStatus} · {product.stock} available</p>{message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}<button onClick={addToCart} disabled={product.stock === 0} className="mt-7 w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300">{product.stock === 0 ? 'Out of stock' : 'Add to cart'}</button></div></article>;
}
