import { Link } from "react-router-dom";
import { Heart, ChevronRight } from "lucide-react";
import BottomNav from "../components/BottomNav";

export default function Profile() {
  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-2xl font-bold">Profile</h1>

        <div className="mt-6">
          <Link
            to="/profile/favorites"
            className="flex items-center gap-3 rounded-card border border-card-border bg-card p-4"
          >
            <Heart className="h-5 w-5 text-blue" strokeWidth={1.75} />
            <span className="flex-1 text-sm font-semibold text-text">Favorites</span>
            <ChevronRight className="h-4 w-4 text-text-secondary" />
          </Link>
        </div>

        <p className="mt-6 text-sm text-text-secondary">More settings coming soon.</p>
      </div>

      <BottomNav />
    </div>
  );
}
