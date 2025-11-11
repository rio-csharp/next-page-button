import { KEYBOARD_THRESHOLD } from "../utils/constants";
import { getViewportHeight, isKeyboardVisible } from "../utils/platformUtils";

export interface IKeyboardDetectionService {
  /**
   * 启动键盘状态检测
   * @param onKeyboardStateChange 键盘状态变化回调，参数为键盘是否可见
   * @warning 必须在组件卸载时调用 stop()，否则会导致内存泄漏
   */
  start(onKeyboardStateChange: (keyboardVisible: boolean) => void): void;
  
  /**
   * 停止检测并清理资源
   */
  stop(): void;
}

export class KeyboardDetectionService implements IKeyboardDetectionService {
  private initialHeight = 0;
  private callback?: (keyboardVisible: boolean) => void;
  private abortController: AbortController | null = null;

  start(onKeyboardStateChange: (keyboardVisible: boolean) => void): void {
    this.stop(); // 防止重复启动

    this.callback = onKeyboardStateChange;
    this.initialHeight = getViewportHeight();
    this.abortController = new AbortController();

    // 监听视口变化检测键盘状态
    const resizeHandler = () => {
      if (!this.callback) return;
      const keyboardVisible = isKeyboardVisible(this.initialHeight, KEYBOARD_THRESHOLD);
      this.callback(keyboardVisible);
    };
    
    const viewportTarget = window.visualViewport || window;
    viewportTarget.addEventListener("resize", resizeHandler, {
      signal: this.abortController.signal
    });
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    this.callback = undefined;
  }
}
