import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await signInWithMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        <p className="mt-1 text-sm text-ink-2">Sign in to sync your training data</p>
      </div>

      {sent ? (
        <p className="max-w-xs text-center text-sm text-accent">
          Check your email for a sign-in link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-md2 border border-line-2 bg-surface-2 px-4 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="h-12 rounded-md2 bg-accent text-sm font-bold text-black"
          >
            Send magic link
          </button>
          {error && <p className="text-xs text-danger">{error}</p>}
        </form>
      )}
    </div>
  );
}
