import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, CheckCircle2, Lock } from "lucide-react";
import { useApi } from "../lib/api";
import type { PlanKey, SubscriptionPlan } from "../../../shared/types";

const BENEFITS = [
  "Every workout, unlocked",
  "New sessions added weekly",
  "Watch on any device",
  "Cancel anytime",
];

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function Subscribe() {
  const navigate = useNavigate();
  const apiFetch = useApi();

  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [selected, setSelected] = useState<PlanKey>("annual");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { plans } = await apiFetch<{ plans: SubscriptionPlan[] }>("/api/plans");
        if (!cancelled) setPlans(plans);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load plans");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  const monthly = plans?.find((p) => p.planKey === "monthly");
  const annual = plans?.find((p) => p.planKey === "annual");

  const annualMonthlyEquivalent = annual ? annual.amountCents / 12 : null;
  const savePercent =
    monthly && annualMonthlyEquivalent
      ? Math.round((1 - annualMonthlyEquivalent / monthly.amountCents) * 100)
      : null;

  async function handleStart() {
    setError(null);
    setSubmitting(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected }),
      });
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg px-4 pt-6 pb-10">
      <div className="mx-auto max-w-md">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-card-border"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        <h1 className="mt-4 text-[25px] font-bold leading-tight">Unlock the full library</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Every workout, new sessions weekly. Cancel anytime.
        </p>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 space-y-3">
          {annual && (
            <PlanCard
              selected={selected === "annual"}
              onSelect={() => setSelected("annual")}
              badge={savePercent ? `BEST VALUE · SAVE ${savePercent}%` : "BEST VALUE"}
              title="Annual"
              subtitle={
                annualMonthlyEquivalent
                  ? `$${formatAmount(annualMonthlyEquivalent)}/mo · billed yearly`
                  : "Billed yearly"
              }
              amount={`$${formatAmount(annual.amountCents)}`}
              period="per year"
            />
          )}
          {monthly && (
            <PlanCard
              selected={selected === "monthly"}
              onSelect={() => setSelected("monthly")}
              title="Monthly"
              subtitle="Billed monthly"
              amount={`$${formatAmount(monthly.amountCents)}`}
              period="per month"
            />
          )}
        </div>

        <ul className="mt-6 space-y-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue" />
              {benefit}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleStart}
          disabled={!plans || submitting}
          className="mt-6 w-full rounded-button bg-blue py-3 font-semibold text-white transition hover:bg-blue-deep disabled:opacity-60"
        >
          Start subscription
        </button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-dim">
          <Lock className="h-3.5 w-3.5" />
          Secure checkout by Stripe
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  selected,
  onSelect,
  badge,
  title,
  subtitle,
  amount,
  period,
}: {
  selected: boolean;
  onSelect: () => void;
  badge?: string;
  title: string;
  subtitle: string;
  amount: string;
  period: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full rounded-card border bg-card p-4 text-left ${
        selected ? "border-[1.5px] border-blue" : "border-card-border"
      }`}
    >
      {badge && (
        <span className="absolute -top-2.5 left-4 rounded-pill bg-blue px-2 py-0.5 text-[9px] font-bold tracking-wider text-white">
          {badge}
        </span>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
              selected ? "border-blue bg-blue" : "border-card-border"
            }`}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-white" />}
          </span>
          <div>
            <p className="font-semibold text-text">{title}</p>
            <p className="text-xs text-text-secondary">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-bold text-text">{amount}</p>
          <p className="text-xs text-text-secondary">{period}</p>
        </div>
      </div>
    </button>
  );
}
