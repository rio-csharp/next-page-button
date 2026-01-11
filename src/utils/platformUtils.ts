/**
 * Platform utilities
 */

// Extend Window interface for mobile properties
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
 * Checks if the current environment is mobile.
 * Mobile versions have a sidebar element, while desktop versions do not.
 * @returns true if mobile (Android, iOS, HarmonyOS), false otherwise
 */
export function isMobile(): boolean {
  // Reference SiYuan source: siyuan/app/src/util/functions.ts
  return !!document.getElementById("sidebar");
}

export function isInAndroid(): boolean {
  return window.siyuan?.config?.system?.container === "android" && !!window.JSAndroid;
}

export function isInIOS(): boolean {
  return window.siyuan?.config?.system?.container === "ios" && !!window.webkit?.messageHandlers;
}

export function isInHarmony(): boolean {
  return window.siyuan?.config?.system?.container === "harmony" && !!window.JSHarmony;
}
