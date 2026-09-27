import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useToastStore } from '../store/toast.store';

export default function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  async function handleLogout() {
    try {
      await logout();
      showToast('Logged out successfully.', 'success');
      navigate('/');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to log out. Please try again.', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-emerald-800">Stockroom</Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <NavLink to="/" className="hover:text-emerald-700">Products</NavLink>
            {user ? (
              <>
                <span className="hidden text-stone-500 sm:inline">Hi, {user.name}</span>
                <NavLink to="/cart" className="hover:text-emerald-700">Cart</NavLink>
                <NavLink to="/orders" className="hidden sm:inline hover:text-emerald-700">Orders</NavLink>
                {user.role === 'admin' && <NavLink to="/admin" className="hover:text-emerald-700">Admin</NavLink>}
                <button onClick={handleLogout} className="rounded-lg border border-stone-300 px-3 py-2 hover:border-emerald-700 hover:text-emerald-700">Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="hover:text-emerald-700">Log in</NavLink>
                <NavLink to="/register" className="rounded-lg bg-emerald-700 px-3 py-2 text-white hover:bg-emerald-800">Create account</NavLink>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Outlet /></main>
    </div>
  );
}
