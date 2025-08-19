// /lib/log.ts
export type Log = string[];

export function createLog(initialMessage?: string): Log {
  return initialMessage ? [initialMessage] : [];
}
export function pushLog(log: Log, msg: string) { log.push(msg); }
export function clearLog(log: Log) { log.length = 0; }
export function lastLog(log: Log) { return log.at(-1); }
