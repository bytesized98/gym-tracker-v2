import { useMemo, useState } from "react";
import type { Entry, Workout } from "@/lib/types";
import { todayISO, workoutColor } from "@/lib/types";
import EntryRow from "./EntryRow";

interface Props {
  workouts: Workout[];
  onUpdated: () => void;
}

const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface DayEntry {
  workoutId: string;
  workoutName: string;
  color: string;
  exName: string;
  entry: Entry;
}

export default function CalendarView({ workouts, onUpdated }: Props) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const todayIso = todayISO();

  const entriesByDate = useMemo(() => {
    const map: Record<string, DayEntry[]> = {};
    workouts.forEach((w, idx) => {
      const color = workoutColor(idx);
      (w.exercises ?? []).forEach((ex) => {
        (ex.entries ?? []).forEach((e) => {
          if (!map[e.date]) map[e.date] = [];
          map[e.date].push({ workoutId: w.id, workoutName: w.name, color, exName: ex.name, entry: e });
        });
      });
    });
    return map;
  }, [workouts]);

  const selectedEntries = selectedDate ? entriesByDate[selectedDate] ?? [] : [];
  const groupedSelected = useMemo(() => {
    const groups: Record<string, { name: string; color: string; items: DayEntry[] }> = {};
    selectedEntries.forEach((e) => {
      if (!groups[e.workoutId]) groups[e.workoutId] = { name: e.workoutName, color: e.color, items: [] };
      groups[e.workoutId].items.push(e);
    });
    return Object.values(groups);
  }, [selectedEntries]);

  const cells: { day: number | null; dateIso: string | null }[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, dateIso: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateIso: `${year}-${pad(month + 1)}-${pad(d)}` });
  }

  return (
    <div className="mx-4 mb-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setMonthOffset((v) => v - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line-2 bg-surface-2"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-ink-2 stroke-2">
            <path d="M10 12L6 8l4-4" />
          </svg>
        </button>
        <div className="text-sm font-semibold">
          {MN[month]} {year}
        </div>
        <button
          onClick={() => setMonthOffset((v) => v + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line-2 bg-surface-2"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-ink-2 stroke-2">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="pb-1 text-center text-[10px] uppercase tracking-wide text-ink-3">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (cell.day === null) return <div key={i} className="aspect-square" />;
          const dayEntries = entriesByDate[cell.dateIso!] ?? [];
          const seenWorkouts = new Set<string>();
          const dots = dayEntries.filter((e) => {
            if (seenWorkouts.has(e.workoutId)) return false;
            seenWorkouts.add(e.workoutId);
            return true;
          });
          const isToday = cell.dateIso === todayIso;
          const isSelected = cell.dateIso === selectedDate;
          const uniqueNames = Array.from(new Set(dots.map((d) => d.workoutName)));
          const label = uniqueNames.length === 0 ? "" : uniqueNames.length === 1 ? uniqueNames[0] : `${uniqueNames.length} workouts`;
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(cell.dateIso)}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md2 border px-0.5 ${
                isSelected ? "border-accent-border bg-accent-bg" : isToday ? "border-accent" : "border-line bg-surface"
              }`}
            >
              <div className={`text-xs font-medium ${isToday ? "font-bold text-accent" : "text-ink-2"}`}>{cell.day}</div>
              {dots.length > 0 && (
                <div className="flex gap-0.5">
                  {dots.slice(0, 4).map((d, di) => (
                    <div key={di} className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                  ))}
                </div>
              )}
              {label && (
                <div className="w-full truncate px-0.5 text-center text-[7px] leading-tight text-ink-3">{label}</div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-3.5 rounded-card border border-line bg-surface p-3.5">
          <div className="mb-2.5 text-[13px] font-semibold">
            {(() => {
              const d = new Date(selectedDate);
              return `${DW[d.getDay()]}, ${MN[d.getMonth()]} ${d.getDate()}`;
            })()}
          </div>
          {groupedSelected.length === 0 ? (
            <div className="py-2.5 text-center text-xs text-ink-3">No workout logged this day.</div>
          ) : (
            groupedSelected.map((g, gi) => (
              <div key={gi} className="mb-2.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
                  <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />
                  {g.name}
                </div>
                {g.items.map((item) => (
                  <EntryRow
                    key={item.entry.id}
                    entry={item.entry}
                    variant="detailed"
                    exerciseName={item.exName}
                    onUpdated={onUpdated}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
