import { useEffect, useRef, useState } from "react";
import { useAICoach, type ChatMessage } from "@/hooks/useAICoach";
import { useWorkouts } from "@/hooks/useWorkouts";

interface Props {
  userId: string;
}

const QUICK_PROMPTS = [
  "Analyze my progress",
  "What should I increase?",
  "Suggest exercise variations",
  "Any combos not working?",
  "Am I overtraining?",
  "Weekly summary"
];

export default function AICoachTab({ userId }: Props) {
  const { workouts } = useWorkouts(userId);
  const { ask, sending } = useAICoach();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [autoRan, setAutoRan] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasData = workouts.some((w) => (w.exercises ?? []).some((ex) => (ex.entries?.length ?? 0) > 0));

  useEffect(() => {
    if (autoRan || workouts.length === 0) return;
    setAutoRan(true);
    if (!hasData) {
      setMessages([{ role: "assistant", content: "Hey! Log a few workouts and I'll start spotting trends, flagging stagnation, and suggesting tweaks. 💪" }]);
      return;
    }
    (async () => {
      setMessages([{ role: "assistant", content: "Looking over your training..." }]);
      const reply = await ask([], "auto_analysis");
      setMessages([{ role: "assistant", content: reply }]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts.length, hasData, autoRan]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim()) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages([...next, { role: "assistant", content: "..." }]);
    const reply = await ask(next.slice(-10));
    setMessages([...next, { role: "assistant", content: reply }]);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b border-line px-4 pb-3.5 pt-5">
        <h2 className="text-lg font-bold tracking-tight">AI Coach</h2>
        <p className="mt-0.5 text-xs text-ink-2">Ask anything about your training</p>
      </div>

      <div className="flex flex-shrink-0 gap-1.5 overflow-x-auto px-3.5 py-2.5">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="flex-shrink-0 whitespace-nowrap rounded-full border border-line-2 bg-surface-2 px-3 py-1.5 text-xs text-ink-2"
          >
            {q}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3.5">
        {messages.map((m, i) => (
          <div key={i} className={`flex max-w-[88%] flex-col gap-1 ${m.role === "user" ? "self-end items-end" : "self-start items-start"}`}>
            <div
              className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-accent font-medium text-black"
                  : "rounded-bl-sm border border-line-2 bg-surface-2 text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-shrink-0 gap-2 border-t border-line px-3.5 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(input);
          }}
          placeholder="Ask your coach..."
          className="h-[42px] flex-1 rounded-full border border-line-2 bg-surface-2 px-4 text-[15px] outline-none focus:border-accent"
        />
        <button
          onClick={() => send(input)}
          disabled={sending}
          className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full bg-accent disabled:bg-surface-3"
        >
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-black stroke-2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
