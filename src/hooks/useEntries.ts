import { supabase } from "@/lib/supabase";
import type { Entry } from "@/lib/types";
import { todayISO } from "@/lib/types";

export function useEntries() {
  /** Upserts an entry for a given date — re-saving the same day updates it rather than duplicating.
   *  Used both for logging today and for editing a past day's entry. */
  async function upsertEntryForDate(exerciseId: string, date: string, weight: number, reps: number, sets: number) {
    const { error } = await supabase
      .from("entries")
      .upsert({ exercise_id: exerciseId, date, weight, reps, sets }, { onConflict: "exercise_id,date" });
    if (error) throw error;
  }

  /** Convenience wrapper for the common case of logging today's session. */
  async function saveEntry(exerciseId: string, weight: number, reps: number, sets: number) {
    await upsertEntryForDate(exerciseId, todayISO(), weight, reps, sets);
  }

  /** Updates an existing entry by its row id — used when editing a past session
   *  from the History tab or an exercise's history panel. */
  async function updateEntry(entryId: string, weight: number, reps: number, sets: number) {
    const { error } = await supabase.from("entries").update({ weight, reps, sets }).eq("id", entryId);
    if (error) throw error;
  }

  async function deleteEntry(entryId: string) {
    const { error } = await supabase.from("entries").delete().eq("id", entryId);
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

  return { saveEntry, upsertEntryForDate, updateEntry, deleteEntry, getBaseline, getTodayEntry };
}
