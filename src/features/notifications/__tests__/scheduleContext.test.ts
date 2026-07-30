/**
 * @jest-environment node
 */
import { createMemoryKVStore } from '../../../lib/kvStore';
import {
  contextChanged,
  currentScheduleContext,
  loadScheduleContext,
  saveScheduleContext,
} from '../scheduleContext';

describe('scheduleContext', () => {
  test('current context reports the host IANA zone', () => {
    expect(currentScheduleContext().timeZone).toBe(
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  });

  test('first observation (nothing stored) does not force', () => {
    expect(contextChanged(null, { timeZone: 'America/Chicago' })).toBe(false);
  });

  test('same zone -> unchanged; zone change -> changed', () => {
    expect(
      contextChanged({ timeZone: 'America/Chicago' }, { timeZone: 'America/Chicago' })
    ).toBe(false);
    expect(contextChanged({ timeZone: 'America/Chicago' }, { timeZone: 'Asia/Karachi' })).toBe(
      true
    );
  });

  test('round-trips through the KV store; corrupt payloads read as null', () => {
    const store = createMemoryKVStore();
    expect(loadScheduleContext(store)).toBeNull();
    saveScheduleContext(store, { timeZone: 'Europe/London' });
    expect(loadScheduleContext(store)).toEqual({ timeZone: 'Europe/London' });
    store.set('notifications.scheduleContext.v1', '{broken');
    expect(loadScheduleContext(store)).toBeNull();
    store.set('notifications.scheduleContext.v1', '{"timeZone":42}');
    expect(loadScheduleContext(store)).toBeNull();
  });
});
