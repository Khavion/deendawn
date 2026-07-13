import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { AppSettings, loadSettings, saveSettings } from './settingsStore';
import { getUserKVStore, KVStore } from '../../lib/kvStore';

interface SettingsContextValue {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
  /** The user-data KV store, for feature-owned keys (notification prefs etc.). */
  store: KVStore;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
  children,
  store,
}: {
  children: React.ReactNode;
  /** Tests inject a memory store; the app uses the sqlite user db. */
  store?: KVStore;
}) {
  const kv = useMemo(() => store ?? getUserKVStore(), [store]);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings(kv));

  const update = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        saveSettings(kv, next);
        return next;
      });
    },
    [kv]
  );

  const value = useMemo(() => ({ settings, update, store: kv }), [settings, update, kv]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
