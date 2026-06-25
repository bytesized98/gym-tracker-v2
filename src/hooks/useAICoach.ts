import { useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useAICoach() {
  const [sending, setSending] = useState(false);

  /** Calls the ai-coach Edge Function directly via fetch (bypassing
   *  supabase-js's functions.invoke, which was constructing a URL that
   *  the browser couldn't reach even though the function itself is live —
   *  confirmed working via curl against this exact URL pattern). */
  async function ask(messages: ChatMessage[], mode: "chat" | "auto_analysis" = "chat") {
    setSending(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Not signed in — please refresh and sign in again.");
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ messages, mode })
      });

      const body = await res.json().catch(() => ({}) as any);
      if (!res.ok) {
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      return (body?.reply as string) ?? "Sorry, I couldn't get a response.";
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      return `Error: ${message}`;
    } finally {
      setSending(false);
    }
  }

  return { ask, sending };
}
