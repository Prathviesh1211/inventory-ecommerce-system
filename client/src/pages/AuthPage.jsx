import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { useToastStore } from "../store/toast.store";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await (isRegister ? register(form) : login(form));
      showToast(
        isRegister ? "Registration successful." : "Login successful.",
        "success",
      );
      navigate(location.state?.from || "/");
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Unable to continue. Please try again.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-bold tracking-widest text-emerald-700 uppercase">
        Stockroom account
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold">
        {isRegister ? "Create your account" : "Welcome back"}
      </h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {isRegister && (
          <label className="block text-sm font-medium">
            Name
            <input
              required
              minLength="2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
        )}
        <label className="block text-sm font-medium">
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            required
            type="password"
            minLength="8"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {submitting
            ? "Please wait…"
            : isRegister
              ? "Create account"
              : "Log in"}
        </button>
      </form>
      <p className="mt-5 text-sm text-stone-600">
        {isRegister ? "Already have an account?" : "New to Stockroom?"}{" "}
        <Link
          className="font-semibold text-emerald-700"
          to={isRegister ? "/login" : "/register"}
        >
          {isRegister ? "Log in" : "Create one"}
        </Link>
      </p>
    </section>
  );
}
