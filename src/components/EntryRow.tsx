import { useState } from "react";
import type { Entry } from "@/lib/types";
import { useEntries } from "@/hooks/useEntries";

interface Props {
  entry: Entry;
  /** The entry immediately before this one chronologically, for showing a delta. */
  prevEntry?: Entry | null;
  onUpdated: () => void;
  /** Compact = single-line table-style row (used in ExerciseCard/HistoryTab list).
   *  Detailed = used in Calendar day-detail panel, shows exercise name alongside. */
  variant?: "compact" | "detailed";
  exerciseName?: string;
}

export default function EntryRow({ entry, prevEntry, onUpdated, variant = "compact", exerciseName }: Props) {
  const { updateEntry, deleteEntry } = useEntries();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [weight, setWeight] = useState(entry.weight.toString());
  const [reps, setReps] = useState(entry.reps.toString());
  const [sets, setSets] = useState(entry.sets.toString());
  const [saving, setSaving] = useState(false);

  const w = parseFloat(weight) || 0;
  const r = parseInt(reps) || 0;
  const s = parseInt(sets) || 0;
  const isDirty = w !== entry.weight || r !== entry.reps || s !== entry.sets;
  const isValid = w > 0 && r > 0 && s > 0;

  function startEdit() {
    setWeight(entry.weight.toString());
    setReps(entry.reps.toString());
    setSets(entry.sets.toString());
    setConfirmDelete(false);
    setEditing(true);
  }

  async function handleSave() {
    if (!isValid || !isDirty) return;
    setSaving(true);
    try {
      await updateEntry(entry.id, w, r, s);
      setEditing(false);
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteEntry(entry.id);
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  const dw = prevEntry ? entry.weight - prevEntry.weight : 0;
  const dr = prevEntry ? entry.reps - prevEntry.reps : 0;
  const deltaText = !prevEntry ? "first" : dw !== 0 ? `${dw > 0 ? "+" : ""}${dw} lbs` : dr !== 0 ? `${dr > 0 ? "+" : ""}${dr} reps` : "—";
  const deltaClass = dw > 0 || dr > 0 ? "text-accent" : dw < 0 || dr < 0 ? "text-danger" : "text-ink-3";

  if (editing) {
    if (confirmDelete) {
      return (
        <div className="mb-1.5 flex flex-col gap-2 rounded-md2 border border-danger/30 bg-danger-bg p-2.5">
          <p className="text-xs text-ink-2">Delete this entry from {entry.date}? This can't be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-md2 border border-line-2 bg-surface-2 py-1.5 text-[11px] text-ink-2"
            >
              Cancel
            </button>
            <button onClick={handleDelete} disabled={saving} className="flex-1 rounded-md2 bg-danger py-1.5 text-[11px] font-bold text-black">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-1.5 flex flex-col gap-2 rounded-md2 border border-accent-border bg-accent-bg p-2.5">
        {variant === "detailed" && exerciseName && <div className="text-xs font-medium text-ink">{exerciseName}</div>}
        <div className="flex items-center gap-1.5">
          <div className="w-11 flex-shrink-0 text-[11px] text-ink-3">{entry.date.slice(5)}</div>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="lbs"
            inputMode="decimal"
            className="h-9 w-16 rounded-md2 border border-line-2 bg-surface-2 text-center text-xs font-semibold tabular-nums outline-none focus:border-accent"
          />
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="reps"
            inputMode="decimal"
            className="h-9 w-16 rounded-md2 border border-line-2 bg-surface-2 text-center text-xs font-semibold tabular-nums outline-none focus:border-accent"
          />
          <input
            type="number"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            placeholder="sets"
            inputMode="decimal"
            className="h-9 w-16 rounded-md2 border border-line-2 bg-surface-2 text-center text-xs font-semibold tabular-nums outline-none focus:border-accent"
          />
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md2 border border-line-2 bg-surface-2"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-danger stroke-[1.8]">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 rounded-md2 border border-line-2 bg-surface-2 py-1.5 text-[11px] text-ink-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || !isDirty || saving}
            className={`flex-1 rounded-md2 py-1.5 text-[11px] font-bold ${
              isValid && isDirty ? "bg-accent text-black" : "border border-line-2 bg-surface-3 text-ink-3"
            }`}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      className="mb-1.5 flex w-full items-center gap-2.5 rounded-md2 border border-line bg-surface px-3 py-2.5 text-left active:bg-surface-2"
    >
      <div className="w-11 flex-shrink-0 text-[11px] text-ink-3">{entry.date.slice(5)}</div>
      {variant === "detailed" && exerciseName && <div className="min-w-0 flex-1 truncate text-xs text-ink-2">{exerciseName}</div>}
      <div className="flex flex-1 gap-2.5 text-[13px] font-semibold tabular-nums">
        <span>
          {entry.weight}
          <span className="block text-[10px] font-normal text-ink-3">lbs</span>
        </span>
        <span>
          {entry.reps}
          <span className="block text-[10px] font-normal text-ink-3">reps</span>
        </span>
        <span>
          {entry.sets}
          <span className="block text-[10px] font-normal text-ink-3">sets</span>
        </span>
      </div>
      <div className={`flex-shrink-0 text-xs font-semibold ${deltaClass}`}>{deltaText}</div>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0 fill-none stroke-ink-3 stroke-[1.8]">
        <path d="M11 4h2a1 1 0 011 1v2M17.5 6.5l2 2L9 19l-3.5.5L6 16z" />
      </svg>
    </button>
  );
}
