import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://rahulkumardas.in",
  "https://www.rahulkumardas.in",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
]);

const systemInstructions = `
You are an expert accounting tutor for Indian college students.
Solve accounting questions accurately with detailed explanations.
Cover financial accounting, cost accounting, management accounting,
corporate accounting, financial management, taxation and auditing.
For numerical problems, identify the given information and required result,
explain the concept, state formulas and assumptions, show calculations,
present the appropriate journal entries, ledger accounts or statements,
explain adjustments, give the final answer with units and rounding, and
include working notes and common mistakes where useful.
Use Indian rupees and Indian accounting terminology when relevant.
For tax questions, identify the applicable financial year and rules.
Do not invent missing figures or silently assume missing information.
State when information is insufficient. Distinguish assumptions from facts.
If a photograph is unclear, identify the unreadable information.
Do not claim independent verification unless you perform a check.
Return readable Markdown with headings, lists and tables when useful.
`;

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://rahulkumardas.in",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST for accounting questions." }, 405);
  if (!allowedOrigins.has(origin)) return json({ error: "Website origin is not permitted." }, 403);

  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!openAiKey) return json({ error: "AI service is not configured yet. The site administrator must add the AI API secret." }, 503);
  if (!supabaseUrl || !anonKey) return json({ error: "The server is not fully configured." }, 503);

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Please sign in to use the solver." }, 401);

  try {
    const body = await req.json();
    const question = String(body.question ?? "").trim();
    const subject = String(body.subject ?? "General Accounting").slice(0, 100);
    const image = body.image;
    if (!question && !image) return json({ error: "Enter a question or upload a photograph." }, 400);
    if (question.length > 12000) return json({ error: "Your question is too long." }, 413);
    if (image && (
      typeof image !== "string" ||
      !/^data:image\/(jpeg|png|webp);base64,/.test(image) ||
      image.length > 7000000
    )) return json({ error: "Upload a JPG, PNG or WebP image smaller than 5 MB." }, 400);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Your session is invalid. Please sign in again." }, 401);

    const { data: allowed, error: quotaError } = await userClient.rpc("consume_accounting_quota");
    if (quotaError) {
      console.error("Quota check failed:", quotaError.message);
      return json({ error: "Usage limits are temporarily unavailable. Please try again later." }, 503);
    }
    if (allowed !== true) return json({ error: "You have used your 5 free solutions for today. Please return tomorrow." }, 429);

    const content: Array<Record<string, unknown>> = [{
      type: "input_text",
      text: "Accounting subject: " + subject + "\n\nStudent's question:\n" +
        (question || "Read and solve the question in the attached photograph.")
    }];
    if (image) content.push({ type: "input_image", image_url: image, detail: "high" });

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": "Bearer " + openAiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: systemInstructions,
        input: [{ role: "user", content }],
        max_output_tokens: 4000
      }),
      signal: AbortSignal.timeout(90000)
    });
    const result = await aiResponse.json();
    if (!aiResponse.ok) {
      console.error("AI provider returned status:", aiResponse.status);
      return json({ error: "The AI could not solve this question right now. Please try again later." }, 502);
    }
    const answer = String(result.output_text ?? "").trim();
    if (!answer) return json({ error: "No solution was returned. Please try again." }, 502);
    return json({ answer, subject, remainingNote: "Free daily allowance: up to 5 solutions per account." });
  } catch (error) {
    console.error("Accounting solver failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "The request failed. Please try again shortly." }, 500);
  }
});
