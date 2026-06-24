"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastType = "info" | "ok" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

const ICONS: Record<ToastType, string> = { info: "ℹ️", ok: "✓", error: "!" };
const DURATIONS: Record<ToastType, number> = { info: 4000, ok: 3500, error: 6000 };

const ToastCtx = createContext<{
  toast: (message: string, type?: ToastType) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counter.current;
    setToasts((t) => [...t.slice(-4), { id, message, type }]);
    const duration = DURATIONS[type];
    setTimeout(() => {
      setToasts((t) => t.map((x) => x.id === id ? { ...x, exiting: true } : x));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 280);
    }, duration);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div id="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type === "error" ? "err" : t.type === "ok" ? "ok" : ""}${t.exiting ? " toast-exit" : ""}`}
          >
            <span className="toast-icon" aria-hidden>{ICONS[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
