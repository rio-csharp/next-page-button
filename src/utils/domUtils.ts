export class DomUtils {
  /**
   * Get the current active protyle element.
   * Logic derived from SiYuan's active editor detection.
   */
  static getActiveProtyleElement(): HTMLElement | null {
    // 1. Try to find protyle containing the current selection
    const range = window.getSelection()?.rangeCount > 0 ? window.getSelection().getRangeAt(0) : null;
    let protyle: HTMLElement | null = null;
    
    if (range) {
      protyle = range.startContainer.parentElement?.closest('.protyle:not(.fn__none)') as HTMLElement;
    }
    
    // 2. Fallback: active window protyle
    if (!protyle) {
      protyle = document.querySelector('.layout__wnd--active .protyle:not(.fn__none)') as HTMLElement;
    }
    
    // 3. Fallback: any visible protyle
    if (!protyle) {
      protyle = document.querySelector('.protyle:not(.fn__none)') as HTMLElement;
    }

    return protyle;
  }

  /**
   * Extract document ID (rootID) from a protyle element.
   */
  static getDocIdFromProtyle(protyle: HTMLElement): string | null {
    const titleElement = protyle.querySelector('.protyle-title[data-node-id]');
    const wysiwygElement = protyle.querySelector('.protyle-wysiwyg[data-node-id]');
    
    return titleElement?.getAttribute('data-node-id') || 
           wysiwygElement?.getAttribute('data-node-id') || 
           null;
  }
}
