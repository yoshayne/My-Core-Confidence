import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useApi, formatDuration } from "../lib/api";
import type { ProgressStats } from "../../../shared/types";

function formatCompletedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Progress() {
  const apiFetch = useApi();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<ProgressStats>("/api/progress");
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  const maxCount = Math.max(1, ...(stats?.weekly.map((d) => d.count) ?? [0]));

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-2xl font-bold">Progress</h1>

        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-card border border-card-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-text">{stats?.thisWeekSessions ?? "–"}</p>
            <p className="mt-1 text-xs text-text-secondary">This week</p>
          </div>
          <div className="rounded-card border border-card-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-text">{stats?.thisWeekMinutes ?? "–"}</p>
            <p className="mt-1 text-xs text-text-secondary">Minutes</p>
          </div>
          <div className="rounded-card border border-card-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-text">{stats?.totalSessions ?? "–"}</p>
            <p className="mt-1 text-xs text-text-secondary">Total</p>
          </div>
        </div>

        <div className="mt-6 rounded-card border border-card-border bg-card p-4">
          <h2 className="text-sm font-bold text-text-secondary">This week</h2>
          <div className="mt-4 flex items-end justify-between gap-2">
            {(stats?.weekly ?? []).map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-20 w-full items-end">
                  <div
                    className={`w-full rounded-[6px] ${d.count > 0 ? "bg-blue" : "bg-bg-raise"}`}
                    style={{ height: `${Math.max(8, (d.count / maxCount) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] font-medium text-text-dim">{d.day}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-base font-bold">Recent</h2>
        </div>

        <div className="mt-3 space-y-3">
          {stats?.recent.length === 0 && (
            <p className="text-sm text-text-secondary">No completed workouts yet.</p>
          )}
          {stats?.recent.map((item) => (
            <Link
              key={item.id}
              to={`/workout/${item.workoutId}`}
              className="flex items-center gap-3 rounded-card border border-card-border bg-card p-3"
            >
              <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-[10px] bg-[#11161F]">
                {item.thumbnailUrl && (
                  <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">{item.title}</p>
                <p className="text-xs text-text-secondary">
                  {[formatDuration(item.durationSeconds), item.level].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="text-xs text-text-dim">{formatCompletedAt(item.completedAt)}</p>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
