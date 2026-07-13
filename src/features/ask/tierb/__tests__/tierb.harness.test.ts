/**
 * @jest-environment node
 *
 * Tier B eval harness v2 (E9): grounding, refusal, and style suites. ALL
 * must stay green before gate 7 can even be requested. Runs against a mock
 * runtime (Metal is unavailable in simulators/CI); real-inference checks
 * live on the TESTPLAN device pass.
 */
import {
  buildPrompt,
  generateGrounded,
  LlmRuntime,
  parseModelOutput,
  PROMPT_TEMPLATE,
  validateAnswer,
} from '../contract';
import { computeDeviceTier, MIN_MEMORY_BYTES } from '../deviceTier';
import { mergeHybrid } from '../hybrid';
import { TIER_B_ENABLED } from '../flags';
import { AyahRow } from '../../../quran/repo';

const row = (id: number, surah: number, ayah: number): AyahRow => ({
  id,
  surah,
  ayah,
  juz: 1,
  text_uthmani: `arabic-${id}`,
  text_translation: `translation ${id}`,
});
const RETRIEVED = [row(1, 2, 45), row(2, 2, 153), row(3, 3, 200)];

const runtimeReturning = (...outputs: string[]): LlmRuntime => {
  let i = 0;
  return { complete: async () => outputs[Math.min(i++, outputs.length - 1)] };
};

describe('gate 7', () => {
  test('Tier B ships OFF', () => {
    expect(TIER_B_ENABLED).toBe(false);
  });
});

describe('grounding suite', () => {
  test('valid grounded answer passes and maps citations to retrieved rows', async () => {
    const result = await generateGrounded(
      runtimeReturning('{"answer": "Patience is commanded with prayer.", "citations": [1, 2]}'),
      'patience',
      RETRIEVED
    );
    expect(result.kind).toBe('answer');
    if (result.kind === 'answer') {
      expect(result.citations.map((c) => c.id)).toEqual([1, 2]);
    }
  });

  test('empty citations are rejected; retry then Tier A fallback', async () => {
    const result = await generateGrounded(
      runtimeReturning(
        '{"answer": "Something.", "citations": []}',
        '{"answer": "Still nothing.", "citations": []}'
      ),
      'q',
      RETRIEVED
    );
    expect(result).toEqual({ kind: 'fallbackTierA', reason: 'emptyCitations' });
  });

  test('citations outside the retrieved set are foreign and rejected', async () => {
    const result = await generateGrounded(
      runtimeReturning(
        '{"answer": "Claim.", "citations": [7]}',
        '{"answer": "Claim.", "citations": [4]}'
      ),
      'q',
      RETRIEVED
    );
    expect(result).toEqual({ kind: 'fallbackTierA', reason: 'foreignCitation' });
  });

  test('one regeneration is allowed and can succeed', async () => {
    const result = await generateGrounded(
      runtimeReturning('garbage not json', '{"answer": "Grounded now.", "citations": [3]}'),
      'q',
      RETRIEVED
    );
    expect(result.kind).toBe('answer');
  });
});

describe('refusal suite', () => {
  test('empty retrieval NEVER reaches the model', async () => {
    const complete = jest.fn(async () => 'should never be called');
    const result = await generateGrounded({ complete }, 'out of corpus question', []);
    expect(result).toEqual({ kind: 'fallbackTierA', reason: 'emptyRetrieval' });
    expect(complete).not.toHaveBeenCalled();
  });

  test('the fixed INSUFFICIENT token is honored without retry', async () => {
    const complete = jest.fn(async () => 'INSUFFICIENT');
    const result = await generateGrounded({ complete }, 'q', RETRIEVED);
    expect(result).toEqual({ kind: 'fallbackTierA', reason: 'insufficient' });
    expect(complete).toHaveBeenCalledTimes(1);
  });
});

describe('style suite', () => {
  test.each([
    ['blocklist filler', '{"answer": "I\'d be happy to explain patience.", "citations": [1]}'],
    ['closing question', '{"answer": "Patience is praised. Want more?", "citations": [1]}'],
    [
      'over 40 words',
      `{"answer": "${Array.from({ length: 45 }, (_, i) => `word${i}`).join(' ')}", "citations": [1]}`,
    ],
    ['over 2 sentences', '{"answer": "One. Two. Three sentences here.", "citations": [1]}'],
  ])('%s is rejected', async (_name, output) => {
    const result = await generateGrounded(runtimeReturning(output, output), 'q', RETRIEVED);
    expect(result.kind).toBe('fallbackTierA');
  });

  test('terse two-sentence answers pass', () => {
    const v = validateAnswer(
      { answer: 'Patience is commanded. It is paired with prayer.', citations: [1] },
      3
    );
    expect(v.ok).toBe(true);
  });
});

describe('prompt + parsing', () => {
  test('prompt embeds numbered passages and the pinned rules', () => {
    const p = buildPrompt('why patience?', RETRIEVED);
    expect(p).toContain('[1] (2:45) translation 1');
    expect(p).toContain('[3] (3:200) translation 3');
    expect(p).toContain('No outside knowledge');
    expect(PROMPT_TEMPLATE).toContain('INSUFFICIENT');
  });

  test('parser tolerates prose around the JSON blob', () => {
    const v = parseModelOutput('Sure thing {"answer": "A.", "citations": [1]} done');
    expect(v.ok).toBe(true);
  });
});

describe('capability gate', () => {
  const base = {
    totalMemoryBytes: MIN_MEMORY_BYTES,
    isLowRamDevice: false,
    iosModelId: 'iPhone14,2',
    platform: 'ios' as const,
  };
  test('A14+ iPhone with enough memory is rich', () => {
    expect(computeDeviceTier(base)).toBe('rich');
  });
  test('low memory, low-RAM flag, or pre-A14 iPhone stay on the floor', () => {
    expect(computeDeviceTier({ ...base, totalMemoryBytes: MIN_MEMORY_BYTES - 1 })).toBe('floor');
    expect(computeDeviceTier({ ...base, isLowRamDevice: true })).toBe('floor');
    expect(computeDeviceTier({ ...base, iosModelId: 'iPhone12,8' })).toBe('floor');
    expect(computeDeviceTier({ ...base, iosModelId: null })).toBe('floor');
  });
});

describe('hybrid merge', () => {
  test('both-method hits rank first, then vector by score, then fts; deduped and capped', () => {
    const rows = [row(1, 1, 1), row(2, 1, 2), row(3, 1, 3), row(4, 1, 4)];
    const byId = new Map(rows.map((r) => [r.id, r]));
    const merged = mergeHybrid(
      [rows[0], rows[1]],
      [
        { ayahId: 2, score: 0.9 },
        { ayahId: 3, score: 0.8 },
        { ayahId: 4, score: 0.95 },
      ],
      byId,
      10
    );
    expect(merged.map((r) => r.id)).toEqual([2, 4, 3, 1]);
    expect(mergeHybrid([rows[0]], [], byId, 10).map((r) => r.id)).toEqual([1]);
  });
});
