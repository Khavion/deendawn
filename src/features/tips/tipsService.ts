/**
 * Tip jar backend (constitution rule 3): the ONLY revenue surface, framed
 * strictly as supporting development — never charity, zakat, or sadaqah
 * (Apple guideline 3.2.1). A copy-audit test enforces the framing.
 *
 * RevenueCat is behind this interface so the whole feature works and tests
 * without the API key (BLOCKERS item 1). No key → honest unavailable state.
 */
import { Platform } from 'react-native';

import type { KVStore } from '@/src/lib/kvStore';

export interface TipOption {
  /** RevenueCat package identifier. */
  id: string;
  /** Localized price string straight from StoreKit, e.g. "$4.99". */
  priceLabel: string;
}

export interface TipsBackend {
  /** Fetch the available one-time tip products, cheapest first. */
  loadOptions(): Promise<TipOption[]>;
  /** Returns true when the purchase completed (false = user cancelled). */
  purchase(optionId: string): Promise<boolean>;
  restore(): Promise<boolean>;
}

export function getRevenueCatKey(): string | null {
  const key = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim();
  return key ? key : null;
}

export function isTipsConfigured(): boolean {
  return Platform.OS === 'ios' && getRevenueCatKey() !== null;
}

const THANKED_KEY = 'tips.thanked.v1';

export function hasTipped(store: KVStore): boolean {
  return store.get(THANKED_KEY) === 'true';
}

export function markTipped(store: KVStore): void {
  store.set(THANKED_KEY, 'true');
}

let configured = false;

/** Real backend; only constructed when a key exists. Lazy-requires the native
 * module so importing this file never touches native code (tests stay pure). */
export function createRevenueCatBackend(apiKey: string): TipsBackend {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Purchases = (require('react-native-purchases') as typeof import('react-native-purchases'))
    .default;
  const ensureConfigured = () => {
    if (!configured) {
      Purchases.configure({ apiKey });
      configured = true;
    }
  };
  return {
    async loadOptions() {
      ensureConfigured();
      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages ?? [];
      return packages
        .map((p) => ({
          id: p.identifier,
          priceLabel: p.product.priceString,
          price: p.product.price,
        }))
        .sort((a, b) => a.price - b.price)
        .map(({ id, priceLabel }) => ({ id, priceLabel }));
    },
    async purchase(optionId: string) {
      ensureConfigured();
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find((p) => p.identifier === optionId);
      if (!pkg) return false;
      try {
        await Purchases.purchasePackage(pkg);
        return true;
      } catch (e) {
        if ((e as { userCancelled?: boolean }).userCancelled) return false;
        throw e;
      }
    },
    async restore() {
      ensureConfigured();
      const info = await Purchases.restorePurchases();
      return Object.keys(info.allPurchaseDates ?? {}).length > 0;
    },
  };
}

export function getTipsBackend(): TipsBackend | null {
  const key = getRevenueCatKey();
  if (!key || Platform.OS !== 'ios') return null;
  return createRevenueCatBackend(key);
}
