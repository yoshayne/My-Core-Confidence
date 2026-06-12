import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import MuxPlayer from "@mux/mux-player-react";
import { ArrowLeft, Heart, CheckCircle2, ChevronRight } from "lucide-react";
import { useApi, formatDuration } from "../lib/api";
import { useFavoriteApi } from "../lib/favorites";
import type { StoryContent, WorkoutDetail, WorkoutSummary } from "../../../shared/types";

export default function Player() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApi();
  const { addFavorite, removeFavorite } = useFavoriteApi();

  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [upNext, setUpNext] = useState<WorkoutSummary | null>(null);
  const [strip, setStrip] = useState<WorkoutSummary[]>([]);
  const [story, setStory] = useState<StoryContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      setWorkout(null);
      try {
        const [detail, { workouts }, storyRes] = await Promise.all([
          apiFetch<WorkoutDetail>(`/api/workouts/${id}`),
          apiFetch<{ workouts: WorkoutSummary[] }>("/api/workouts"),
          apiFetch<StoryContent>("/api/story"),
        ]);
        if (cancelled) return;

        if (detail.locked) {
          navigate("/subscribe", { replace: true });
          return;
        }

        setWorkout(detail);
        setIsFavorite(detail.isFavorite);
        setCompleted(false);
        setStory(storyRes);

        const index = workouts.findIndex((w) => w.id === detail.id);
        const next = index >= 0 && index < workouts.length - 1 ? workouts[index + 1] : undefined;
        setUpNext(next ?? null);
        setStrip(workouts.filter((w) => w.thumbnailUrl).slice(0, 4));
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

  async function toggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      await (next ? addFavorite(workout!.id) : removeFavorite(workout!.id));
    } catch {
      setIsFavorite(!next);
    }
  }

  async function markComplete() {
    if (completing || completed) return;
    setCompleting(true);
    try {
      await apiFetch(`/api/workouts/${workout!.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationWatchedSeconds: workout!.durationSeconds }),
      });
      setCompleted(true);
    } catch {
      // leave button enabled so the user can retry
    } finally {
      setCompleting(false);
    }
  }

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
          onClick={toggleFavorite}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40"
        >
          <Heart
            className={`h-5 w-5 ${isFavorite ? "fill-blue text-blue" : "text-white"}`}
            strokeWidth={1.75}
          />
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
            onClick={markComplete}
            disabled={completing || completed}
            className="flex flex-1 items-center justify-center gap-2 rounded-button bg-blue py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {completed ? "Completed" : "Mark complete"}
          </button>
          <button
            type="button"
            aria-label="Favorite"
            onClick={toggleFavorite}
            className="flex h-12 w-12 items-center justify-center rounded-button border border-card-border bg-card"
          >
            <Heart
              className={`h-5 w-5 ${isFavorite ? "fill-blue text-blue" : "text-text-secondary"}`}
              strokeWidth={1.75}
            />
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

        {strip.length > 0 && (
          <div className="mt-8">
            <p className="text-[10px] font-bold tracking-[0.2em] text-text-secondary">
              {story?.player_strip_title || "WORKOUTS WITH DONOVAN"}
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {strip.map((w) => (
                <div key={w.id} className="aspect-square overflow-hidden rounded-[10px] bg-[#11161F]">
                  <img src={w.thumbnailUrl!} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            {story?.player_strip_tagline && (
              <p className="mt-3 text-sm text-text-secondary">{story.player_strip_tagline}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
