export interface Entry {
  id: string;
  exercise_id: string;
  date: string; // YYYY-MM-DD
  weight: number;
  reps: number;
  sets: number;
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  optional: boolean;
  sort_order: number;
  entries?: Entry[];
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  exercises?: Exercise[];
}

export type StagnationStatus = "insufficient" | "improving" | "stagnant";

export interface StagnationResult {
  status: StagnationStatus;
  sessions?: number;
  oldVol?: number;
  newVol?: number;
}

export function vol(e: Pick<Entry, "weight" | "reps" | "sets">): number {
  if (!e.weight || !e.reps || !e.sets) return 0;
  return e.weight * e.reps * e.sets;
}

export function computeStagnation(entries: Entry[]): StagnationResult {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (sorted.length < 4) return { status: "insufficient" };
  const last4 = sorted.slice(-4);
  const oldVol = vol(last4[0]);
  const newVol = vol(last4[last4.length - 1]);
  return { status: newVol <= oldVol ? "stagnant" : "improving", sessions: 4, oldVol, newVol };
}

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const PALETTE = ["#E8836B", "#8B5A8C", "#5B9AA8", "#D6A24A", "#7C6FA8", "#4F9D7C", "#C76B8B"];

/** Deterministic color per workout, based on its position in the list. */
export function workoutColor(workoutIndex: number): string {
  return PALETTE[workoutIndex % PALETTE.length];
}

/** Whether the system is currently in dark mode — used by Chart.js configs,
 *  since chart colors are plain JS values and can't respond to CSS media queries. */
export function prefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Chart.js tooltip/grid color set matching the current theme. */
export function chartTheme() {
  const dark = prefersDark();
  return {
    accent: "#E8836B",
    tooltipBg: dark ? "#281F33" : "#FFFFFF",
    tooltipBorder: dark ? "rgba(255,255,255,0.12)" : "rgba(20,10,20,0.14)",
    tooltipText: dark ? "#F1ECF4" : "#221A26",
    tick: dark ? "#7C6F84" : "#9C8FA1",
    grid: dark ? "rgba(255,255,255,0.05)" : "rgba(20,10,20,0.05)"
  };
}

// ── PER-DAY EXERCISE SKIP ──────────────────────────────────────────────────────
// Skipping an exercise for today only hides it from today's session view —
// it stays in the workout's exercise pool for next time. This is intentionally
// NOT stored in Supabase since it's a transient per-day display preference,
// not training data. Resets naturally each day since the key includes the date.
function skipKey(exerciseId: string, dateIso: string): string {
  return `lift_log_skip_${exerciseId}_${dateIso}`;
}

export function isSkippedToday(exerciseId: string, dateIso: string): boolean {
  try {
    return localStorage.getItem(skipKey(exerciseId, dateIso)) === "1";
  } catch {
    return false;
  }
}

export function setSkippedToday(exerciseId: string, dateIso: string, skipped: boolean) {
  try {
    if (skipped) localStorage.setItem(skipKey(exerciseId, dateIso), "1");
    else localStorage.removeItem(skipKey(exerciseId, dateIso));
  } catch {
    // localStorage unavailable — skip silently, feature degrades gracefully
  }
}
