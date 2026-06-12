import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function Subscribe() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg px-4 pt-6">
      <div className="mx-auto max-w-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-card-border"
        >
          <X className="h-5 w-5 text-text-secondary" />
        </button>

        <h1 className="mt-6 text-2xl font-bold">Unlock the full library</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Every workout, new sessions weekly. Cancel anytime.
        </p>
        <p className="mt-8 text-sm text-text-secondary">Coming soon.</p>
      </div>
    </div>
  );
}
