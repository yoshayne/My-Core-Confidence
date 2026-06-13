import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useApi } from "../lib/api";
import type { UserProfile } from "../../../shared/types";
import AdminWorkouts from "../components/admin/AdminWorkouts";
import AdminStory from "../components/admin/AdminStory";
import AdminPricing from "../components/admin/AdminPricing";

const TABS = ["Workouts", "Story", "Pricing"] as const;
type Tab = (typeof TABS)[number];

export default function Admin() {
  const apiFetch = useApi();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>("Workouts");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiFetch<UserProfile>("/api/me");
        if (!cancelled) setProfile(me);
      } catch {
        if (!cancelled) setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  if (profile && !profile.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-bg pb-10">
      <div className="mx-auto max-w-md px-4 pt-6 lg:max-w-4xl lg:px-8">
        <h1 className="text-2xl font-bold">Admin</h1>

        <div className="mt-4 flex gap-1 rounded-button border border-card-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-[10px] py-2 text-sm font-semibold transition ${
                tab === t ? "bg-blue text-white" : "text-text-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === "Workouts" && <AdminWorkouts />}
          {tab === "Story" && <AdminStory />}
          {tab === "Pricing" && <AdminPricing />}
        </div>
      </div>
    </div>
  );
}
