import Anthropic from "@anthropic-ai/sdk";
import { PATIENT } from "../store/inMemoryStore";

const client = new Anthropic({
  apiKey: process.env.AI_PROVIDER_API_KEY,
});

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export function parseSoapJson(raw: string): SoapNote {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const parsed = JSON.parse(text) as SoapNote;
  if (
    typeof parsed.subjective !== "string" ||
    typeof parsed.objective !== "string" ||
    typeof parsed.assessment !== "string" ||
    typeof parsed.plan !== "string"
  ) {
    throw new Error("Invalid SOAP structure");
  }
  return parsed;
}

export async function generateSoapNote(transcript: string): Promise<SoapNote> {
  const message = await client.messages.create({
    model: process.env.AI_MODEL || "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system:
      "You are a clinical documentation assistant. Generate a structured SOAP note from the consultation transcript. Return ONLY a raw JSON object with exactly these four string fields: subjective, objective, assessment, plan. Do not include markdown, backticks, or any text outside the JSON.",
    messages: [
      {
        role: "user",
        content: `Patient: ${PATIENT.name}, ${PATIENT.age}yo ${PATIENT.gender}. ${PATIENT.clinicalDetail}\n\nTranscript:\n${transcript}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text in AI response");
  }
  return parseSoapJson(block.text);
}
