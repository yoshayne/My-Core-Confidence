import { useState } from "react";
import BottomNav from "../components/BottomNav";
import CategoryChips from "../components/CategoryChips";
import WorkoutCard from "../components/WorkoutCard";
import { useWorkoutsAndCategories } from "../lib/useWorkoutsAndCategories";

export default function Workouts() {
  const { workouts, categories, error } = useWorkoutsAndCategories();
  const [activeCategory, setActiveCategory] = useState("All");

  const visible = (workouts ?? []).filter(
    (w) => activeCategory === "All" || w.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-2xl font-bold">Workouts</h1>

        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        <div className="mt-4">
          <CategoryChips categories={categories} active={activeCategory} onChange={setActiveCategory} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {visible.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
