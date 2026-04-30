import { openTab } from "siyuan";
import type { App, Tab } from "siyuan";
import { isMobile } from "../utils/platformUtils";
import { errorLog, warnLog } from "../utils/logger";
import type { INavigationService, NavigateOptions } from "./INavigationService";

declare global {
  interface Window {
    openFileByURL?: (url: string) => boolean;
  }
}

export class NavigationService implements INavigationService {
  constructor(private app: App) {}

  async navigateToDocument(docId: string, options: NavigateOptions = {}): Promise<void> {
    if (isMobile()) {
      // Mobile: use window.openFileByURL (Ref: siyuan/app/src/mobile/index.ts)
      if (typeof window.openFileByURL === "function") {
        const url = `siyuan://blocks/${docId}`;
        const success = window.openFileByURL(url);
        if (!success) {
          warnLog("NavigationService", `Failed to open document: ${docId}`);
        }
      } else {
        errorLog("NavigationService", "window.openFileByURL not available in this environment");
      }
    } else {
      // Desktop: use openTab
      const openedTab = await openTab({
        app: this.app,
        doc: { id: docId },
        removeCurrentTab: options.closeCurrentTab && !options.sourceTab
      });

      if (options.closeCurrentTab) {
        this.closeSourceTab(options.sourceTab, openedTab);
      }
    }
  }

  private closeSourceTab(sourceTab?: Tab | null, openedTab?: Tab): void {
    if (!sourceTab || sourceTab.id === openedTab?.id) {
      return;
    }

    sourceTab.parent?.removeTab(sourceTab.id, false, false);
  }
}
