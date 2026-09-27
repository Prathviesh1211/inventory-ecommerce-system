import { Link, useLocation, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';

const statusColor = { Placed: 'bg-blue-50 text-blue-700', Processing: 'bg-amber-50 text-amber-700', Shipped: 'bg-purple-50 text-purple-700', Delivered: 'bg-emerald-50 text-emerald-700', Cancelled: 'bg-red-50 text-red-700' };

export function OrdersPage() {
  const [orders, setOrders] = useState([]); const [error, setError] = useState('');
  useEffect(() => { api.get('/orders').then(({ data }) => setOrders(data.orders)).catch(() => setError('Unable to load your orders.')); }, []);
  return <section><h1 className="font-display text-4xl font-semibold">Your orders</h1>{error && <p className="mt-4 text-red-700">{error}</p>}{!error && !orders.length && <p className="mt-6 rounded-xl border border-dashed p-8 text-stone-500">You have not placed an order yet.</p>}<div className="mt-6 space-y-3">{orders.map((order) => <Link key={order._id} to={`/orders/${order._id}`} className="block rounded-xl border border-stone-200 bg-white p-5 hover:border-emerald-500"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-bold">{order.orderNumber}</p><p className="text-sm text-stone-500">{new Date(order.createdAt).toLocaleString()}</p></div><span className={`h-fit rounded-full px-3 py-1 text-sm font-semibold ${statusColor[order.status]}`}>{order.status}</span></div><p className="mt-3 font-bold">${order.totalAmount.toFixed(2)} · {order.items.length} item(s)</p></Link>)}</div></section>;
}

export function OrderDetailsPage() {
  const { orderId } = useParams(); const location = useLocation(); const [order, setOrder] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get(`/orders/${orderId}`).then(({ data }) => setOrder(data.order)).catch((err) => setError(err.response?.data?.message || 'Unable to load order.')); }, [orderId]);
  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>; if (!order) return <p className="py-12 text-center text-stone-500">Loading order…</p>;
  return <section className="mx-auto max-w-3xl"><Link to="/orders" className="text-sm font-semibold text-emerald-700">← All orders</Link>{location.state?.message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-emerald-800">{location.state.message}</p>}<div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6"><div className="flex justify-between gap-4"><div><h1 className="font-display text-3xl font-semibold">Order confirmed</h1><p className="mt-1 text-sm text-stone-500">{order.orderNumber}</p></div><span className={`h-fit rounded-full px-3 py-1 text-sm font-semibold ${statusColor[order.status]}`}>{order.status}</span></div><div className="mt-6 divide-y">{order.items.map((item) => <div key={item._id} className="flex justify-between py-4"><div><p className="font-bold">{item.productName}</p><p className="text-sm text-stone-500">{item.sku} · ${item.unitPrice.toFixed(2)} × {item.quantity}</p></div><p className="font-semibold">${item.lineTotal.toFixed(2)}</p></div>)}</div><div className="mt-4 text-right text-xl font-bold">Total: ${order.totalAmount.toFixed(2)}</div><p className="mt-6 text-sm text-stone-500">Payment method: Not Applicable · Payment status: Not Required</p></div></section>;
}
