import { createContext, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

function createToast(type, message, duration) {
  return {
    id: crypto.randomUUID(),
    type,
    message,
    duration,
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  function removeToast(id) {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(type, message, duration = 3500) {
    if (!message) {
      return;
    }

    const toast = createToast(type, message, duration);
    setToasts((current) => [...current, toast]);

    const timer = window.setTimeout(() => {
      removeToast(toast.id);
    }, duration);

    timersRef.current.set(toast.id, timer);
  }

  const value = useMemo(
    () => ({
      showToast,
      success: (message, duration) => showToast("success", message, duration),
      error: (message, duration) => showToast("error", message, duration),
      info: (message, duration) => showToast("info", message, duration),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <p>{toast.message}</p>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
