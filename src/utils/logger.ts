import { DEBUG_MODE } from "./constants";

function getTimestamp(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Debug log - only outputs when DEBUG_MODE is true
 */
export function debugLog(tag: string, ...args: any[]): void {
  if (DEBUG_MODE) {
    console.log(`[${getTimestamp()}][DEBUG-${tag}]`, ...args);
  }
}

export function errorLog(tag: string, ...args: any[]): void {
  console.error(`[${getTimestamp()}][${tag}]`, ...args);
}

export function warnLog(tag: string, ...args: any[]): void {
  console.warn(`[${getTimestamp()}][${tag}]`, ...args);
}

export function infoLog(tag: string, ...args: any[]): void {
  console.log(`[${getTimestamp()}][${tag}]`, ...args);
}
