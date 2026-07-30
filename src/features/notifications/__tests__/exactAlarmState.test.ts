/**
 * @jest-environment node
 */
import { createMemoryKVStore } from '../../../lib/kvStore';
import {
  evaluateExactAlarm,
  grantTransition,
  loadStoredGrant,
  recordGrant,
} from '../exactAlarmState';

describe('evaluateExactAlarm', () => {
  test('ios: not applicable, treated as granted', () => {
    expect(evaluateExactAlarm('ios', null, null)).toEqual({ applicable: false, granted: true });
  });

  test('android below 31 (no special access exists): not applicable, granted', () => {
    expect(evaluateExactAlarm('android', 30, null)).toEqual({
      applicable: false,
      granted: true,
    });
  });

  test('android 31+: applicable, granted follows the native answer', () => {
    expect(evaluateExactAlarm('android', 34, true)).toEqual({ applicable: true, granted: true });
    expect(evaluateExactAlarm('android', 34, false)).toEqual({
      applicable: true,
      granted: false,
    });
    // Unknown native state (module missing) reads as not granted.
    expect(evaluateExactAlarm('android', 34, null)).toEqual({
      applicable: true,
      granted: false,
    });
  });
});

describe('grant state machine', () => {
  test('first observation records without a transition', () => {
    const store = createMemoryKVStore();
    expect(loadStoredGrant(store)).toBeNull();
    expect(grantTransition(null, false)).toBe(false);
    expect(grantTransition(null, true)).toBe(false);
    recordGrant(store, false);
    expect(loadStoredGrant(store)).toBe(false);
  });

  test('denied -> granted transition forces; steady state never forces', () => {
    expect(grantTransition(false, true)).toBe(true);
    expect(grantTransition(true, true)).toBe(false);
    expect(grantTransition(false, false)).toBe(false);
  });

  test('granted -> denied (revoke) transition forces', () => {
    expect(grantTransition(true, false)).toBe(true);
  });

  test('round-trips through the KV store', () => {
    const store = createMemoryKVStore();
    recordGrant(store, true);
    expect(loadStoredGrant(store)).toBe(true);
    recordGrant(store, false);
    expect(loadStoredGrant(store)).toBe(false);
    store.set('notifications.exactAlarmGranted.v1', 'garbage');
    expect(loadStoredGrant(store)).toBeNull();
  });
});
