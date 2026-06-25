import { useState } from "react";
import { useWorkouts } from "@/hooks/useWorkouts";
import MuscleBreakdown from "./MuscleBreakdown";
import CalendarView from "./CalendarView";
import EntryRow from "./EntryRow";

interface Props {
  userId: string;
}

type ViewMode = "list" | "calendar";

export default function HistoryTab({ userId }: Props) {
  const { workouts, refresh } = useWorkouts(userId);
  const [filterId, setFilterId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("list");

  const shown = filterId ? workouts.filter((w) => w.id === filterId) : workouts;

  return (
    <div className="flex h-full flex-col overflow-y-auto pb-8">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-bg px-4 pb-4 pt-5">
        <h2 className="text-xl font-bold tracking-tight">History</h2>
        <div className="flex gap-0.5 rounded-full border border-line-2 bg-surface-2 p-0.5">
          {(["list", "calendar"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                view === v ? "bg-accent text-black" : "text-ink-3"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <MuscleBreakdown workouts={workouts} />

      {view === "calendar" ? (
        <CalendarView workouts={workouts} onUpdated={refresh} />
      ) : (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto px-4">
            <button
              onClick={() => setFilterId(null)}
              className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                !filterId ? "border-accent-border bg-accent-bg text-accent" : "border-line-2 bg-surface text-ink-2"
              }`}
            >
              All
            </button>
            {workouts.map((w) => (
              <button
                key={w.id}
                onClick={() => setFilterId(w.id)}
                className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                  filterId === w.id ? "border-accent-border bg-accent-bg text-accent" : "border-line-2 bg-surface text-ink-2"
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>

          <div className="px-4">
            {shown.map((w) => (
              <div key={w.id} className="mb-5">
                <div className="mb-2 border-b border-line pb-1.5 text-sm font-semibold">{w.name}</div>
                {(w.exercises ?? []).map((ex) => {
                  const entries = [...(ex.entries ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
                  if (entries.length === 0) return null;
                  return (
                    <div key={ex.id} className="mb-3.5">
                      <div className="mb-1.5 text-xs font-semibold text-ink-2">{ex.name}</div>
                      {entries.map((e, idx) => (
                        <EntryRow key={e.id} entry={e} prevEntry={entries[idx + 1]} onUpdated={refresh} />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
            {shown.length === 0 && <div className="py-10 text-center text-sm text-ink-3">No workouts yet.</div>}
          </div>
        </>
      )}
    </div>
  );
}
