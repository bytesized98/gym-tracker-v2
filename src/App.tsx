import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/components/Login";
import TabBar from "@/components/TabBar";
import WorkoutTab from "@/components/WorkoutTab";
import HistoryTab from "@/components/HistoryTab";
import AICoachTab from "@/components/AICoachTab";

export default function App() {
  const { session, loading } = useAuth();
  const [tab, setTab] = useState("workout");

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-3">Loading...</div>;
  }

  if (!session) {
    return <Login />;
  }

  const userId = session.user.id;

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden">
        {tab === "workout" && <WorkoutTab userId={userId} />}
        {tab === "history" && <HistoryTab userId={userId} />}
        {tab === "ai" && <AICoachTab userId={userId} />}
      </div>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
