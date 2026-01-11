import Navigation from "./Navigation.svelte";
import { debugLog, errorLog } from "../../utils/logger";
import { IDocumentService } from "../DocumentService";
import { INavigationService } from "../NavigationService";
import { NavigationEventHandler } from "./NavigationEventHandler";
import { IPluginSettings } from "../../utils/constants";

export interface IUIRenderService {
  renderNavigationButtons(): Promise<void>;
  cleanup(): void;
  toggleVisibility(show: boolean): void;
}

export class UIRenderService implements IUIRenderService {
  private renderAbortController: AbortController | null = null;
  private svelteComponent: Navigation | null = null;
  private eventHandler: NavigationEventHandler;
  private currentProtyleElement: HTMLElement | null = null;

  constructor(
    private documentService: IDocumentService,
    navigationService: INavigationService,
    private i18n: (key: string) => string,
    private getSettings: () => IPluginSettings
  ) {
    this.eventHandler = new NavigationEventHandler(documentService, navigationService);
  }

  async renderNavigationButtons(): Promise<void> {
    const renderStartTime = Date.now();
    debugLog("UIRender", "=== Render Start ===");
    
    if (this.renderAbortController) {
      this.renderAbortController.abort();
    }

    this.renderAbortController = new AbortController();
    const signal = this.renderAbortController.signal;

    try {
      const docId = this.documentService.getCurrentDocumentId();
      if (!docId) {
        this.cleanup();
        return;
      }

      if (signal.aborted) return;

      const protyleElement = this.getActiveProtyleElement();
      if (!protyleElement) {
        this.cleanup();
        return;
      }

      const notebookId = await this.documentService.getNotebookIdByDocId(docId);
      if (signal.aborted || !notebookId) {
        if (!notebookId) this.cleanup();
        return;
      }

      const currentPosition = await this.documentService.getCurrentDocumentPosition(docId);
      const totalCount = await this.documentService.getNotebookDocumentCount(notebookId);
      
      if (signal.aborted) return;
      
      if (currentPosition === 0 || totalCount === 0) {
        this.cleanup();
        return;
      }

      // 如果 Protyle 元素变了，或者组件还没创建，则重新创建
      if (this.currentProtyleElement !== protyleElement || !this.svelteComponent) {
        this.cleanup();
        this.currentProtyleElement = protyleElement;
        this.svelteComponent = new Navigation({
          target: protyleElement,
          props: {
            currentPosition,
            totalCount,
            i18n: this.i18n,
            onPrev: () => this.eventHandler.handleNavigate(-1),
            onNext: () => this.eventHandler.handleNavigate(1)
          }
        });
        debugLog("UIRender", "Svelte component mounted");
      } else {
        // 否则只更新属性
        this.svelteComponent.$set({
          currentPosition,
          totalCount
        });
        debugLog("UIRender", "Svelte component props updated");
      }

      // 动态应用由设置决定的间距 (CSS 变量)
      this.applyStyles();
      
      debugLog("UIRender", `=== Render Complete (${Date.now() - renderStartTime}ms) ===`);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      errorLog("UIRenderService", "Render failed:", err);
      this.cleanup();
    }
  }

  /**
   * 应用动态样式（外边距等）
   */
  private applyStyles(): void {
    const settings = this.getSettings();
    if (this.currentProtyleElement) {
      const container = this.currentProtyleElement.querySelector("#page-nav-plugin-container") as HTMLElement;
      if (container) {
        // 后台逻辑自动补全 px 单位
        const marginTop = settings.marginTop ? `${settings.marginTop}px` : "0px";
        const marginBottom = settings.marginBottom ? `${settings.marginBottom}px` : "0px";
        
        container.style.setProperty("--page-nav-margin-top", marginTop);
        container.style.setProperty("--page-nav-margin-bottom", marginBottom);
      }
    }
  }

  cleanup(): void {
    if (this.renderAbortController) {
      this.renderAbortController.abort();
      this.renderAbortController = null;
    }

    if (this.svelteComponent) {
      this.svelteComponent.$destroy();
      this.svelteComponent = null;
    }
    this.currentProtyleElement = null;
  }

  toggleVisibility(show: boolean): void {
    if (this.currentProtyleElement) {
      const container = this.currentProtyleElement.querySelector("#page-nav-plugin-container") as HTMLElement;
      if (container) {
        container.style.display = show ? "flex" : "none";
      }
    }
  }

  private getActiveProtyleElement(): HTMLElement | null {
    const protyleTitle = document.querySelector(".protyle:not(.fn__none) .protyle-title");
    const protyleContent = document.querySelector(".protyle:not(.fn__none) .protyle-content");
    return (protyleTitle || protyleContent)?.closest(".protyle") as HTMLElement | null;
  }
}
