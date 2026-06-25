import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type Mode = "signin" | "signup" | "forgot";

export default function Login() {
  const { signInWithPassword, signUpWithPassword, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetMessages() {
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signInWithPassword(email, password);
      } else if (mode === "signup") {
        await signUpWithPassword(email, password);
        setInfo("Account created. If email confirmation is enabled on your Supabase project, check your inbox before signing in.");
      } else if (mode === "forgot") {
        await sendPasswordReset(email);
        setInfo("Check your email for a password reset link.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-border bg-accent-bg">
        <svg viewBox="0 0 24 24" className="h-8 w-8 stroke-accent" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4" />
        </svg>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Lift Log</h1>
        <p className="mt-1 text-sm text-ink-2">
          {mode === "signin" && "Sign in to your account"}
          {mode === "signup" && "Create your account"}
          {mode === "forgot" && "Reset your password"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="h-12 rounded-md2 border border-line-2 bg-surface-2 px-4 text-sm text-ink outline-none focus:border-accent"
        />

        {mode !== "forgot" && (
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="h-12 rounded-md2 border border-line-2 bg-surface-2 px-4 text-sm text-ink outline-none focus:border-accent"
          />
        )}

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              resetMessages();
            }}
            className="self-end text-xs text-ink-2 underline"
          >
            Forgot password?
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="h-12 rounded-md2 bg-accent text-sm font-bold text-black disabled:opacity-60"
        >
          {submitting
            ? "Please wait..."
            : mode === "signin"
            ? "Sign in"
            : mode === "signup"
            ? "Create account"
            : "Send reset link"}
        </button>

        {error && <p className="text-xs text-danger">{error}</p>}
        {info && <p className="text-xs text-accent">{info}</p>}

        <div className="mt-1 flex flex-col items-center gap-1.5">
          {mode === "forgot" ? (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                resetMessages();
              }}
              className="text-xs text-ink-2 underline"
            >
              Back to sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                resetMessages();
              }}
              className="text-xs text-ink-2 underline"
            >
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
