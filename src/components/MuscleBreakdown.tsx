import { useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import type { Workout } from "@/lib/types";
import { vol, workoutColor } from "@/lib/types";

interface Props {
  workouts: Workout[];
}

type Timeframe = "all" | "4w";

function weeksAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  const pad = (x: number) => (x < 10 ? `0${x}` : `${x}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function MuscleBreakdown({ workouts }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>("all");

  const totals = useMemo(() => {
    const fromIso = timeframe === "4w" ? weeksAgoISO(4) : null;
    return workouts
      .map((w, idx) => {
        let total = 0;
        (w.exercises ?? []).forEach((ex) => {
          (ex.entries ?? []).forEach((e) => {
            if (!fromIso || e.date >= fromIso) total += vol(e);
          });
        });
        return { id: w.id, name: w.name, total, color: workoutColor(idx) };
      })
      .filter((t) => t.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [workouts, timeframe]);

  const grandTotal = totals.reduce((a, t) => a + t.total, 0);

  return (
    <div className="mx-4 mb-4 rounded-card border border-line bg-surface p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-semibold">Volume by workout</div>
        <div className="flex gap-1.5">
          {([
            ["all", "All time"],
            ["4w", "Last 4 weeks"]
          ] as [Timeframe, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTimeframe(key)}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                timeframe === key ? "border-accent-border bg-accent-bg text-accent" : "border-line-2 bg-surface-2 text-ink-2"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {totals.length === 0 ? (
        <div className="py-2.5 text-center text-xs text-ink-3">No data yet for this timeframe.</div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="h-[110px] w-[110px] flex-shrink-0">
            <Doughnut
              data={{
                labels: totals.map((t) => t.name),
                datasets: [
                  {
                    data: totals.map((t) => t.total),
                    backgroundColor: totals.map((t) => t.color),
                    borderWidth: 0
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#1c1c1c",
                    borderColor: "#333",
                    borderWidth: 1,
                    bodyColor: "#eee",
                    padding: 8,
                    callbacks: {
                      label: (c) => `${c.label}: ${Math.round(c.parsed).toLocaleString()} lbs vol`
                    }
                  }
                }
              }}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {totals.map((t) => {
              const pct = Math.round((t.total / grandTotal) * 100);
              return (
                <div key={t.id} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: t.color }} />
                  <div className="flex-1 truncate text-xs text-ink-2">{t.name}</div>
                  <div className="text-xs font-bold tabular-nums" style={{ color: t.color }}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
