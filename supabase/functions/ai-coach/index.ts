// supabase/functions/ai-coach/index.ts
//
// Deploy with: supabase functions deploy ai-coach
// Set the secret once with: supabase secrets set GEMINI_API_KEY=your-key-here
//
// This function:
//  1. Authenticates the caller via their Supabase JWT (passed automatically
//     by supabase-js when you call functions.invoke from the logged-in app)
//  2. Pulls the user's full workout history server-side (service role —
//     bypasses RLS safely since we've already verified who they are)
//  3. Computes stagnation flags the same way the original app did
//  4. Calls Gemini with the server-side key (never exposed to the browser)
//  5. Returns the AI's reply

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function vol(e: { weight: number; reps: number; sets: number }) {
  return e.weight * e.reps * e.sets;
}

async function buildWorkoutContext(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, name, exercises(id, name, optional, entries(date, weight, reps, sets))")
    .eq("user_id", userId)
    .order("sort_order");

  let ctx = "USER WORKOUT DATA (rotation-based, not tied to fixed calendar days):\n\n";

  for (const w of workouts ?? []) {
    ctx += `WORKOUT: ${w.name}\n`;
    let evaluated = 0;
    let stagnantCount = 0;

    for (const ex of w.exercises ?? []) {
      const entries = (ex.entries ?? []).sort((a: any, b: any) => (a.date < b.date ? -1 : 1));
      if (entries.length === 0) {
        ctx += `  ${ex.name}: no data yet\n`;
        continue;
      }
      ctx += `  ${ex.name} (${entries.length} sessions total):\n`;
      entries.slice(-8).forEach((e: any) => {
        ctx += `    ${e.date}: ${e.weight}lbs x ${e.reps} reps x ${e.sets} sets\n`;
      });

      if (entries.length >= 4) {
        const last4 = entries.slice(-4);
        const oldVol = vol(last4[0]);
        const newVol = vol(last4[last4.length - 1]);
        evaluated++;
        if (newVol <= oldVol) {
          stagnantCount++;
          ctx += `    >> FLAG: no volume improvement across last 4 sessions (was ${oldVol}, now ${newVol})\n`;
        } else {
          ctx += `    >> Improving across last 4 sessions\n`;
        }
      }
    }

    if (evaluated >= 2 && stagnantCount / evaluated >= 0.5) {
      ctx += `  >> WORKOUT-LEVEL FLAG: ${stagnantCount}/${evaluated} evaluated exercises in ${w.name} are stagnant. This combination may need a change.\n`;
    }
    ctx += "\n";
  }

  return ctx;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401 });
    }

    // Client scoped to the caller's JWT — used only to verify identity.
    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
    }
    const userId = userData.user.id;

    // Service-role client — used for the actual data read, safe because
    // we've already confirmed whose data we're reading above.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { messages, mode } = await req.json() as {
      messages: ChatMessage[];
      mode?: "chat" | "auto_analysis";
    };

    const workoutCtx = await buildWorkoutContext(adminClient, userId);

    const systemPrompt =
      mode === "auto_analysis"
        ? `You are a knowledgeable, encouraging strength coach. Below is the user's full workout history with pre-computed stagnation flags. Give a SHORT proactive analysis (3-5 sentences max): call out what's working, name any specific stagnant exercises using their actual numbers, flag any workout where the overall combination may not be working, and suggest one concrete exercise or variation to try if relevant. Be specific and data-driven, not generic.\n\n${workoutCtx}`
        : `You are a knowledgeable, encouraging personal trainer and strength coach. You have full access to the user's workout history below, including pre-computed stagnation flags per exercise and per workout. Give specific, data-driven advice using their actual numbers. When relevant, suggest new exercises, variations, or note if a workout's combination of exercises seems ineffective. Keep responses concise (2-4 short paragraphs max).\n\n${workoutCtx}`;

    const geminiContents = (messages ?? []).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents.length ? geminiContents : [{ role: "user", parts: [{ text: "Give me your analysis." }] }],
          generationConfig: { maxOutputTokens: mode === "auto_analysis" ? 500 : 1000, temperature: 0.7 }
        })
      }
    );
    const geminiData = await geminiRes.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") ??
      "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
});
