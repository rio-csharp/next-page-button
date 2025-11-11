import { openTab } from "siyuan";
import { isMobile } from "../utils/platformUtils";
import { errorLog } from "../utils/logger";

declare global {
  interface Window {
    openFileByURL?: (url: string) => void;
  }
}

export interface INavigationService {
  navigateToDocument(docId: string): void;
}

export class NavigationService implements INavigationService {
  constructor(private app: any) {}

  navigateToDocument(docId: string): void {
    if (isMobile()) {
      if (window.openFileByURL) {
        window.openFileByURL(`siyuan://blocks/${docId}`);
      } else {
        errorLog("NavigationService", "window.openFileByURL not available");
      }
    } else {
      openTab({ app: this.app, doc: { id: docId } });
    }
  }
}
