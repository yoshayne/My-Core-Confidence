import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

export default function SsoCallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-text-secondary">
      <AuthenticateWithRedirectCallback />
      <p>Signing you in…</p>
    </div>
  );
}
