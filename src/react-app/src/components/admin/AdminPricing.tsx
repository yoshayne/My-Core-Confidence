import { useEffect, useState } from "react";
import { useApi } from "../../lib/api";
import type { AdminPlan } from "../../../../shared/types";

function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function AdminPricing() {
  const apiFetch = useApi();
  const [plans, setPlans] = useState<AdminPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftAmount, setDraftAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { plans } = await apiFetch<{ plans: AdminPlan[] }>("/api/admin/pricing");
      setPlans(plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans");
    }
  }

  useEffect(() => {
    load();
  }, [apiFetch]);

  function startEdit(plan: AdminPlan) {
    setEditingKey(plan.plan_key);
    setDraftAmount(formatAmount(plan.amount_cents));
  }

  async function handleSave(plan: AdminPlan) {
    const dollars = Number(draftAmount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setError("Enter a valid amount");
      return;
    }
    const amountCents = Math.round(dollars * 100);
    if (amountCents === plan.amount_cents) {
      setEditingKey(null);
      return;
    }

    if (
      !window.confirm(
        `Update ${plan.display_name} to $${formatAmount(amountCents)}? A new Stripe price will be created and the old one archived. Existing subscribers keep their current price.`
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_key: plan.plan_key, amount_cents: amountCents }),
      });
      setEditingKey(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update price");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-400">{error}</p>}

      {(plans ?? []).map((plan) => (
        <div
          key={plan.plan_key}
          className="rounded-card border border-card-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-text">{plan.display_name}</p>
              <p className="text-xs text-text-secondary">
                Billed {plan.interval === "month" ? "monthly" : "yearly"}
              </p>
            </div>
            {editingKey === plan.plan_key ? null : (
              <p className="text-[22px] font-bold text-text">
                ${formatAmount(plan.amount_cents)}
              </p>
            )}
          </div>

          {editingKey === plan.plan_key ? (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-text-secondary">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                className="w-24 rounded-button border border-card-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-blue"
              />
              <button
                type="button"
                onClick={() => handleSave(plan)}
                disabled={saving}
                className="rounded-button bg-blue px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditingKey(null)}
                className="rounded-button border border-card-border px-3 py-2 text-sm text-text-secondary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => startEdit(plan)}
              className="mt-3 rounded-button border border-card-border px-3 py-2 text-sm text-text"
            >
              Edit price
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
