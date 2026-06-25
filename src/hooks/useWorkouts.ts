import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Workout } from "@/lib/types";

// Same default split from the original app — seeded once for a brand new
// account so the home screen isn't empty on first login. Feel free to edit
// these, or just delete/rename them in-app afterward via the manage panel.
const DEFAULT_WORKOUTS: { name: string; exercises: { name: string; optional?: boolean }[] }[] = [
  {
    name: "Quads",
    exercises: [
      { name: "Goblet squats" },
      { name: "Leg press" },
      { name: "RDL" },
      { name: "Reverse lunges" },
      { name: "Calf raises" }
    ]
  },
  {
    name: "Pull Day",
    exercises: [
      { name: "Lat pulls" },
      { name: "Mid row" },
      { name: "Face pulls" },
      { name: "Lateral raise + Front raise" },
      { name: "Hammer curls" },
      { name: "Bicep curls" }
    ]
  },
  {
    name: "Glutes+Hamstrings",
    exercises: [
      { name: "Sumo squats" },
      { name: "Bulgarian split squats" },
      { name: "Hamstring curls" },
      { name: "RDL" },
      { name: "Calf raises" }
    ]
  },
  {
    name: "Push Day",
    exercises: [
      { name: "Chest press" },
      { name: "Incline chest press" },
      { name: "Shoulder press" },
      { name: "Overhead tricep extension" },
      { name: "Tricep kickbacks", optional: true }
    ]
  }
];

export function useWorkouts(userId: string | undefined) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const seedAttempted = useRef(false);

  const fetchWorkouts = useCallback(async () => {
    if (!userId) return [] as Workout[];
    const { data, error } = await supabase
      .from("workouts")
      .select(
        "id, user_id, name, sort_order, exercises(id, workout_id, name, optional, sort_order, entries(id, exercise_id, date, weight, reps, sets))"
      )
      .eq("user_id", userId)
      .order("sort_order");
    if (error || !data) return [] as Workout[];
    return data as unknown as Workout[];
  }, [userId]);

  const seedDefaultsIfEmpty = useCallback(async () => {
    if (!userId || seedAttempted.current) return;
    seedAttempted.current = true;
    for (let i = 0; i < DEFAULT_WORKOUTS.length; i++) {
      const w = DEFAULT_WORKOUTS[i];
      const { data: inserted, error } = await supabase
        .from("workouts")
        .insert({ user_id: userId, name: w.name, sort_order: i })
        .select("id")
        .single();
      if (error || !inserted) continue;
      const exRows = w.exercises.map((ex, exIdx) => ({
        workout_id: inserted.id,
        name: ex.name,
        optional: !!ex.optional,
        sort_order: exIdx
      }));
      await supabase.from("exercises").insert(exRows);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    let data = await fetchWorkouts();
    if (data.length === 0 && !seedAttempted.current) {
      await seedDefaultsIfEmpty();
      data = await fetchWorkouts();
    }
    setWorkouts(data);
    setLoading(false);
  }, [userId, fetchWorkouts, seedDefaultsIfEmpty]);

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
