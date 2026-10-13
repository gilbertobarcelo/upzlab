export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  const res = await fetch(`${API_BASE}/api/upzlab${path}`, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      ...(init.body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "Erro inesperado. Tente novamente.";
    throw new Error(detail);
  }
  return data as T;
}

export function avatarSrc(url?: string | null) {
  if (!url) return "";
  return url.startsWith("/uploads") ? `${API_BASE}${url}` : url;
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const diff = Math.max(0, Date.now() - new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d} d` : new Date(iso).toLocaleDateString("pt-BR");
}
