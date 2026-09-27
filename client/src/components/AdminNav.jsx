import { NavLink } from "react-router-dom";
const links = [
  ["/admin", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/inventory", "Inventory"],
  ["/admin/orders", "Orders"],
  ["/admin/users", "Users"],
  ["/admin/transactions", "Transactions"],
  ["/admin/history", "History"],
];
export default function AdminNav() {
  return (
    <nav className="mb-7 flex gap-2 overflow-x-auto border-b border-stone-200 pb-3">
      {links.map(([to, label]) => (
        <NavLink
          key={to}
          end={to === "/admin"}
          to={to}
          className={({ isActive }) =>
            `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100"}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
