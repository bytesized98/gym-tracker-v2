import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileTab() {
  const { session, updatePassword, signOut } = useAuth();
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const email = session?.user?.email ?? "";
  const createdAt = session?.user?.created_at ? new Date(session.user.created_at) : null;

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (newPw !== confirmPw) {
      setPwError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(newPw);
      setPwSuccess(true);
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => {
        setShowChangePw(false);
        setPwSuccess(false);
      }, 1500);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto pb-8">
      <div className="px-4 pb-4 pt-5">
        <h2 className="text-xl font-bold tracking-tight">Profile</h2>
      </div>

      <div className="mx-4 mb-4 flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent-bg text-lg font-bold text-accent">
          {email.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{email}</div>
          {createdAt && (
            <div className="mt-0.5 text-xs text-ink-3">
              Member since {createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </div>
          )}
        </div>
      </div>

      <div className="mx-4 mb-4 overflow-hidden rounded-card border border-line bg-surface">
        <div className="px-4 pt-3.5 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">Account</div>

        {!showChangePw ? (
          <button
            onClick={() => setShowChangePw(true)}
            className="flex w-full items-center justify-between border-t border-line px-4 py-3.5 text-left text-sm"
          >
            <span>Change password</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-ink-3 stroke-2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="flex flex-col gap-2.5 border-t border-line p-4">
            <input
              type="password"
              required
              minLength={6}
              placeholder="New password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
              className="h-11 rounded-md2 border border-line-2 bg-surface-2 px-3 text-sm outline-none focus:border-accent"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Confirm new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
              className="h-11 rounded-md2 border border-line-2 bg-surface-2 px-3 text-sm outline-none focus:border-accent"
            />
            {pwError && <p className="text-xs text-danger">{pwError}</p>}
            {pwSuccess && <p className="text-xs text-accent">Password updated.</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowChangePw(false);
                  setPwError(null);
                  setNewPw("");
                  setConfirmPw("");
                }}
                className="flex-1 rounded-md2 border border-line-2 bg-surface-2 py-2.5 text-sm text-ink-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-md2 bg-accent py-2.5 text-sm font-bold text-black disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mx-4 overflow-hidden rounded-card border border-line bg-surface">
        {!confirmSignOut ? (
          <button
            onClick={() => setConfirmSignOut(true)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm text-danger"
          >
            <span>Sign out</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-danger stroke-2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        ) : (
          <div className="flex flex-col gap-2.5 p-4">
            <p className="text-xs text-ink-2">Are you sure you want to sign out?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmSignOut(false)}
                className="flex-1 rounded-md2 border border-line-2 bg-surface-2 py-2.5 text-sm text-ink-2"
              >
                Cancel
              </button>
              <button onClick={signOut} className="flex-1 rounded-md2 bg-danger py-2.5 text-sm font-bold text-black">
                Yes, sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
