/**
 * Regression tests for the Android wiped-container race found 2026-07-30:
 * expo-file-system's File.copy() is ASYNC in SDK 57, but openLibraryDb fired
 * it without await — openDatabaseSync then created an EMPTY library.db first,
 * queries failed with "prepareSync has been rejected", and the late copy
 * rejected with "Destination already exists".
 */

let mockDestExists = false;
let mockCopyResolve: () => void = () => {};
const mockCopy = jest.fn(
  (_dest: unknown, _opts?: { overwrite?: boolean }) =>
    new Promise<void>((res) => {
      mockCopyResolve = () => {
        mockDestExists = true;
        res();
      };
    })
);
const mockDelete = jest.fn(() => {
  mockDestExists = false;
});
const mockOpenDatabaseSync = jest.fn((_name: string) => ({ __db: true }));

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: () => ({
      downloadAsync: jest.fn().mockResolvedValue(undefined),
      localUri: 'file:///cache/library.db',
    }),
  },
}));

jest.mock('expo-file-system', () => ({
  Paths: { document: 'file:///documents' },
  Directory: jest.fn().mockImplementation(() => ({
    exists: true,
    create: jest.fn(),
  })),
  File: jest.fn().mockImplementation((...args: string[]) => {
    const isDest = args.length === 2;
    return {
      get exists() {
        return isDest ? mockDestExists : true;
      },
      get size() {
        return isDest ? (mockDestExists ? 1234 : 0) : 1234;
      },
      copy: mockCopy,
      delete: mockDelete,
    };
  }),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: (name: string) => mockOpenDatabaseSync(name),
}));

jest.mock('@/assets/db/library.db', () => 1, { virtual: true });

describe('openLibraryDb', () => {
  beforeEach(() => {
    jest.resetModules();
    mockDestExists = false;
    mockCopy.mockClear();
    mockDelete.mockClear();
    mockOpenDatabaseSync.mockClear();
  });

  test('awaits the async copy before opening the database', async () => {
    const { openLibraryDb } = require('../libraryDb');
    const pending = openLibraryDb();
    await Promise.resolve(); // let the async body reach the copy
    await Promise.resolve();
    expect(mockCopy).toHaveBeenCalledTimes(1);
    // The db must NOT open while the copy is still in flight.
    expect(mockOpenDatabaseSync).not.toHaveBeenCalled();
    mockCopyResolve();
    await pending;
    expect(mockOpenDatabaseSync).toHaveBeenCalledWith('library.db');
  });

  test('copies with overwrite (no delete-then-copy window)', async () => {
    const { openLibraryDb } = require('../libraryDb');
    const pending = openLibraryDb();
    await Promise.resolve();
    await Promise.resolve();
    mockCopyResolve();
    await pending;
    expect(mockCopy).toHaveBeenCalledWith(expect.anything(), { overwrite: true });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  test('concurrent callers share one open sequence (single copy, single open)', async () => {
    const { openLibraryDb } = require('../libraryDb');
    const a = openLibraryDb();
    const b = openLibraryDb();
    await Promise.resolve();
    await Promise.resolve();
    mockCopyResolve();
    const [dbA, dbB] = await Promise.all([a, b]);
    expect(dbA).toBe(dbB);
    expect(mockCopy).toHaveBeenCalledTimes(1);
    expect(mockOpenDatabaseSync).toHaveBeenCalledTimes(1);
  });

  test('skips the copy when the destination is already current', async () => {
    mockDestExists = true;
    const { openLibraryDb } = require('../libraryDb');
    await openLibraryDb();
    expect(mockCopy).not.toHaveBeenCalled();
    expect(mockOpenDatabaseSync).toHaveBeenCalledTimes(1);
  });

  test('a failed open sequence is retryable (no poisoned cache)', async () => {
    const { openLibraryDb } = require('../libraryDb');
    mockCopy.mockImplementationOnce(() => Promise.reject(new Error('boom')));
    await expect(openLibraryDb()).rejects.toThrow('boom');
    // Second attempt starts a fresh sequence.
    const pending = openLibraryDb();
    await Promise.resolve();
    await Promise.resolve();
    mockCopyResolve();
    await pending;
    expect(mockOpenDatabaseSync).toHaveBeenCalledTimes(1);
  });
});
