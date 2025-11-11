/**
 * 日志工具
 */
import { DEBUG_MODE } from "./constants";

/**
 * 格式化时间戳
 */
function getTimestamp(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * 调试日志 - 仅在 DEBUG_MODE 为 true 时输出
 */
export function debugLog(tag: string, ...args: any[]): void {
  if (DEBUG_MODE) {
    console.log(`[${getTimestamp()}][DEBUG-${tag}]`, ...args);
  }
}

/**
 * 错误日志 - 始终输出
 */
export function errorLog(tag: string, ...args: any[]): void {
  console.error(`[${getTimestamp()}][${tag}]`, ...args);
}

/**
 * 信息日志 - 始终输出
 */
export function infoLog(tag: string, ...args: any[]): void {
  console.log(`[${getTimestamp()}][${tag}]`, ...args);
}
