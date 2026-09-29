import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminNav from "../components/AdminNav";
import api from "../services/api";
import { useToastStore } from "../store/toast.store";

const emptyProduct = {
  name: "",
  sku: "",
  description: "",
  category: "",
  price: "",
  image: "",
  stock: "",
};
const number = (value) => Number(value || 0).toFixed(2);

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then(({ data: response }) => setData(response))
      .catch(() => setError("Unable to load dashboard."));
  }, []);
  return (
    <AdminShell title="Admin dashboard">
      {error && <p className="text-red-700">{error}</p>}
      {!data ? (
        <p>Loading dashboard…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Products", data.products.active],
            ["Low stock", data.products.lowStock],
            ["Out of stock", data.products.outOfStock],
            ["Customers", data.users.total],
            ["Orders", data.orders.total],
            ["Revenue", `₹${number(data.revenue)}`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-stone-200 bg-white p-5"
            >
              <p className="text-sm text-stone-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [stockChanges, setStockChanges] = useState({});
  const showToast = useToastStore((state) => state.showToast);
  const load = () =>
    api
      .get("/admin/products")
      .then(({ data }) => setProducts(data.products))
      .catch(() => setError("Unable to load products."));
  useEffect(() => {
    load();
  }, []);
  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const body = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      };
      if (editing) {
        delete body.stock;
        await api.patch(`/admin/products/${editing}`, body);
      } else await api.post("/admin/products", body);
      showToast(editing ? "Product updated." : "Product created.", "success");
      setForm(emptyProduct);
      setEditing(null);
      load();
    } catch (err) {
      const message = err.response?.data?.message || "Unable to save product.";
      setError(message);
      showToast(message, "error");
    }
  }
  function startEdit(product) {
    setEditing(product._id);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description,
      category: product.category,
      price: product.price,
      image: product.image || "",
      stock: product.stock,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function adjustStock(product) {
    const changeAmount = Number(stockChanges[product._id]);

    if (!Number.isInteger(changeAmount) || changeAmount === 0) {
      const message = "Enter a whole number other than 0.";
      setError(message);
      showToast(message, "error");
      return;
    }

    try {
      setError("");
      await api.patch(`/admin/products/${product._id}/stock`, {
        changeAmount,
      });

      setStockChanges((current) => ({
        ...current,
        [product._id]: "",
      }));

      showToast(`Stock updated for ${product.name}.`, "success");
      load();
    } catch (err) {
      const message = err.response?.data?.message || "Unable to adjust stock.";
      setError(message);
      showToast(message, "error");
    }
  }
  async function disable(product) {
    if (!window.confirm(`Disable ${product.name}?`)) return;
    try {
      await api.delete(`/admin/products/${product._id}`);
      showToast("Product disabled.", "success");
      load();
    } catch (err) {
      const message = err.response?.data?.message || "Unable to disable product.";
      setError(message);
      showToast(message, "error");
    }
  }
  return (
    <AdminShell title="Products">
      <form
        onSubmit={submit}
        className="mb-8 grid gap-3 rounded-xl border border-stone-200 bg-white p-5 md:grid-cols-2"
      >
        {[
          ["name", "Name"],
          ["sku", "SKU"],
          ["category", "Category"],
          ["price", "Price"],
          ["stock", "Opening stock"],
          ["image", "Image URL"],
        ].map(([key, label]) => (
          <label key={key} className={key === "image" ? "md:col-span-2" : ""}>
            <span className="text-sm font-medium">{label}</span>
            <input
              required={key !== "image"}
              disabled={editing && key === "stock"}
              type={key === "price" || key === "stock" ? "number" : "text"}
              min={key === "stock" || key === "price" ? "0" : undefined}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-stone-100"
            />
          </label>
        ))}
        <label className="md:col-span-2">
          <span className="text-sm font-medium">Description</span>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">
            {editing ? "Save changes" : "Add product"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyProduct);
              }}
              className="rounded-lg border px-4 py-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      {error && <p className="mb-4 text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-100 text-stone-600">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-3">
                  <b>{p.name}</b>
                  <br />
                  <span className="text-stone-500">
                    {p.sku} · {p.status}
                  </span>
                </td>
                <td className="p-3"> ₹{number(p.price)}</td>
                <td className="p-3">
                  {p.stock}{" "}
                  <span className="text-xs text-stone-500">
                    {p.inventoryStatus}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button
                    onClick={() => startEdit(p)}
                    className="mr-2 text-emerald-700"
                  >
                    Edit
                  </button>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="± amount"
                      value={stockChanges[p._id] ?? ""}
                      onChange={(e) =>
                        setStockChanges((current) => ({
                          ...current,
                          [p._id]: e.target.value,
                        }))
                      }
                      className="w-24 rounded border px-2 py-1"
                    />

                    <button
                      type="button"
                      onClick={() => adjustStock(p)}
                      className="rounded bg-emerald-700 px-3 py-1 text-white"
                    >
                      Adjust
                    </button>
                  </div>
                  {p.status === "active" && (
                    <button onClick={() => disable(p)} className="text-red-600">
                      Disable
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

export function AdminDataPage({ type }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const showToast = useToastStore((state) => state.showToast);
  const endpoint = {
    inventory: "/admin/inventory",
    orders: "/admin/orders",
    users: "/admin/users",
    transactions: "/admin/transactions",
    history: "/admin/inventory/history",
  }[type];
  const load = () =>
    api
      .get(endpoint)
      .then(({ data: response }) => setData(response[type] || []))
      .catch(() => setError("Unable to load data."));
  useEffect(() => {
    load();
  }, [endpoint]);
  async function updateStatus(orderId, status) {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      showToast("Order status updated.", "success");
      load();
    } catch (err) {
      const message = err.response?.data?.message || "Unable to update order.";
      setError(message);
      showToast(message, "error");
    }
  }
  const title = {
    inventory: "Inventory status",
    orders: "All orders",
    users: "Users",
    transactions: "Transaction history",
    history: "Inventory history",
  }[type];
  return (
    <AdminShell title={title}>
      {error && <p className="mb-4 text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-100 text-stone-600">
            <tr>
              {type === "inventory" ? (
                <>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                </>
              ) : type === "orders" ? (
                <>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                </>
              ) : type === "users" ? (
                <>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                </>
              ) : type === "history" ? (
                <>
                  <th className="p-3">Product</th>
                  <th className="p-3">Change</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">By</th>
                  <th className="p-3">Date</th>
                </>
              ) : (
                <>
                  <th className="p-3">Order</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item) =>
              type === "inventory" ? (
                <tr key={item._id} className="border-t">
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3">{item.sku}</td>
                  <td className="p-3">{item.stock}</td>
                  <td className="p-3">{item.inventoryStatus}</td>
                </tr>
              ) : type === "orders" ? (
                <tr key={item._id} className="border-t">
                  <td className="p-3">
                    <Link
                      className="font-semibold text-emerald-700"
                      to={`/admin/orders/${item._id}`}
                    >
                      {item.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3">
                    {item.user?.name}
                    <br />
                    <span className="text-stone-500">{item.user?.email}</span>
                  </td>
                  <td className="p-3">₹{number(item.totalAmount)}</td>
                  <td className="p-3">
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item._id, e.target.value)}
                      className="rounded border px-2 py-1"
                    >
                      {[
                        "Placed",
                        "Processing",
                        "Shipped",
                        "Delivered",
                        "Cancelled",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ) : type === "users" ? (
                <tr key={item._id} className="border-t">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.email}</td>
                  <td className="p-3 capitalize">{item.role}</td>
                </tr>
              ) : type === "history" ? (
                <tr key={item._id} className="border-t">
                  <td className="p-3">
                    {item.product?.name}
                    <br />
                    <span className="text-stone-500">{item.reason}</span>
                  </td>
                  <td className="p-3">
                    {item.changeAmount > 0 ? "+" : ""}
                    {item.changeAmount}
                  </td>
                  <td className="p-3">
                    {item.previousStock} → {item.newStock}
                  </td>
                  <td className="p-3">{item.changedBy?.name}</td>
                  <td className="p-3">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ) : (
                <tr key={item._id} className="border-t">
                  <td className="p-3">{item.order?.orderNumber}</td>
                  <td className="p-3">{item.user?.email}</td>
                  <td className="p-3">₹{number(item.amount)}</td>
                  <td className="p-3">{item.paymentStatus}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

export function AdminOrderDetailsPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get(`/admin/orders/${orderId}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) =>
        setError(err.response?.data?.message || "Unable to load order."),
      );
  }, [orderId]);
  return (
    <AdminShell title="Order details">
      <Link
        to="/admin/orders"
        className="text-sm font-semibold text-emerald-700"
      >
        ← All orders
      </Link>
      {error && <p className="mt-4 text-red-700">{error}</p>}
      {!error && !order && <p className="mt-4">Loading order…</p>}
      {order && (
        <div className="mt-4 rounded-xl border border-stone-200 bg-white p-6">
          <p className="font-bold">
            {order.orderNumber} · {order.status}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {order.user?.name} · {order.user?.email}
          </p>
          <div className="mt-5 divide-y">
            {order.items.map((item) => (
              <div className="flex justify-between py-3" key={item._id}>
                <span>
                  {item.productName}{" "}
                  <small className="text-stone-500">× {item.quantity}</small>
                </span>
                <b>₹{number(item.lineTotal)}</b>
              </div>
            ))}
          </div>
          <p className="mt-4 text-right text-xl font-bold">
            ₹{number(order.totalAmount)}
          </p>
        </div>
      )}
    </AdminShell>
  );
}

function AdminShell({ title, children }) {
  return (
    <section>
      <AdminNav />
      <h1 className="mb-6 font-display text-4xl font-semibold">{title}</h1>
      {children}
    </section>
  );
}
