const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  opts: Omit<RequestInit, "body"> & { body?: unknown } = {}
): Promise<T> {
  const { body, headers = {}, ...rest } = opts;
  const init: RequestInit = {
    credentials: "include",
    ...rest,
    headers: { ...headers },
  };
  if (body !== undefined) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      (init.headers as Record<string, string>)["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${API_BASE}${path}`, init);
  let data: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    data = await res.json();
  }
  if (!res.ok) {
    let msg: string = res.statusText;
    if (data && typeof data === "object" && "detail" in data) {
      const d = (data as { detail: unknown }).detail;
      if (typeof d === "string") msg = d;
      else if (Array.isArray(d)) msg = d.map((e: { msg?: string }) => e.msg).join(", ");
    }
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export function getMe() {
  return api<import("./types").User>("/api/me");
}

export function getStats() {
  return api<import("./types").Stats>("/api/stats");
}

export function getJobs(limit = 50) {
  return api<import("./types").Job[]>(`/v1/jobs?limit=${limit}`);
}

export function creditLabel(user: import("./types").User) {
  if (user.plan === "pro") return "Pro · unlimited";
  return `${user.credits} credit${user.credits === 1 ? "" : "s"} left`;
}

export function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtEta(sec: number | null | undefined): string | null {
  if (sec == null || sec <= 0) return null;
  if (sec < 60) return `~${sec}s`;
  const m = Math.ceil(sec / 60);
  return m === 1 ? "~1 min" : `~${m} min`;
}

export function fmtDuration(sec: number | null | undefined): string | null {
  if (sec == null) return null;
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function processingPhase(status: string, progress: number): string {
  if (status === "pending") return "Waiting in queue";
  if (status !== "processing") return "";
  if (progress < 8) return "Detecting watermark…";
  if (progress < 90) return "Removing watermark…";
  return "Finalizing export…";
}

export const TERMINAL: import("./types").JobStatus[] = [
  "finished",
  "skipped",
  "failed",
  "expired",
  "canceled",
];

export function requestNotifyPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export function notifyDone(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.ico" });
  } catch { /* ignore */ }
}
