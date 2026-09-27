import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

const initialFilters = { search: '', category: '', sort: 'newest', page: 1 };

export default function HomePage() {
  const [filters, setFilters] = useState(initialFilters);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCategories(data.categories)).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError('');
    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await api.get('/products', { params: { ...filters, limit: 12 } });
        if (isActive) { setProducts(data.products); setPagination(data.pagination); }
      } catch (requestError) {
        if (isActive) setError(requestError.response?.data?.message || 'Unable to load products.');
      } finally {
        if (isActive) setLoading(false);
      }
    }, 250);
    return () => { isActive = false; clearTimeout(timeoutId); };
  }, [filters]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
  }

  return (
    <section>
      <div className="mb-8 max-w-2xl"><p className="text-sm font-bold tracking-widest text-emerald-700 uppercase">Simple inventory, securely sold</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Find what your workspace needs.</h1><p className="mt-3 text-stone-600">Browse current availability and product details.</p></div>
      <div className="mb-7 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-3">
        <input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search products" className="rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-emerald-600" />
        <select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)} className="rounded-lg border border-stone-300 px-3 py-2"><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
        <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)} className="rounded-lg border border-stone-300 px-3 py-2"><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name_asc">Name: A–Z</option></select>
      </div>
      {loading && <p className="py-16 text-center text-stone-500">Loading products…</p>}
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {!loading && !error && products.length === 0 && <p className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-stone-500">No products match these filters.</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>
      {pagination?.totalPages > 1 && <div className="mt-8 flex justify-center gap-3"><button disabled={pagination.page === 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="rounded-lg border px-4 py-2 disabled:opacity-40">Previous</button><span className="py-2 text-sm text-stone-600">Page {pagination.page} of {pagination.totalPages}</span><button disabled={pagination.page === pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="rounded-lg border px-4 py-2 disabled:opacity-40">Next</button></div>}
    </section>
  );
}
