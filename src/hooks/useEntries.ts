import { supabase } from "@/lib/supabase";
import type { Entry } from "@/lib/types";
import { todayISO } from "@/lib/types";

export function useEntries() {
  /** Upserts today's entry — re-saving the same day updates it rather than duplicating. */
  async function saveEntry(exerciseId: string, weight: number, reps: number, sets: number) {
    const { error } = await supabase
      .from("entries")
      .upsert(
        { exercise_id: exerciseId, date: todayISO(), weight, reps, sets },
        { onConflict: "exercise_id,date" }
      );
    if (error) throw error;
  }

  /** Most recent entry strictly before today — the "baseline" for the current session. */
  function getBaseline(entries: Entry[] | undefined): Entry | null {
    if (!entries) return null;
    const today = todayISO();
    const prior = entries.filter((e) => e.date < today).sort((a, b) => (a.date < b.date ? -1 : 1));
    return prior.length ? prior[prior.length - 1] : null;
  }

  function getTodayEntry(entries: Entry[] | undefined): Entry | null {
    if (!entries) return null;
    const today = todayISO();
    return entries.find((e) => e.date === today) ?? null;
  }

  return { saveEntry, getBaseline, getTodayEntry };
}
