import { useApi } from "./api";

export function useFavoriteApi() {
  const apiFetch = useApi();

  return {
    addFavorite: (workoutId: number) =>
      apiFetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutId }),
      }),
    removeFavorite: (workoutId: number) =>
      apiFetch(`/api/favorites/${workoutId}`, { method: "DELETE" }),
  };
}
