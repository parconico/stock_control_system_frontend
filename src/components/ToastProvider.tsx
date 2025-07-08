"use client";
import { useToasts, useUI } from "@/hooks/useStores";

export default function ToastProvider() {
  const toasts = useToasts();
  const { removeToast } = useUI();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 ease-in-out
            ${toast.type === "success" ? "toast-success" : ""}
            ${toast.type === "error" ? "toast-error" : ""}
            ${toast.type === "warning" ? "toast-warning" : ""}
            ${toast.type === "info" ? "toast-info" : ""}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs mt-1 opacity-90">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
