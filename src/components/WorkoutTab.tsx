import { useState } from "react";
import { useWorkouts } from "@/hooks/useWorkouts";
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

  const suggested = getSuggestedWorkout();
  const active = workouts.find((w) => w.id === activeId) ?? workouts.find((w) => w.id === suggested?.id) ?? workouts[0];

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
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 fill-none stroke-1.8 ${managePanelOpen ? "stroke-accent" : "stroke-ink-2"}`}
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 008.6 5a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09A1.65 1.65 0 0019.4 15z" />
          </svg>
        </button>
      </div>

      {suggested && (
        <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-md2 border border-accent-border bg-accent-bg p-3">
          <div className="text-xs font-medium text-accent">
            Suggested next
            <div className="mt-0.5 text-base font-bold text-ink">{suggested.name}</div>
          </div>
          <button
            onClick={() => setActiveId(suggested.id)}
            className="flex-shrink-0 rounded-md2 bg-accent px-4 py-2 text-xs font-bold text-black"
          >
            Start
          </button>
        </div>
      )}

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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-[13px] font-semibold">{w.name}</div>
                  <div className="text-[11px] text-ink-3">{w.exercises?.length ?? 0} ex</div>
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

      <div className="mb-3.5 flex gap-2 overflow-x-auto px-4">
        {workouts.map((w) => (
          <button
            key={w.id}
            onClick={() => setActiveId(w.id)}
            className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2.5 text-[13px] font-medium ${
              active?.id === w.id ? "border-accent-border bg-accent-bg text-accent" : "border-line-2 bg-surface text-ink-2"
            }`}
          >
            {w.name}
          </button>
        ))}
      </div>

      <div className="px-4 pb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
        {active ? active.name : "No workouts yet"}
      </div>

      <div className="flex flex-col gap-2 px-4">
        {active?.exercises?.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            onSaved={refresh}
            onRemove={async (id) => {
              await removeExercise(id);
            }}
          />
        ))}
      </div>

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
