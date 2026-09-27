import { useToastStore } from '../store/toast.store';

const styles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
};

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-3 sm:left-auto sm:w-96" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} role={toast.type === 'error' ? 'alert' : 'status'} className={`pointer-events-auto flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${styles[toast.type] || styles.info}`}>
          <p className="font-medium">{toast.message}</p>
          <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification" className="-mr-1 -mt-1 rounded p-1 text-current/70 hover:bg-black/5 hover:text-current">×</button>
        </div>
      ))}
    </div>
  );
}
