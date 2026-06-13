import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Bell, Play } from "lucide-react";
import AppLayout from "../components/AppLayout";
import CategoryChips from "../components/CategoryChips";
import WorkoutCard from "../components/WorkoutCard";
import { formatDuration } from "../lib/api";
import { useWorkoutsAndCategories } from "../lib/useWorkoutsAndCategories";

export default function Library() {
  const { user } = useUser();
  const { workouts, categories, error } = useWorkoutsAndCategories();
  const [activeCategory, setActiveCategory] = useState("All");

  const featured = workouts?.find((w) => w.isFeatured);
  const visible = (workouts ?? []).filter(
    (w) => activeCategory === "All" || w.category === activeCategory
  );

  const firstName = user?.firstName || "there";
  const initial = (user?.firstName || user?.primaryEmailAddress?.emailAddress || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-4 pt-6 lg:max-w-6xl lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-dim">Good evening</p>
            <p className="text-lg font-bold">{firstName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-text-secondary" strokeWidth={1.75} />
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-blue text-sm font-bold">
              {initial}
            </div>
          </div>
        </header>

        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {featured && (
          <Link to={`/workout/${featured.id}`} className="mt-6 block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-bg-raise lg:aspect-[16/6]">
              {featured.thumbnailUrl ? (
                <img src={featured.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[#11161F]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 lg:p-8">
                <p className="text-[10px] font-bold tracking-[0.15em] text-blue">TODAY'S SESSION</p>
                <p className="mt-1 text-xl font-bold text-white lg:text-3xl">{featured.title}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {[formatDuration(featured.durationSeconds), featured.level].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-button bg-blue px-4 py-2 text-sm font-semibold text-white">
                  <Play className="h-4 w-4" fill="currentColor" />
                  Start workout
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="mt-6">
          <CategoryChips categories={categories} active={activeCategory} onChange={setActiveCategory} />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-base font-bold">Workouts</h2>
          <Link to="/workouts" className="text-sm font-semibold text-blue">
            See all
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {visible.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
