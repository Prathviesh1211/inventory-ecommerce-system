import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import ToastContainer from "./components/ToastContainer";
import {
  AdminDashboardPage,
  AdminDataPage,
  AdminOrderDetailsPage,
  AdminProductsPage,
} from "./pages/AdminPages";
import AuthPage from "./pages/AuthPage";
import CartPage from "./pages/CartPage";
import HomePage from "./pages/HomePage";
import { OrderDetailsPage, OrdersPage } from "./pages/OrdersPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import { useAuthStore } from "./store/auth.store";

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products/:productId" element={<ProductDetailsPage />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="register" element={<AuthPage mode="register" />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetailsPage />} />
          </Route>
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/products" element={<AdminProductsPage />} />
            <Route
              path="admin/inventory"
              element={<AdminDataPage type="inventory" />}
            />
            <Route
              path="admin/orders"
              element={<AdminDataPage type="orders" />}
            />
            <Route
              path="admin/orders/:orderId"
              element={<AdminOrderDetailsPage />}
            />
            <Route
              path="admin/users"
              element={<AdminDataPage type="users" />}
            />
            <Route
              path="admin/transactions"
              element={<AdminDataPage type="transactions" />}
            />
            <Route
              path="admin/history"
              element={<AdminDataPage type="history" />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
