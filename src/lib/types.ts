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

const PALETTE = ["#22C880", "#F5C842", "#5B8DEF", "#FF5A52", "#B86BFF", "#42D6C4", "#FF8C42"];

/** Deterministic color per workout, based on its position in the list. */
export function workoutColor(workoutIndex: number): string {
  return PALETTE[workoutIndex % PALETTE.length];
}
