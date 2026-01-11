import { KEYBOARD_THRESHOLD } from "../utils/constants";

export interface IKeyboardDetectionService {
  /**
   * Start keyboard state detection.
   * @param onKeyboardStateChange Callback triggered when keyboard visibility changes.
   */
  start(onKeyboardStateChange: (keyboardVisible: boolean) => void): void;
  
  stop(): void;
}

export class KeyboardDetectionService implements IKeyboardDetectionService {
  private screenHeight = 0;
  private callback?: (keyboardVisible: boolean) => void;
  private abortController: AbortController | null = null;
  private lastKeyboardState = false;

  start(onKeyboardStateChange: (keyboardVisible: boolean) => void): void {
    this.stop(); 

    this.callback = onKeyboardStateChange;
    this.screenHeight = window.screen.height;
    this.abortController = new AbortController();
    this.lastKeyboardState = false;

    const checkKeyboardState = () => {
      if (!this.callback) return;
      
      // Detection logic: keyboard is likely visible if there's a significant 
      // difference between screen height and viewport inner height.
      const heightDiff = this.screenHeight - window.innerHeight;
      const keyboardVisible = heightDiff > KEYBOARD_THRESHOLD;
      
      if (keyboardVisible !== this.lastKeyboardState) {
        this.lastKeyboardState = keyboardVisible;
        this.callback(keyboardVisible);
      }
    };

    checkKeyboardState();

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", checkKeyboardState, {
        signal: this.abortController.signal
      });
      
      // Scroll events can also indicate keyboard changes on iOS
      window.visualViewport.addEventListener("scroll", checkKeyboardState, {
        signal: this.abortController.signal
      });
    }
    
    window.addEventListener("resize", checkKeyboardState, {
      signal: this.abortController.signal
    });
    
    // Focus events as fallback aids for detection
    window.addEventListener("focusin", () => {
      // Delay check to wait for keyboard animation
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
