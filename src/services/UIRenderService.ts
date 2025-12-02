import "../index.scss";
import { debugLog, errorLog } from "../utils/logger";
import { IDocumentService } from "./DocumentService";
import { INavigationService } from "./NavigationService";
import { NavigationContainer } from "./ui/NavigationContainer";
import { NavigationState } from "./ui/NavigationState";
import { NavigationEventHandler } from "./ui/NavigationEventHandler";

export interface IUIRenderService {
  renderNavigationButtons(): Promise<void>;
  cleanup(): void;
  toggleVisibility(show: boolean): void;
}

export class UIRenderService implements IUIRenderService {
  private renderAbortController: AbortController | null = null;
  private container: NavigationContainer;
  private state: NavigationState;
  private eventHandler: NavigationEventHandler;

  constructor(
    private documentService: IDocumentService,
    navigationService: INavigationService,
    private i18n: (key: string) => string
  ) {
    this.container = new NavigationContainer();
    this.state = new NavigationState();
    this.eventHandler = new NavigationEventHandler(documentService, navigationService);
  }

  async renderNavigationButtons(): Promise<void> {
    const renderStartTime = Date.now();
    debugLog("UIRender", "=== Render Start ===");
    
    // 取消之前的渲染操作
    if (this.renderAbortController) {
      this.renderAbortController.abort();
      debugLog("UIRender", "Previous render aborted");
    }

    // 创建新的 AbortController
    this.renderAbortController = new AbortController();
    const signal = this.renderAbortController.signal;

    try {
      const docId = this.documentService.getCurrentDocumentId();
      debugLog("UIRender", "Current doc ID:", docId);
      if (!docId) {
        debugLog("UIRender", "No doc ID, cleanup");
        this.cleanup();
        return;
      }

      // 检查是否已取消
      if (signal.aborted) {
        debugLog("UIRender", "Render cancelled");
        return;
      }

      const protyleElement = this.getActiveProtyleElement();
      if (!protyleElement) {
        debugLog("UIRender", "No protyle element found");
        this.cleanup();
        return;
      }

      const notebookId = await this.documentService.getNotebookIdByDocId(docId);
      
      // 检查是否已取消
      if (signal.aborted) {
        debugLog("UIRender", "Render cancelled after getNotebookId");
        return;
      }
      
      if (!notebookId) {
        debugLog("UIRender", "No notebook ID found");
        this.cleanup();
        return;
      }

      const currentPosition = await this.documentService.getCurrentDocumentPosition(docId);
      const totalCount = await this.documentService.getNotebookDocumentCount(notebookId);
      
      // 检查是否已取消
      if (signal.aborted) {
        debugLog("UIRender", "Render cancelled after getPosition");
        return;
      }
      
      const renderTime = Date.now() - renderStartTime;
      debugLog("UIRender", `Position: ${currentPosition}/${totalCount} (took ${renderTime}ms)`);
      
      if (currentPosition === 0 || totalCount === 0) {
        debugLog("UIRender", "Invalid position/count, cleanup");
        this.cleanup();
        return;
      }

      // 检查容器是否需要重建
      if (this.container.needsRecreate(protyleElement)) {
        this.container.create(
          protyleElement,
          this.i18n,
          this.eventHandler.createPrevHandler(),
          this.eventHandler.createNextHandler()
        );
        debugLog("UIRender", "Container recreated");
      }

      // 更新状态
      const elements = this.container.getElements();
      if (elements) {
        this.state.update(elements, { currentPosition, totalCount });
      }
      
      debugLog("UIRender", `=== Render Complete (${Date.now() - renderStartTime}ms) ===`);
    } catch (err) {
      // 忽略 AbortError
      if (err instanceof Error && err.name === 'AbortError') {
        debugLog("UIRender", "Render aborted");
        return;
      }
      errorLog("UIRenderService", "Render failed:", err);
      this.cleanup();
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 取消正在进行的渲染
    if (this.renderAbortController) {
      this.renderAbortController.abort();
      this.renderAbortController = null;
    }

    // 清理容器
    this.container.destroy();
  }

  /**
   * 显示/隐藏
   */
  toggleVisibility(show: boolean): void {
    this.container.setVisibility(show);
  }

  /**
   * 获取当前激活的 protyle 元素
   */
  private getActiveProtyleElement(): HTMLElement | null {
    const protyleTitle = document.querySelector(".protyle:not(.fn__none) .protyle-title");
    const protyleContent = document.querySelector(".protyle:not(.fn__none) .protyle-content");
    return (protyleTitle || protyleContent)?.closest(".protyle") as HTMLElement | null;
  }
}
