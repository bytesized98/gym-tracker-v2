import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import type { Exercise } from "@/lib/types";
import { computeStagnation, chartTheme } from "@/lib/types";
import { useEntries } from "@/hooks/useEntries";
import EntryRow from "./EntryRow";

interface Props {
  exercise: Exercise;
  onSaved: () => void;
  onSkip: (exerciseId: string) => void;
}

function daysAgo(dateIso: string): string {
  const d = new Date(dateIso);
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  const diff = Math.round((n.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export default function ExerciseCard({ exercise, onSaved, onSkip }: Props) {
  const { saveEntry, getBaseline, getTodayEntry } = useEntries();
  const entries = exercise.entries ?? [];
  const baseline = getBaseline(entries);
  const today = getTodayEntry(entries);
  const stagnation = useMemo(() => computeStagnation(entries), [entries]);

  const [weight, setWeight] = useState(today?.weight?.toString() ?? "");
  const [reps, setReps] = useState(today?.reps?.toString() ?? "");
  const [sets, setSets] = useState(today?.sets?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const w = parseFloat(weight) || 0;
  const r = parseInt(reps) || 0;
  const s = parseInt(sets) || 0;

  const isLogged = !!today;
  // Dirty = either nothing saved yet (brand new), or values differ from what's saved.
  const isDirty = !isLogged || w !== today?.weight || r !== today?.reps || s !== today?.sets;
  const isValid = w > 0 && r > 0 && s > 0;

  const trend = useMemo(() => {
    if (!baseline || !w || !r || !s) return null;
    const dw = w - baseline.weight;
    const dr = r - baseline.reps;
    const ds = s - baseline.sets;
    const parts: string[] = [];
    if (dw !== 0) parts.push(`${dw > 0 ? "+" : ""}${dw} lbs`);
    if (dr !== 0) parts.push(`${dr > 0 ? "+" : ""}${dr} reps`);
    if (ds !== 0) parts.push(`${ds > 0 ? "+" : ""}${ds} sets`);
    if (parts.length === 0) return { text: "Same as last time", up: null };
    return { text: parts.join(", "), up: dw > 0 || dr > 0 || ds > 0 };
  }, [baseline, w, r, s]);

  async function handleSave() {
    if (!isValid || !isDirty) return;
    setSaving(true);
    try {
      await saveEntry(exercise.id, w, r, s);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const isStagnant = stagnation.status === "stagnant";
  const sortedEntries = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div
      className={`rounded-card border bg-surface ${
        isStagnant ? "border-warn-bg" : isLogged ? "border-accent-border" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-2 p-3.5 pb-0">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-snug">
            {exercise.name}
            {exercise.optional && <span className="ml-1 text-xs font-normal text-ink-3">(optional)</span>}
          </div>
          {isStagnant && (
            <div className="mt-1 inline-block rounded-full bg-warn-bg px-2 py-0.5 text-[10px] font-semibold text-warn">
              No progress in {stagnation.sessions} sessions
            </div>
          )}
        </div>
        <div className="flex flex-shrink-0 gap-1.5">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={`rounded-md2 border px-2.5 py-1 text-[11px] font-medium ${
              showHistory ? "border-accent-border bg-accent-bg text-accent" : "border-line-2 bg-surface-2 text-ink-2"
            }`}
          >
            History
          </button>
          <button
            onClick={() => setConfirmRemove(true)}
            title="Skip for today"
            className="flex h-7 w-7 items-center justify-center rounded-md2 border border-line-2 bg-surface-2"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-ink-3" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-10-8-10-8a18.5 18.5 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 10 8 10 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24M1 1l22 22" />
            </svg>
          </button>
        </div>
      </div>

      {confirmRemove && (
        <div className="m-3.5 flex flex-col gap-2 rounded-md2 border border-danger/25 bg-danger-bg p-3">
          <p className="text-xs text-ink-2">
            Skip "{exercise.name}" for today? It stays in this bucket and will reappear next time.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmRemove(false)}
              className="flex-1 rounded-md2 border border-line-2 bg-surface-2 py-2 text-xs text-ink-2"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSkip(exercise.id);
                setConfirmRemove(false);
              }}
              className="flex-1 rounded-md2 bg-danger py-2 text-xs font-bold text-black"
            >
              Skip for today
            </button>
          </div>
        </div>
      )}

      {baseline ? (
        <div className="flex gap-1.5 px-3.5 pb-2.5">
          {[
            ["Last wt", `${baseline.weight} lbs`, daysAgo(baseline.date)],
            ["Last reps", `${baseline.reps}`, null],
            ["Last sets", `${baseline.sets}`, null]
          ].map(([label, val, sub], i) => (
            <div key={i} className="flex-1 rounded-md2 bg-surface-2 px-1.5 py-2 text-center">
              <div className="text-[9px] uppercase tracking-wide text-ink-3">{label}</div>
              <div className="mt-0.5 text-sm font-bold tabular-nums text-ink-2">{val}</div>
              {sub && <div className="text-[9px] text-ink-3">{sub}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-3.5 pb-2.5 text-xs text-ink-3">No previous session yet — this will set your baseline</div>
      )}

      <div className="grid grid-cols-3 gap-1.5 px-3.5 pb-2.5">
        {[
          ["Weight", "lbs", weight, setWeight],
          ["Reps", "reps", reps, setReps],
          ["Sets", "sets", sets, setSets]
        ].map(([label, placeholder, value, setter], i) => (
          <div key={i}>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-ink-3">{label as string}</label>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              placeholder={placeholder as string}
              value={value as string}
              onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              className="h-12 w-full rounded-md2 border border-line-2 bg-surface-2 text-center text-lg font-bold tabular-nums outline-none focus:border-accent focus:bg-accent-bg"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 px-3.5 pb-3">
        <span className="text-[11px] text-ink-3">vs last session:</span>
        <span
          className={`text-[11px] font-semibold ${
            trend === null ? "text-ink-2" : trend.up === null ? "text-ink-2" : trend.up ? "text-accent" : "text-danger"
          }`}
        >
          {trend?.text ?? "—"}
        </span>
      </div>

      <div className="flex items-center justify-between px-3.5 pb-3.5">
        <span className={`text-xs text-accent transition-opacity ${isLogged && !isDirty ? "opacity-100" : "opacity-0"}`}>
          ✓ Saved
        </span>
        <button
          onClick={handleSave}
          disabled={!isValid || !isDirty || saving}
          className={`rounded-md2 px-6 py-2.5 text-[13px] font-bold transition-colors ${
            isValid && isDirty ? "bg-accent text-black" : "border border-line-2 bg-surface-3 text-ink-3"
          }`}
        >
          {saving ? "Saving..." : isLogged ? "Update" : "Save"}
        </button>
      </div>

      {showHistory && (
        <div className="flex flex-col gap-2.5 border-t border-line p-3.5">
          <div className="text-[11px] uppercase tracking-wide text-ink-3">All recorded sessions — tap any to edit</div>

          {entries.length > 0 && (() => {
            const ct = chartTheme();
            return (
            <div className="h-[110px]">
              <Line
                data={{
                  labels: [...entries].sort((a, b) => (a.date < b.date ? -1 : 1)).map((e) => e.date.slice(5)),
                  datasets: [
                    {
                      data: [...entries].sort((a, b) => (a.date < b.date ? -1 : 1)).map((e) => e.weight),
                      borderColor: ct.accent,
                      backgroundColor: "rgba(232,131,107,.08)",
                      pointBackgroundColor: ct.accent,
                      pointRadius: 4,
                      tension: 0.3,
                      fill: true,
                      borderWidth: 2
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: ct.tooltipBg,
                      borderColor: ct.tooltipBorder,
                      borderWidth: 1,
                      bodyColor: ct.tooltipText,
                      padding: 8,
                      callbacks: { label: (c) => `${c.parsed.y} lbs` }
                    }
                  },
                  scales: {
                    x: { ticks: { font: { size: 10 }, color: ct.tick, autoSkip: true, maxTicksLimit: 6 }, grid: { display: false } },
                    y: { ticks: { font: { size: 10 }, color: ct.tick }, grid: { color: ct.grid } }
                  }
                }}
              />
            </div>
            );
          })()}

          <div className="flex max-h-64 flex-col overflow-y-auto">
            {sortedEntries.length === 0 ? (
              <div className="text-xs text-ink-3">No history yet.</div>
            ) : (
              sortedEntries.map((e, idx) => (
                <EntryRow key={e.id} entry={e} prevEntry={sortedEntries[idx + 1]} onUpdated={onSaved} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
