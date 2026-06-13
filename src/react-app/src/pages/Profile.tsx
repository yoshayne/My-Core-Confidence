import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import {
  Heart,
  CreditCard,
  LogOut,
  Shield,
  ChevronRight,
  Instagram,
  Youtube,
  Music2,
} from "lucide-react";
import AppLayout from "../components/AppLayout";
import { useApi } from "../lib/api";
import type { StoryContent, UserProfile } from "../../../shared/types";

const PLAN_LABELS: Record<string, string> = {
  monthly: "Monthly",
  annual: "Annual",
};

export default function Profile() {
  const apiFetch = useApi();
  const { signOut } = useClerk();

  const [story, setStory] = useState<StoryContent | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storyRes, profileRes] = await Promise.all([
          apiFetch<StoryContent>("/api/story"),
          apiFetch<UserProfile>("/api/me"),
        ]);
        if (cancelled) return;
        setStory(storyRes);
        setProfile(profileRes);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  async function openBillingPortal() {
    setError(null);
    setPortalLoading(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/api/billing-portal", { method: "POST" });
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
      setPortalLoading(false);
    }
  }

  const isActive = profile?.subscriptionStatus === "active";
  const planLabel = profile?.subscriptionPlan ? PLAN_LABELS[profile.subscriptionPlan] : null;
  const subscriptionSubtitle = isActive
    ? [planLabel, "Active"].filter(Boolean).join(" · ")
    : "Free";

  const socials = [
    { key: "social_instagram", icon: Instagram, label: "Instagram" },
    { key: "social_youtube", icon: Youtube, label: "YouTube" },
    { key: "social_tiktok", icon: Music2, label: "TikTok" },
  ];

  return (
    <AppLayout>
      <div className="relative h-72 w-full lg:rounded-card lg:overflow-hidden">
        {story?.profile_image ? (
          <img src={story.profile_image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[#11161F]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
      </div>

      <div className="relative -mt-10 mx-auto max-w-md px-4 lg:max-w-3xl lg:px-8">
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <h1 className="text-2xl font-bold">{story?.profile_title || "Hey, I'm Donovan."}</h1>

        {story?.profile_bio && (
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{story.profile_bio}</p>
        )}

        {story?.profile_cta && (
          <p className="mt-3 text-sm font-semibold text-text">{story.profile_cta}</p>
        )}

        {story?.signature_image && (
          <img src={story.signature_image} alt="Donovan's signature" className="mt-4 h-10" />
        )}

        <div className="mt-4 flex gap-3">
          {socials.map(({ key, icon: Icon, label }) =>
            story?.[key] ? (
              <a
                key={key}
                href={story[key]}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-button border border-card-border"
              >
                <Icon className="h-5 w-5 text-text-secondary" strokeWidth={1.75} />
              </a>
            ) : null
          )}
        </div>

        <div className="mt-8 space-y-3">
          <AccountRow to="/profile/favorites" icon={Heart} label="Favorites" />

          {isActive ? (
            <AccountRow
              icon={CreditCard}
              label="Manage subscription"
              subtitle={subscriptionSubtitle}
              onClick={openBillingPortal}
              disabled={portalLoading}
            />
          ) : (
            <AccountRow
              to="/subscribe"
              icon={CreditCard}
              label="Upgrade to Premium"
              subtitle={subscriptionSubtitle}
            />
          )}

          {profile?.isAdmin && <AccountRow to="/admin" icon={Shield} label="Admin" />}

          <AccountRow icon={LogOut} label="Sign out" onClick={() => signOut()} />
        </div>
      </div>
    </AppLayout>
  );
}

function AccountRow({
  to,
  icon: Icon,
  label,
  subtitle,
  onClick,
  disabled,
}: {
  to?: string;
  icon: typeof Heart;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <>
      <Icon className="h-5 w-5 text-blue" strokeWidth={1.75} />
      <span className="flex-1 text-sm font-semibold text-text">{label}</span>
      {subtitle && <span className="text-xs text-text-secondary">{subtitle}</span>}
      <ChevronRight className="h-4 w-4 text-text-secondary" />
    </>
  );

  const className =
    "flex w-full items-center gap-3 rounded-card border border-card-border bg-card p-4 text-left disabled:opacity-60";

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}
