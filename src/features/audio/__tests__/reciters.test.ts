import { readFileSync } from 'node:fs';
import path from 'node:path';

import { DEFAULT_RECITER_ID, RECITERS, reciterName } from '../reciters';

const pipelineSources = JSON.parse(
  readFileSync(
    path.join(__dirname, '../../../../content-pipeline/audio/sources.json'),
    'utf8'
  )
) as { recitations: { id: string; reciterName: string; style: string; default?: boolean }[] };

describe('reciter catalog', () => {
  it('mirrors the audio pipeline sources exactly', () => {
    expect(RECITERS.map((r) => r.id).sort()).toEqual(
      pipelineSources.recitations.map((r) => r.id).sort()
    );
    for (const rec of pipelineSources.recitations) {
      const app = RECITERS.find((r) => r.id === rec.id);
      expect(app?.name).toBe(rec.reciterName);
      expect(app?.style).toBe(rec.style);
    }
  });

  it('default reciter is the pipeline default', () => {
    const def = pipelineSources.recitations.find((r) => r.default);
    expect(def?.id).toBe(DEFAULT_RECITER_ID);
  });

  it('resolves display names', () => {
    expect(reciterName(DEFAULT_RECITER_ID)).toBe('Mishary Rashid Alafasy');
    expect(reciterName('nope')).toBeUndefined();
  });
});
