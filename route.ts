import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  business: z.any().optional(),
  location: z.string().trim().min(1).max(160).default("Dar es Salaam"),
  offer: z.string().trim().min(1).max(1000),
  category: z.string().max(160).optional()
});

function fallbackKeywords(offer: string, location: string, category = "service") {
  const clean = offer.split(",").map(x => x.trim()).filter(Boolean).slice(0, 4);
  const terms = clean.length ? clean : [category];
  return Array.from(new Set(terms.flatMap(t => [
    `${t} ${location}`, `best ${t} near me`, `affordable ${t} ${location}`,
    `${t} price ${location}`, `${t} services ${location}`
  ]))).slice(0, 16);
}

export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json());
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({
      keywords: fallbackKeywords(input.offer, input.location, input.category),
      mode: "fallback"
    });
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: "Generate search keyword IDEAS for a Tanzania-local business. Return JSON only as {\"keywords\":[string]}. These are hypotheses, not claims about real individuals' searches. No personal data. Max 16 keywords. Include local intent and price/near-me variants where natural." },
          { role: "user", content: JSON.stringify({ offer: input.offer, category: input.category, location: input.location }) }
        ],
        response_format: { type: "json_object" }
      }),
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error("AI provider returned an error.");
    const json = await response.json();
    const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}");
    const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.filter((x: unknown) => typeof x === "string").slice(0, 16) : [];
    return NextResponse.json({ keywords: keywords.length ? keywords : fallbackKeywords(input.offer, input.location, input.category), mode: "ai" });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Please provide an offer and a valid location." : "Unable to generate keyword ideas right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
