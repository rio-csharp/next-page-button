/**
 * 平台相关工具函数
 */

/**
 * 检测是否为移动端环境（支持 Android 和 iOS）
 */
export function isMobile(): boolean {
  const container = window.siyuan?.config?.system?.container;
  return (
    !!document.getElementById("sidebar") &&
    (container === "android" || container === "ios")
  );
}

/**
 * 获取视口高度
 */
export function getViewportHeight(): number {
  return window.visualViewport?.height || window.innerHeight;
}

/**
 * 检测键盘是否可见
 */
export function isKeyboardVisible(initialHeight: number, threshold: number = 150): boolean {
  const currentHeight = getViewportHeight();
  const heightDiff = initialHeight - currentHeight;
  return heightDiff > threshold;
}
