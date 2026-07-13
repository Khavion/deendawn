/**
 * Structured local logging — the only error/diagnostic sink in v1.
 * Privacy invariant (CLAUDE.md rule 2): nothing here may ever transmit;
 * logs stay in memory/console and are never persisted off-device.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  ts: string;
  level: Level;
  scope: string;
  msg: string;
  data?: Record<string, unknown>;
}

const MAX_BUFFER = 500;
const buffer: LogEntry[] = [];

function write(level: Level, scope: string, msg: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    scope,
    msg,
    ...(data && { data }),
  };
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();
  if (__DEV__) {
    const line = `[${entry.level}] ${entry.scope}: ${entry.msg}`;
    if (level === 'error') console.error(line, data ?? '');
    else if (level === 'warn') console.warn(line, data ?? '');
    else console.log(line, data ?? '');
  }
}

export const log = {
  debug: (scope: string, msg: string, data?: Record<string, unknown>) =>
    write('debug', scope, msg, data),
  info: (scope: string, msg: string, data?: Record<string, unknown>) =>
    write('info', scope, msg, data),
  warn: (scope: string, msg: string, data?: Record<string, unknown>) =>
    write('warn', scope, msg, data),
  error: (scope: string, msg: string, data?: Record<string, unknown>) =>
    write('error', scope, msg, data),
  /** Recent entries, newest last. For an in-app debug screen; never exported off-device. */
  recent: (): readonly LogEntry[] => buffer,
};
