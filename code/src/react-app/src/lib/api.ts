import { useAuth } from "@clerk/clerk-react";

export function useApi() {
  const { getToken } = useAuth();

  return async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getToken();
    const res = await fetch(path, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`${path} returned ${res.status}`);
    return res.json() as Promise<T>;
  };
}

export function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  return `${Math.round(seconds / 60)} min`;
}
