import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "../components/BottomNav";
import WorkoutCard from "../components/WorkoutCard";
import { useApi } from "../lib/api";
import type { WorkoutSummary } from "../../../shared/types";

export default function Favorites() {
  const apiFetch = useApi();
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { workouts } = await apiFetch<{ workouts: WorkoutSummary[] }>("/api/favorites");
        if (!cancelled) setWorkouts(workouts);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-card-border"
          >
            <ArrowLeft className="h-5 w-5 text-text-secondary" strokeWidth={1.75} />
          </Link>
          <h1 className="text-2xl font-bold">Favorites</h1>
        </div>

        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {workouts?.length === 0 && (
          <p className="mt-6 text-sm text-text-secondary">
            Tap the heart on a workout to save it here.
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4">
          {(workouts ?? []).map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
