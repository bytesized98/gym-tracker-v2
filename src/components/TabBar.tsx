interface Props {
  active: string;
  onChange: (tab: string) => void;
}

const TABS = [
  {
    id: "workout",
    label: "Workout",
    icon: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    )
  },
  {
    id: "history",
    label: "History",
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  },
  {
    id: "ai",
    label: "AI Coach",
    icon: (
      <>
        <path d="M12 2a10 10 0 110 20A10 10 0 0112 2z" />
        <path d="M12 16v-4M12 8h.01" />
      </>
    )
  }
];

export default function TabBar({ active, onChange }: Props) {
  return (
    <div className="flex flex-shrink-0 border-t border-line bg-bg/95 px-0 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-1 ${active === tab.id ? "text-accent" : "text-ink-3"}`}
        >
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {tab.icon}
          </svg>
          <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
