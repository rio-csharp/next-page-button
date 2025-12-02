import { openTab } from "siyuan";
import { isMobile } from "../utils/platformUtils";
import { errorLog, warnLog } from "../utils/logger";

declare global {
  interface Window {
    openFileByURL?: (url: string) => boolean;
  }
}

export interface INavigationService {
  navigateToDocument(docId: string): void;
}

export class NavigationService implements INavigationService {
  constructor(private app: any) {}

  navigateToDocument(docId: string): void {
    if (isMobile()) {
      // 移动端使用 window.openFileByURL
      // 参考：siyuan/app/src/mobile/index.ts
      if (typeof window.openFileByURL === "function") {
        const url = `siyuan://blocks/${docId}`;
        const success = window.openFileByURL(url);
        if (!success) {
          warnLog("NavigationService", `Failed to open document: ${docId}`);
        }
      } else {
        // 浏览器环境或 openFileByURL 未初始化
        errorLog("NavigationService", "window.openFileByURL not available in this environment");
      }
    } else {
      // 桌面端使用 openTab
      openTab({ app: this.app, doc: { id: docId } });
    }
  }
}
