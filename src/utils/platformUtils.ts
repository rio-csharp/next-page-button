/**
 * 平台相关工具函数
 */

// 扩展 Window 接口，添加移动端特有属性
declare global {
  interface Window {
    JSAndroid?: any;
    JSHarmony?: any;
    webkit?: {
      messageHandlers?: any;
    };
  }
}

/**
 * 检测是否为移动端环境
 * 移动端版本有 sidebar 元素，桌面端没有
 * @returns true 表示移动端（Android、iOS、HarmonyOS），false 表示桌面端或浏览器
 */
export function isMobile(): boolean {
  // 参考 SiYuan 源码：siyuan/app/src/util/functions.ts
  // 移动端版本存在 sidebar 元素，桌面端不存在
  return !!document.getElementById("sidebar");
}

/**
 * 检测是否为特定移动操作系统
 */
export function isInAndroid(): boolean {
  return window.siyuan?.config?.system?.container === "android" && !!window.JSAndroid;
}

export function isInIOS(): boolean {
  return window.siyuan?.config?.system?.container === "ios" && !!window.webkit?.messageHandlers;
}

export function isInHarmony(): boolean {
  return window.siyuan?.config?.system?.container === "harmony" && !!window.JSHarmony;
}
