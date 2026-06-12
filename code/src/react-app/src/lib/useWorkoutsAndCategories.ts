import { useEffect, useState } from "react";
import { useApi } from "./api";
import type { WorkoutSummary } from "../../../shared/types";

export function useWorkoutsAndCategories() {
  const apiFetch = useApi();
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [workoutsRes, categoriesRes] = await Promise.all([
          apiFetch<{ workouts: WorkoutSummary[] }>("/api/workouts"),
          apiFetch<{ categories: string[] }>("/api/categories"),
        ]);
        if (cancelled) return;
        setWorkouts(workoutsRes.workouts);
        setCategories(categoriesRes.categories);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  return { workouts, categories, error };
}
