import { useCallback } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";

export function useApi() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  return useCallback(
    async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
      const token = await getToken();
      const res = await fetch(path, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.status === 401) {
        // Session token expired or was revoked — send the user back to sign in.
        await signOut({ redirectUrl: "/" });
        throw new Error(`${path} returned 401`);
      }
      if (!res.ok) throw new Error(`${path} returned ${res.status}`);
      return res.json() as Promise<T>;
    },
    [getToken, signOut]
  );
}

export function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  return `${Math.round(seconds / 60)} min`;
}
