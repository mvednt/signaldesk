// Gemini Flash client (the ONLY runtime AI). Structured JSON output via
// responseSchema; thinkingBudget:0 (validated — 3.8-flash is a thinking model
// and otherwise spends the whole token budget on hidden reasoning).
import { requireServerEnv } from "@/lib/env";

export interface GeminiJsonSchema {
  type: "OBJECT";
  properties: Record<string, unknown>;
  required: string[];
  propertyOrdering?: string[];
}

export async function callGeminiJSON(prompt: string, schema: GeminiJsonSchema): Promise<unknown> {
  const { geminiApiKey, geminiModel } = requireServerEnv();
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2,
      maxOutputTokens: 1200,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

  let lastErr = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
      };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error(`Gemini returned empty text (finishReason=${json.candidates?.[0]?.finishReason})`);
      return JSON.parse(text);
    }
    lastErr = `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`;
    if (res.status < 500 && res.status !== 429) break; // don't retry 4xx (except rate limit)
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  throw new Error(`Gemini call failed: ${lastErr}`);
}

export const GEMINI_MODEL = () => requireServerEnv().geminiModel;
