import { AyahRow } from '../../quran/repo';

/**
 * Tier B generation contract (CLAUDE.md Rule 1.5). The model may ONLY
 * paraphrase/summarize passages retrieved for the current query, with
 * citations. Everything here is enforced in code and gated by the harness —
 * a violating response is never shown; the caller falls back to Tier A.
 */

/** Pinned prompt template. Changing it requires regenerating harness runs. */
export const PROMPT_TEMPLATE = `You summarize retrieved Quran passages. Rules:
- Use ONLY the passages below. No outside knowledge.
- Maximum 2 sentences, maximum 40 words.
- Cite every claim with the bracketed numbers of the passages you used.
- If the passages do not answer the question, reply exactly: INSUFFICIENT
- Never give religious rulings or opinions.
Respond as JSON: {"answer": "...", "citations": [1, 2]}

Passages:
{{PASSAGES}}

Question: {{QUESTION}}`;

export function buildPrompt(question: string, retrieved: AyahRow[]): string {
  const passages = retrieved
    .map((r, i) => `[${i + 1}] (${r.surah}:${r.ayah}) ${r.text_translation}`)
    .join('\n');
  return PROMPT_TEMPLATE.replace('{{PASSAGES}}', passages).replace('{{QUESTION}}', question);
}

/** Filler the product bans (Rule 1.5d). Presence fails the response. */
export const STYLE_BLOCKLIST = [
  /i'?d be happy to/i,
  /if you (want|would like|need)/i,
  /\bcertainly\b/i,
  /feel free to/i,
  /let me know\b/i,
  /is there anything else/i,
  /\bgreat question\b/i,
  /\bas an ai\b/i,
  /\?\s*$/, // closing questions
];

export const MAX_WORDS = 40;
export const MAX_SENTENCES = 2;

export interface TierBAnswer {
  answer: string;
  /** 1-based indexes into the retrieved passage list. */
  citations: number[];
}

export type ContractViolation =
  'notJson' | 'insufficient' | 'emptyCitations' | 'foreignCitation' | 'tooLong' | 'blocklist';

export type ContractVerdict =
  { ok: true; value: TierBAnswer } | { ok: false; violation: ContractViolation };

export function parseModelOutput(raw: string): ContractVerdict {
  const trimmed = raw.trim();
  if (/^INSUFFICIENT\b/.test(trimmed)) return { ok: false, violation: 'insufficient' };
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { ok: false, violation: 'notJson' };
  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    const o = parsed as { answer?: unknown; citations?: unknown };
    if (typeof o.answer !== 'string' || !Array.isArray(o.citations)) {
      return { ok: false, violation: 'notJson' };
    }
    const citations = o.citations.filter((c): c is number => Number.isInteger(c) && c >= 1);
    return { ok: true, value: { answer: o.answer.trim(), citations } };
  } catch {
    return { ok: false, violation: 'notJson' };
  }
}

/** Full Rule 1.5 validation of a parsed answer against the retrieved set. */
export function validateAnswer(value: TierBAnswer, retrievedCount: number): ContractVerdict {
  if (value.citations.length === 0) return { ok: false, violation: 'emptyCitations' };
  if (value.citations.some((c) => c > retrievedCount)) {
    return { ok: false, violation: 'foreignCitation' };
  }
  const words = value.answer.split(/\s+/).filter(Boolean);
  const sentences = value.answer.split(/[.!؟?]+/).filter((s) => s.trim().length > 0);
  if (words.length > MAX_WORDS || sentences.length > MAX_SENTENCES) {
    return { ok: false, violation: 'tooLong' };
  }
  if (STYLE_BLOCKLIST.some((re) => re.test(value.answer))) {
    return { ok: false, violation: 'blocklist' };
  }
  return { ok: true, value };
}

export interface LlmRuntime {
  /** Runs inference on the pinned prompt; returns raw model text. */
  complete(prompt: string): Promise<string>;
}

export type TierBResult =
  | { kind: 'answer'; answer: string; citations: AyahRow[] }
  | { kind: 'fallbackTierA'; reason: ContractViolation | 'emptyRetrieval' };

/**
 * The enforced generation pipeline: empty retrieval never reaches the model;
 * one regeneration is allowed after a violation; anything else falls back to
 * Tier A for this query.
 */
export async function generateGrounded(
  runtime: LlmRuntime,
  question: string,
  retrieved: AyahRow[]
): Promise<TierBResult> {
  if (retrieved.length === 0) return { kind: 'fallbackTierA', reason: 'emptyRetrieval' };
  const prompt = buildPrompt(question, retrieved);

  let lastViolation: ContractViolation = 'notJson';
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await runtime.complete(prompt);
    const parsed = parseModelOutput(raw);
    if (!parsed.ok) {
      lastViolation = parsed.violation;
      if (parsed.violation === 'insufficient') break; // honest refusal — no retry
      continue;
    }
    const validated = validateAnswer(parsed.value, retrieved.length);
    if (!validated.ok) {
      lastViolation = validated.violation;
      continue;
    }
    return {
      kind: 'answer',
      answer: validated.value.answer,
      citations: validated.value.citations.map((c) => retrieved[c - 1]),
    };
  }
  return { kind: 'fallbackTierA', reason: lastViolation };
}
