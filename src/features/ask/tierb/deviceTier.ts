/**
 * Tier B capability gate (PHASE_2 §2): the floor gets full functionality of
 * everything EXCEPT local inference. Computed once from device facts.
 */
export interface DeviceFacts {
  totalMemoryBytes: number;
  isLowRamDevice: boolean;
  /** e.g. "iPhone13,2" (A14) — null on non-iOS or unknown. */
  iosModelId: string | null;
  platform: 'ios' | 'android' | 'other';
}

export const MIN_MEMORY_BYTES = 3.5 * 1024 * 1024 * 1024;
/** iPhone13,x = iPhone 12 family = A14, the directive's minimum class. */
export const MIN_IPHONE_MAJOR = 13;

export type DeviceTier = 'floor' | 'rich';

export function computeDeviceTier(facts: DeviceFacts): DeviceTier {
  if (facts.isLowRamDevice) return 'floor';
  if (facts.totalMemoryBytes < MIN_MEMORY_BYTES) return 'floor';
  if (facts.platform === 'ios') {
    const m = facts.iosModelId?.match(/^iPhone(\d+),/);
    if (!m || Number(m[1]) < MIN_IPHONE_MAJOR) return 'floor';
  }
  return 'rich';
}
