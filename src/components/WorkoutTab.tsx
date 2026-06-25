import { useEffect, useState } from "react";
import { useWorkouts } from "@/hooks/useWorkouts";
import { isSkippedToday, setSkippedToday, todayISO } from "@/lib/types";
import ExerciseCard from "./ExerciseCard";

interface Props {
  userId: string;
}

export default function WorkoutTab({ userId }: Props) {
  const { workouts, refresh, addWorkout, renameWorkout, deleteWorkout, addExercise, removeExercise, getSuggestedWorkout } =
    useWorkouts(userId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [managePanelOpen, setManagePanelOpen] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState("");
  const [newExName, setNewExName] = useState("");
  const [showAddEx, setShowAddEx] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingExercisesId, setEditingExercisesId] = useState<string | null>(null);
  const [removeExId, setRemoveExId] = useState<string | null>(null);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  const suggested = getSuggestedWorkout();
  const active = workouts.find((w) => w.id === activeId) ?? workouts.find((w) => w.id === suggested?.id) ?? workouts[0];

  // Recompute which exercises are skipped-for-today whenever the active workout changes.
  useEffect(() => {
    if (!active) {
      setSkippedIds(new Set());
      return;
    }
    const today = todayISO();
    const skipped = new Set<string>();
    (active.exercises ?? []).forEach((ex) => {
      if (isSkippedToday(ex.id, today)) skipped.add(ex.id);
    });
    setSkippedIds(skipped);
  }, [active]);

  function handleSkipToday(exerciseId: string) {
    setSkippedToday(exerciseId, todayISO(), true);
    setSkippedIds((prev) => new Set(prev).add(exerciseId));
  }

  function handleRestoreToday(exerciseId: string) {
    setSkippedToday(exerciseId, todayISO(), false);
    setSkippedIds((prev) => {
      const next = new Set(prev);
      next.delete(exerciseId);
      return next;
    });
  }

  const visibleExercises = (active?.exercises ?? []).filter((ex) => !skippedIds.has(ex.id));
  const skippedExercises = (active?.exercises ?? []).filter((ex) => skippedIds.has(ex.id));

  return (
    <div className="flex h-full flex-col overflow-y-auto pb-8">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-bg px-4 pb-2.5 pt-5">
        <div>
          <div className="text-xl font-bold tracking-tight">Lift Log</div>
          <div className="mt-0.5 text-xs text-ink-2">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </div>
        </div>
        <button
          onClick={() => setManagePanelOpen((v) => !v)}
          className={`flex h-8.5 w-8.5 items-center justify-center rounded-full border ${
            managePanelOpen ? "border-accent-border bg-accent-bg" : "border-line-2 bg-surface-2"
          }`}
        >
          <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-none stroke-1.8 ${managePanelOpen ? "stroke-accent" : "stroke-ink-2"}`}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 008.6 5a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09A1.65 1.65 0 0019.4 15z" />
          </svg>
        </button>
      </div>

      {/* ── Today's workout selector — pick any of your buckets, change anytime ── */}
      <div className="mx-4 mb-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Choose today's workout</div>
          {suggested && active?.id !== suggested.id && (
            <button onClick={() => setActiveId(suggested.id)} className="text-xs font-medium text-accent">
              Suggested: {suggested.name}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {workouts.map((w) => {
            const isActive = active?.id === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setActiveId(w.id)}
                className={`relative rounded-card border p-3 text-left ${
                  isActive ? "border-accent bg-accent-bg" : "border-line bg-surface"
                }`}
              >
                {isActive && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-black stroke-[3]">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </div>
                )}
                <div className={`text-sm font-semibold ${isActive ? "text-accent" : "text-ink"}`}>{w.name}</div>
                <div className="mt-0.5 text-[11px] text-ink-3">{w.exercises?.length ?? 0} exercises</div>
              </button>
            );
          })}
        </div>
      </div>

      {managePanelOpen && (
        <div className="mx-4 mb-4 flex flex-col gap-2.5 rounded-card border border-line-2 bg-surface p-3.5">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Manage workouts</div>
          {workouts.map((w) => (
            <div key={w.id} className="rounded-md2 bg-surface-2 p-2.5">
              {renamingId === w.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="h-9 flex-1 rounded-md2 border border-line-2 bg-surface-3 px-2.5 text-[13px]"
                  />
                  <button
                    onClick={async () => {
                      if (renameValue.trim()) await renameWorkout(w.id, renameValue.trim());
                      setRenamingId(null);
                    }}
                    className="h-9 rounded-md2 bg-accent px-3 text-xs font-semibold text-black"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setRenamingId(null)}
                    className="h-9 rounded-md2 border border-line-2 bg-surface-3 px-3 text-xs text-ink-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : deletingId === w.id ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-ink-2">Delete "{w.name}"? Past data stays saved.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeletingId(null)}
                      className="flex-1 rounded-md2 border border-line-2 bg-surface-3 py-2 text-xs text-ink-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await deleteWorkout(w.id);
                        if (activeId === w.id) setActiveId(null);
                        setDeletingId(null);
                      }}
                      className="flex-1 rounded-md2 bg-danger py-2 text-xs font-bold text-black"
                    >
                      Yes, delete
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 text-[13px] font-semibold">{w.name}</div>
                    <div className="text-[11px] text-ink-3">{w.exercises?.length ?? 0} ex</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => {
                        setActiveId(w.id);
                        setManagePanelOpen(false);
                      }}
                      className="rounded-md2 border border-accent-border bg-accent-bg px-2.5 py-1 text-[11px] font-medium text-accent"
                    >
                      Use today
                    </button>
                    <button
                      onClick={() => setEditingExercisesId(editingExercisesId === w.id ? null : w.id)}
                      className={`rounded-md2 border px-2.5 py-1 text-[11px] font-medium ${
                        editingExercisesId === w.id ? "border-accent-border bg-accent-bg text-accent" : "border-line-2 bg-surface-3 text-ink-2"
                      }`}
                    >
                      Edit exercises
                    </button>
                    <button
                      onClick={() => {
                        setRenamingId(w.id);
                        setRenameValue(w.name);
                      }}
                      className="rounded-md2 border border-line-2 bg-surface-3 px-2.5 py-1 text-[11px] text-ink-2"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => setDeletingId(w.id)}
                      className="rounded-md2 border border-line-2 bg-surface-3 px-2.5 py-1 text-[11px] text-danger"
                    >
                      Delete
                    </button>
                  </div>

                  {editingExercisesId === w.id && (
                    <div className="mt-2.5 flex flex-col gap-1.5 border-t border-line-2 pt-2.5">
                      <div className="text-[10px] uppercase tracking-wide text-ink-3">
                        Exercises in this bucket — removing here is permanent
                      </div>
                      {(w.exercises ?? []).map((ex) =>
                        removeExId === ex.id ? (
                          <div key={ex.id} className="flex items-center justify-between gap-2 rounded-md2 bg-danger-bg px-2.5 py-1.5">
                            <span className="text-[11px] text-ink-2">Remove "{ex.name}" permanently?</span>
                            <div className="flex flex-shrink-0 gap-1.5">
                              <button
                                onClick={() => setRemoveExId(null)}
                                className="rounded-md2 border border-line-2 bg-surface-3 px-2 py-1 text-[10px] text-ink-2"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={async () => {
                                  await removeExercise(ex.id);
                                  setRemoveExId(null);
                                }}
                                className="rounded-md2 bg-danger px-2 py-1 text-[10px] font-bold text-black"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div key={ex.id} className="flex items-center justify-between gap-2 rounded-md2 bg-surface-3 px-2.5 py-1.5">
                            <span className="text-[11px]">{ex.name}</span>
                            <button onClick={() => setRemoveExId(ex.id)} className="flex-shrink-0 text-ink-3">
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
                                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" />
                              </svg>
                            </button>
                          </div>
                        )
                      )}
                      <AddExerciseInline workoutId={w.id} onAdd={addExercise} />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={newWorkoutName}
              onChange={(e) => setNewWorkoutName(e.target.value)}
              placeholder="New workout name..."
              className="h-10 flex-1 rounded-md2 border border-line-2 bg-surface-2 px-2.5 text-[13px]"
            />
            <button
              onClick={async () => {
                if (!newWorkoutName.trim()) return;
                await addWorkout(newWorkoutName.trim());
                setNewWorkoutName("");
              }}
              className="rounded-md2 bg-accent px-4 text-[13px] font-bold text-black"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="px-4 pb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
        {active ? active.name : "No workouts yet"}
      </div>

      <div className="flex flex-col gap-2 px-4">
        {visibleExercises.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} onSaved={refresh} onSkip={handleSkipToday} />
        ))}
      </div>

      {skippedExercises.length > 0 && (
        <div className="mx-4 mt-2 flex flex-col gap-1.5 rounded-card border border-line bg-surface p-3">
          <div className="text-[11px] text-ink-3">Skipped for today — still in this bucket for next time:</div>
          {skippedExercises.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink-2">{ex.name}</span>
              <button onClick={() => handleRestoreToday(ex.id)} className="text-xs font-medium text-accent">
                Add back
              </button>
            </div>
          ))}
        </div>
      )}

      {active && (
        <div className="mt-2 px-4">
          {showAddEx ? (
            <div className="flex flex-col gap-2.5 rounded-card border border-accent-border bg-surface p-3.5">
              <input
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                placeholder="Exercise name..."
                className="h-11 rounded-md2 border border-line-2 bg-surface-2 px-3 text-[15px]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddEx(false);
                    setNewExName("");
                  }}
                  className="flex-1 rounded-md2 border border-line bg-surface-2 py-3 text-sm text-ink-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newExName.trim()) return;
                    await addExercise(active.id, newExName.trim());
                    setNewExName("");
                    setShowAddEx(false);
                  }}
                  className="flex-1 rounded-md2 bg-accent py-3 text-sm font-bold text-black"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddEx(true)}
              className="w-full rounded-card border border-dashed border-line-3 py-3.5 text-sm font-medium text-ink-2"
            >
              + Add exercise
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AddExerciseInline({ workoutId, onAdd }: { workoutId: string; onAdd: (workoutId: string, name: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-1 text-left text-[11px] font-medium text-accent">
        + Add exercise to this bucket
      </button>
    );
  }

  return (
    <div className="mt-1 flex gap-1.5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Exercise name..."
        className="h-8 flex-1 rounded-md2 border border-line-2 bg-surface-2 px-2 text-[12px]"
      />
      <button
        onClick={async () => {
          if (!name.trim()) return;
          await onAdd(workoutId, name.trim());
          setName("");
          setOpen(false);
        }}
        className="rounded-md2 bg-accent px-2.5 text-[11px] font-bold text-black"
      >
        Add
      </button>
    </div>
  );
}
