import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Workout } from "@/lib/types";

export function useWorkouts(userId: string | undefined) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("workouts")
      .select("id, user_id, name, sort_order, exercises(id, workout_id, name, optional, sort_order, entries(id, exercise_id, date, weight, reps, sets))")
      .eq("user_id", userId)
      .order("sort_order");
    if (!error && data) setWorkouts(data as unknown as Workout[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addWorkout(name: string) {
    if (!userId) return;
    const sort_order = workouts.length;
    await supabase.from("workouts").insert({ user_id: userId, name, sort_order });
    await refresh();
  }

  async function renameWorkout(id: string, name: string) {
    await supabase.from("workouts").update({ name }).eq("id", id);
    await refresh();
  }

  async function deleteWorkout(id: string) {
    await supabase.from("workouts").delete().eq("id", id);
    await refresh();
  }

  async function addExercise(workoutId: string, name: string, optional = false) {
    const workout = workouts.find((w) => w.id === workoutId);
    const sort_order = workout?.exercises?.length ?? 0;
    await supabase.from("exercises").insert({ workout_id: workoutId, name, optional, sort_order });
    await refresh();
  }

  async function removeExercise(exerciseId: string) {
    await supabase.from("exercises").delete().eq("id", exerciseId);
    await refresh();
  }

  /** Suggests the next workout in rotation order, based on whichever
   *  workout has the most recent logged entry (any date before today). */
  function getSuggestedWorkout(): Workout | null {
    if (workouts.length === 0) return null;
    let lastDate: string | null = null;
    let lastIdx = -1;
    workouts.forEach((w, idx) => {
      (w.exercises ?? []).forEach((ex) => {
        (ex.entries ?? []).forEach((e) => {
          if (!lastDate || e.date > lastDate) {
            lastDate = e.date;
            lastIdx = idx;
          }
        });
      });
    });
    if (lastIdx === -1) return workouts[0];
    return workouts[(lastIdx + 1) % workouts.length];
  }

  return {
    workouts,
    loading,
    refresh,
    addWorkout,
    renameWorkout,
    deleteWorkout,
    addExercise,
    removeExercise,
    getSuggestedWorkout
  };
}
