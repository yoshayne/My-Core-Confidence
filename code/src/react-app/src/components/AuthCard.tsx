import { useState, type FormEvent } from "react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { Mail, Lock, Eye, EyeOff, User as UserIcon, ShieldCheck } from "lucide-react";
import { GoogleIcon, AppleIcon } from "./icons";

type Mode = "sign-up" | "sign-in" | "verify";

interface AuthCardProps {
  title?: string;
  subtitle?: string;
}

export default function AuthCard({
  title = "Your journey starts here.",
  subtitle = "Create your account to start training.",
}: AuthCardProps) {
  const { signIn, isLoaded: signInLoaded, setActive: setActiveSignIn } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp();

  const [mode, setMode] = useState<Mode>("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLoaded = mode === "sign-in" ? signInLoaded : signUpLoaded;

  async function handleOAuth(strategy: "oauth_google" | "oauth_apple") {
    setError(null);
    const target = mode === "sign-in" ? signIn : signUp;
    if (!target) return;
    try {
      await target.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signUp.create({ emailAddress: email, password });

      if (result.status === "complete") {
        await setActiveSignUp({ session: result.createdSessionId });
        window.location.href = "/";
        return;
      }

      // Most accounts need email verification before the session is created.
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setMode("verify");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActiveSignUp({ session: result.createdSessionId });
        window.location.href = "/";
      } else {
        setError("That code didn't work — try again.");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (!signIn) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActiveSignIn({ session: result.createdSessionId });
        window.location.href = "/";
      } else {
        setError("Sign in needs an additional step.");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === "verify") {
    return (
      <div className="w-full max-w-sm rounded-card border border-blue/40 bg-card p-6">
        <h2 className="text-lg font-bold">Check your email</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Enter the verification code we sent to {email}.
        </p>
        <form onSubmit={handleVerify} className="mt-4 space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            inputMode="numeric"
            className="w-full rounded-button border border-card-border bg-bg-raise px-4 py-3 text-center text-lg tracking-widest text-text outline-none focus:border-blue focus:ring-2 focus:ring-blue/30"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-button bg-blue py-3 font-semibold text-white transition hover:bg-blue-deep disabled:opacity-60"
          >
            Verify email
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-card border border-blue/40 bg-card p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-raise">
        <UserIcon className="h-5 w-5 text-text-secondary" />
      </div>

      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={() => handleOAuth("oauth_google")}
          className="flex w-full items-center justify-center gap-2 rounded-button bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
        >
          <GoogleIcon className="h-5 w-5" />
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("oauth_apple")}
          className="flex w-full items-center justify-center gap-2 rounded-button border border-card-border bg-transparent py-3 text-sm font-semibold text-text transition hover:bg-bg-raise"
        >
          <AppleIcon className="h-5 w-5" />
          Continue with Apple
        </button>
      </div>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-card-border" />
        <span className="text-xs font-semibold text-text-dim">OR</span>
        <div className="h-px flex-1 bg-card-border" />
      </div>

      <form onSubmit={mode === "sign-up" ? handleSignUp : handleSignIn} className="space-y-3">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-button border border-card-border bg-bg-raise py-3 pl-10 pr-4 text-sm text-text outline-none focus:border-blue focus:ring-2 focus:ring-blue/30"
          />
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-button border border-card-border bg-bg-raise py-3 pl-10 pr-10 text-sm text-text outline-none focus:border-blue focus:ring-2 focus:ring-blue/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Clerk requires a CAPTCHA mount point for bot protection on sign-up */}
        <div id="clerk-captcha" />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={!isLoaded || submitting}
          className="w-full rounded-button bg-blue py-3 font-semibold text-white transition hover:bg-blue-deep disabled:opacity-60"
        >
          {mode === "sign-up" ? "Create account →" : "Sign in →"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        {mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => setMode("sign-in")} className="font-semibold text-blue">
              Sign in
            </button>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <button type="button" onClick={() => setMode("sign-up")} className="font-semibold text-blue">
              Create one
            </button>
          </>
        )}
      </p>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-dim">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secured by Clerk
      </p>
    </div>
  );
}

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: Array<{ message?: string }> }).errors;
    if (errors?.[0]?.message) return errors[0].message;
  }
  return "Something went wrong. Please try again.";
}
