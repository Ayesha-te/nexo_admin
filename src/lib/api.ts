export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) return null;
  const res = await fetch(`${API_URL}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.access) localStorage.setItem("accessToken", data.access);
  return data.access || null;
}

export async function api(path: string, options: RequestInit = {}) {
  const doRequest = async () => {
    const headers = new Headers(options.headers || {});
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    if (!isFormData) headers.set("Content-Type", "application/json");
    const token = localStorage.getItem("accessToken");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${API_URL}${path}`, { ...options, headers });
  };

  let res = await doRequest();
  if (res.status === 401) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      res = await doRequest();
    }
  }
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") && text ? JSON.parse(text) : text;
  if (!res.ok) {
    const error = new Error(typeof data === "string" ? data : data.detail || "Request failed") as Error & { status?: number; data?: unknown };
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export function clearAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}
