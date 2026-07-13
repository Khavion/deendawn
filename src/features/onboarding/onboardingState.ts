import { KVStore } from '../../lib/kvStore';

const KEY = 'onboarded.v1';

export function isOnboarded(store: KVStore): boolean {
  return store.get(KEY) === 'true';
}

export function markOnboarded(store: KVStore): void {
  store.set(KEY, 'true');
}
