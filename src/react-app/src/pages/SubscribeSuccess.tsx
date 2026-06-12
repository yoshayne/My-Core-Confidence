import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function SubscribeSuccess() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <CheckCircle2 className="h-12 w-12 text-blue" />
      <h1 className="mt-4 text-xl font-bold">You're subscribed</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Your full library is unlocked. Let's get to work.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-button bg-blue px-6 py-3 text-sm font-semibold text-white"
      >
        Go to Library
      </Link>
    </div>
  );
}
