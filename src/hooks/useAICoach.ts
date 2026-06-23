import { useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useAICoach() {
  const [sending, setSending] = useState(false);

  /** Calls the ai-coach Edge Function. The user's JWT is attached automatically
   *  by supabase-js, which the function uses server-side to fetch their own
   *  workout data and to call Gemini with a key that never reaches the browser. */
  async function ask(messages: ChatMessage[], mode: "chat" | "auto_analysis" = "chat") {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: { messages, mode }
      });
      if (error) throw error;
      return (data?.reply as string) ?? "Sorry, I couldn't get a response.";
    } catch (err) {
      console.error(err);
      return "Connection error. Make sure you're online and try again.";
    } finally {
      setSending(false);
    }
  }

  return { ask, sending };
}
