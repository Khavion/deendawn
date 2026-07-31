// Preview stub: the DS previews never open a database (the theme provider
// gets an in-memory KV store). Bundling the real expo-sqlite would drag the
// wasm worker into the browser bundle for nothing.
export function openDatabaseSync(): never {
  throw new Error('expo-sqlite is stubbed in design-system previews');
}
