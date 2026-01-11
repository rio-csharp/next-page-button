import { openTab } from "siyuan";
import { isMobile } from "../utils/platformUtils";
import { errorLog, warnLog } from "../utils/logger";
import { INavigationService } from "./INavigationService";

declare global {
  interface Window {
    openFileByURL?: (url: string) => boolean;
  }
}

export class NavigationService implements INavigationService {
  constructor(private app: any) {}

  navigateToDocument(docId: string): void {
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
      openTab({ app: this.app, doc: { id: docId } });
    }
  }
}
