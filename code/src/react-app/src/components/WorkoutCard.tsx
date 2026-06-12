import { Link } from "react-router-dom";
import { Heart, Lock } from "lucide-react";
import type { WorkoutSummary } from "../../../shared/types";
import { formatDuration } from "../lib/api";

export default function WorkoutCard({ workout }: { workout: WorkoutSummary }) {
  const to = workout.locked ? "/subscribe" : `/workout/${workout.id}`;
  const duration = formatDuration(workout.durationSeconds);

  return (
    <Link to={to} className="block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-bg-raise">
        {workout.thumbnailUrl ? (
          <img src={workout.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[#11161F]" />
        )}

        <button
          type="button"
          aria-label="Favorite"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40"
        >
          <Heart className="h-4 w-4 text-white" strokeWidth={1.75} />
        </button>

        {workout.locked && (
          <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40">
            <Lock className="h-3.5 w-3.5 text-white" strokeWidth={1.75} />
          </div>
        )}

        <span
          className={`absolute bottom-2 left-2 rounded-pill px-2 py-0.5 text-[9px] font-bold tracking-wider text-white ${
            workout.isFree ? "bg-blue" : "bg-black/50"
          }`}
        >
          {workout.isFree ? "FREE" : "PREMIUM"}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-text">{workout.title}</p>
      <p className="text-xs text-text-secondary">
        {[duration, workout.level].filter(Boolean).join(" · ")}
      </p>
    </Link>
  );
}
