import { KEYBOARD_THRESHOLD } from "../utils/constants";

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
  private screenHeight = 0;
  private callback?: (keyboardVisible: boolean) => void;
  private abortController: AbortController | null = null;
  private lastKeyboardState = false;

  start(onKeyboardStateChange: (keyboardVisible: boolean) => void): void {
    this.stop(); // 防止重复启动

    this.callback = onKeyboardStateChange;
    // 使用 screen.height 作为基准，更稳定
    this.screenHeight = window.screen.height;
    this.abortController = new AbortController();
    this.lastKeyboardState = false;

    // 键盘状态检测函数
    const checkKeyboardState = () => {
      if (!this.callback) return;
      
      // 参考 SiYuan 源码的检测方式：window.screen.height - window.innerHeight
      // 小于阈值说明键盘未弹起，大于阈值说明键盘弹起
      const heightDiff = this.screenHeight - window.innerHeight;
      const keyboardVisible = heightDiff > KEYBOARD_THRESHOLD;
      
      // 只在状态变化时触发回调，避免频繁调用
      if (keyboardVisible !== this.lastKeyboardState) {
        this.lastKeyboardState = keyboardVisible;
        this.callback(keyboardVisible);
      }
    };

    // 立即检测一次初始状态
    checkKeyboardState();

    // 监听 visualViewport 的 resize 事件（主要用于 iOS）
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", checkKeyboardState, {
        signal: this.abortController.signal
      });
      
      // 某些情况下 scroll 事件也能检测到键盘变化（iOS 特有）
      window.visualViewport.addEventListener("scroll", checkKeyboardState, {
        signal: this.abortController.signal
      });
    }
    
    // 监听 window 的 resize 事件（主要用于 Android 和其他平台）
    window.addEventListener("resize", checkKeyboardState, {
      signal: this.abortController.signal
    });
    
    // 监听 focusin/focusout 事件作为辅助检测
    // 某些情况下键盘弹起不会立即触发 resize
    window.addEventListener("focusin", () => {
      // 延迟检测，等待键盘动画完成
      setTimeout(checkKeyboardState, 300);
    }, {
      signal: this.abortController.signal
    });
    
    window.addEventListener("focusout", () => {
      setTimeout(checkKeyboardState, 300);
    }, {
      signal: this.abortController.signal
    });
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    this.callback = undefined;
    this.lastKeyboardState = false;
  }
}
