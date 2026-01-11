import Navigation from "./Navigation.svelte";
import SideNavigation from "./SideNavigation.svelte";
import { debugLog, errorLog } from "../../utils/logger";
import { IDocumentService } from "../DocumentService";
import { INavigationService } from "../NavigationService";
import { NavigationEventHandler } from "./NavigationEventHandler";
import { IPluginSettings } from "../../utils/constants";

export interface IUIRenderService {
  renderNavigationButtons(force?: boolean): Promise<void>;
  cleanup(): void;
  toggleVisibility(show: boolean): void;
}

export class UIRenderService implements IUIRenderService {
  private renderAbortController: AbortController | null = null;
  private svelteComponent: Navigation | SideNavigation | null = null;
  private eventHandler: NavigationEventHandler;
  private currentProtyleElement: HTMLElement | null = null;
  private currentLayoutMode: string | null = null;

  constructor(
    private documentService: IDocumentService,
    navigationService: INavigationService,
    private i18n: (key: string) => string,
    private getSettings: () => IPluginSettings
  ) {
    this.eventHandler = new NavigationEventHandler(documentService, navigationService);
  }

  async renderNavigationButtons(force = false): Promise<void> {
    const renderStartTime = Date.now();
    debugLog("UIRender", `=== Render Start (force: ${force}) ===`);
    
    // 强制刷新时特殊处理：保留当前元素引用，防止设置对话框开启时焦点丢失导致找不到 Protyle
    const savedProtyle = this.currentProtyleElement;
    
    if (this.renderAbortController) {
      this.renderAbortController.abort();
    }

    this.renderAbortController = new AbortController();
    const signal = this.renderAbortController.signal;

    try {
      // 如果强制重绘，仅销毁组件，保留 currentProtyleElement 引用
      if (force && this.svelteComponent) {
        this.svelteComponent.$destroy();
        this.svelteComponent = null;
      }

      let docId = this.documentService.getCurrentDocumentId();
      
      if (signal.aborted) return;

      const protyleElement = this.getActiveProtyleElement() || savedProtyle;
      if (!protyleElement) {
        this.cleanup();
        return;
      }

      // 如果通过常规方式没拿到 docId（常见于设置对话框打开时），从 DOM 元素中提取
      if (!docId && protyleElement) {
        docId = protyleElement.querySelector('.protyle-wysiwyg')?.getAttribute('data-node-id') || null;
      }

      if (!docId) {
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

      const settings = this.getSettings();
      const layoutMode = settings.layoutMode || "bottom";
      const ComponentClass = layoutMode === "side" ? SideNavigation : Navigation;

      // 如果 Protyle 元素变了，或者组件还没创建，或者布局模式变了，则重新创建
      if (this.currentProtyleElement !== protyleElement || !this.svelteComponent || this.currentLayoutMode !== layoutMode) {
        this.cleanup();
        this.currentProtyleElement = protyleElement;
        this.currentLayoutMode = layoutMode;
        
        // 侧边模式下确保父容器有 relative 定位
        if (layoutMode === "side" && protyleElement.style.position !== "relative") {
          protyleElement.style.position = "relative";
        }

        this.svelteComponent = new ComponentClass({
          target: protyleElement,
          props: {
            currentPosition,
            totalCount,
            i18n: this.i18n,
            onPrev: () => this.eventHandler.handleNavigate(-1),
            onNext: () => this.eventHandler.handleNavigate(1)
          }
        }) as any;
        debugLog("UIRender", `Svelte component mounted (${layoutMode})`);
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
    if (this.currentProtyleElement && settings.layoutMode !== "side") {
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
    this.currentLayoutMode = null;
  }

  toggleVisibility(show: boolean): void {
    if (this.currentProtyleElement) {
      const container = this.currentProtyleElement.querySelector("#page-nav-plugin-container, #page-nav-side-container") as HTMLElement;
      if (container) {
        container.style.display = show ? (container.id === "page-nav-side-container" ? "block" : "flex") : "none";
      }
    }
  }

  private getActiveProtyleElement(): HTMLElement | null {
    const protyleTitle = document.querySelector(".protyle:not(.fn__none) .protyle-title");
    const protyleContent = document.querySelector(".protyle:not(.fn__none) .protyle-content");
    return (protyleTitle || protyleContent)?.closest(".protyle") as HTMLElement | null;
  }
}
