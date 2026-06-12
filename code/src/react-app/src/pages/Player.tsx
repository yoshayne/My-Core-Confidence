import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import MuxPlayer from "@mux/mux-player-react";
import { ArrowLeft, Heart, CheckCircle2, ChevronRight } from "lucide-react";
import { useApi, formatDuration } from "../lib/api";
import type { WorkoutDetail, WorkoutSummary } from "../../../shared/types";

export default function Player() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApi();

  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [upNext, setUpNext] = useState<WorkoutSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      setWorkout(null);
      try {
        const [detail, { workouts }] = await Promise.all([
          apiFetch<WorkoutDetail>(`/api/workouts/${id}`),
          apiFetch<{ workouts: WorkoutSummary[] }>("/api/workouts"),
        ]);
        if (cancelled) return;

        if (detail.locked) {
          navigate("/subscribe", { replace: true });
          return;
        }

        setWorkout(detail);

        const index = workouts.findIndex((w) => w.id === detail.id);
        const next = index >= 0 ? workouts[(index + 1) % workouts.length] : undefined;
        setUpNext(next && next.id !== detail.id ? next : null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, apiFetch, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-center text-text-secondary">
        {error}
      </div>
    );
  }

  if (!workout) {
    return <div className="min-h-screen bg-bg" />;
  }

  const meta = [formatDuration(workout.durationSeconds), workout.level, workout.category]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-bg pb-10">
      <div className="relative aspect-video w-full bg-black">
        {workout.muxStatus === "ready" && workout.muxPlaybackId && workout.playbackToken ? (
          <MuxPlayer
            playbackId={workout.muxPlaybackId}
            tokens={{ playback: workout.playbackToken }}
            streamType="on-demand"
            accentColor="#2196F3"
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {workout.thumbnailUrl ? (
              <img src={workout.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-60" />
            ) : (
              <div className="h-full w-full bg-[#11161F]" />
            )}
            <p className="absolute text-sm font-semibold text-text-secondary">Video processing…</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40"
        >
          <ArrowLeft className="h-5 w-5 text-white" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          aria-label="Favorite"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40"
        >
          <Heart className="h-5 w-5 text-white" strokeWidth={1.75} />
        </button>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4">
        <h1 className="text-xl font-bold">{workout.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{meta}</p>

        {workout.description && (
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{workout.description}</p>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-button bg-blue py-3 text-sm font-semibold text-white"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark complete
          </button>
          <button
            type="button"
            aria-label="Favorite"
            className="flex h-12 w-12 items-center justify-center rounded-button border border-card-border bg-card"
          >
            <Heart className="h-5 w-5 text-text-secondary" strokeWidth={1.75} />
          </button>
        </div>

        {upNext && (
          <div className="mt-6">
            <h2 className="text-sm font-bold text-text-secondary">Up next</h2>
            <Link
              to={`/workout/${upNext.id}`}
              className="mt-2 flex items-center gap-3 rounded-card border border-card-border bg-card p-3"
            >
              <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-[10px] bg-[#11161F]">
                {upNext.thumbnailUrl && (
                  <img src={upNext.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">{upNext.title}</p>
                <p className="text-xs text-text-secondary">
                  {[formatDuration(upNext.durationSeconds), upNext.level].filter(Boolean).join(" · ")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-secondary" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
