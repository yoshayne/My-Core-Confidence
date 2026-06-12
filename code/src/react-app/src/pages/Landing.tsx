import { useEffect, useState } from "react";
import { SignedIn, SignedOut, useAuth, useClerk, useUser } from "@clerk/clerk-react";
import AuthCard from "../components/AuthCard";
import type { UserProfile } from "../../../shared/types";

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg px-4 py-10">
      <div className="mx-auto flex max-w-md flex-col items-center gap-8">
        <h1 className="text-xl font-extrabold tracking-tight">
          CORE <span className="text-blue">CONFIDENCE</span>
        </h1>

        <SignedOut>
          <AuthCard />
        </SignedOut>

        <SignedIn>
          <SignedInPanel />
        </SignedIn>
      </div>
    </div>
  );
}

function SignedInPanel() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`/api/me returned ${res.status}`);
        const data = (await res.json()) as UserProfile;
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load profile");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  return (
    <div className="w-full max-w-sm rounded-card border border-card-border bg-card p-6 text-center">
      <p className="text-lg font-bold">Welcome, {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}</p>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {!error && !profile && <p className="mt-3 text-sm text-text-secondary">Loading your profile…</p>}
      {profile && (
        <dl className="mt-4 space-y-1 text-left text-sm text-text-secondary">
          <Row label="Email" value={profile.email} />
          <Row label="Admin" value={profile.isAdmin ? "Yes" : "No"} />
          <Row label="Subscription" value={profile.subscriptionStatus} />
          <Row label="Plan" value={profile.subscriptionPlan ?? "—"} />
        </dl>
      )}

      <button
        onClick={() => signOut()}
        className="mt-5 w-full rounded-button border border-card-border py-3 text-sm font-semibold text-text transition hover:bg-bg-raise"
      >
        Sign out
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="text-text">{value}</dd>
    </div>
  );
}
