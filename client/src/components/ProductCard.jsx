import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-44 items-center justify-center bg-emerald-50 p-4 text-center text-emerald-900">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="font-display text-3xl">{product.category}</span>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-bold tracking-wider text-emerald-700 uppercase">
          {product.category}
        </p>
        <h2 className="mt-1 text-lg font-bold">{product.name}</h2>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-stone-600">
          {product.description}
        </p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-bold">₹{product.price.toFixed(2)}</p>
            <p
              className={
                product.stock === 0
                  ? "text-xs text-red-600"
                  : "text-xs text-stone-500"
              }
            >
              {product.inventoryStatus}
            </p>
          </div>
          <Link
            to={`/products/${product._id}`}
            className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
