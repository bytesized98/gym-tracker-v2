import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="text-2xl">✓</div>
        <h1 className="text-lg font-bold">Password updated</h1>
        <p className="text-sm text-ink-2">You're all set — you can keep using the app normally now.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-ink-2">Enter a new password for your account.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <input
          type="password"
          required
          minLength={6}
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="h-12 rounded-md2 border border-line-2 bg-surface-2 px-4 text-sm text-ink outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="h-12 rounded-md2 border border-line-2 bg-surface-2 px-4 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={submitting}
          className="h-12 rounded-md2 bg-accent text-sm font-bold text-black disabled:opacity-60"
        >
          {submitting ? "Updating..." : "Update password"}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </div>
  );
}
