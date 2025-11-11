import "../index.scss";
import { CONTAINER_ID, CSS_CLASSES } from "../utils/constants";
import { debugLog, errorLog } from "../utils/logger";
import { IDocumentService } from "./DocumentService";
import { INavigationService } from "./NavigationService";

// 导航方向常量
const NAVIGATE_PREV = -1;
const NAVIGATE_NEXT = 1;

export interface IUIRenderService {
  renderNavigationButtons(): Promise<void>;
  cleanup(): void;
  toggleVisibility(show: boolean): void;
}

export class UIRenderService implements IUIRenderService {
  private isNavigating = false;
  private renderAbortController: AbortController | null = null;
  private containerElement: HTMLDivElement | null = null;
  private btnPrev: HTMLButtonElement | null = null;
  private btnNext: HTMLButtonElement | null = null;
  private indicator: HTMLSpanElement | null = null;
  private prevClickHandler: EventListener | null = null;
  private nextClickHandler: EventListener | null = null;

  constructor(
    private documentService: IDocumentService,
    private navigationService: INavigationService,
    private i18n: (key: string) => string
  ) {}

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
      const needRecreate = !this.containerElement || 
                           !this.containerElement.parentNode || 
                           this.containerElement.parentNode !== protyleElement;

      if (needRecreate) {
        this.cleanup();
        this.createNavigationContainer(protyleElement);
        debugLog("UIRender", "Container created");
      }

      // 更新状态
      this.updateNavigationState(currentPosition, totalCount);
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

    // 移除事件监听器
    if (this.btnPrev && this.prevClickHandler) {
      this.btnPrev.removeEventListener("click", this.prevClickHandler);
    }
    if (this.btnNext && this.nextClickHandler) {
      this.btnNext.removeEventListener("click", this.nextClickHandler);
    }

    // 移除DOM
    this.containerElement?.remove();

    // 清空引用
    this.containerElement = null;
    this.btnPrev = null;
    this.btnNext = null;
    this.indicator = null;
    this.prevClickHandler = null;
    this.nextClickHandler = null;
    this.isNavigating = false;
  }

  /**
   * 显示/隐藏
   */
  toggleVisibility(show: boolean): void {
    if (this.containerElement) {
      this.containerElement.style.display = show ? "flex" : "none";
    }
  }

  /**
   * 获取当前激活的 protyle 元素
   */
  private getActiveProtyleElement(): HTMLElement | null {
    const protyleTitle = document.querySelector(".protyle:not(.fn__none) .protyle-title");
    const protyleContent = document.querySelector(".protyle:not(.fn__none) .protyle-content");
    return (protyleTitle || protyleContent)?.closest(".protyle") as HTMLElement | null;
  }

  /**
   * 创建导航容器
   */
  private createNavigationContainer(protyleElement: HTMLElement): void {
    this.containerElement = document.createElement("div");
    this.containerElement.id = CONTAINER_ID;

    // 创建事件处理器
    this.prevClickHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleNavigate(NAVIGATE_PREV);
    };

    this.nextClickHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleNavigate(NAVIGATE_NEXT);
    };

    // 创建并添加元素
    this.btnPrev = this.createNavigationButton(this.i18n("prevPage"), "#iconLeft", "left", this.prevClickHandler);
    this.indicator = this.createPageIndicator();
    this.btnNext = this.createNavigationButton(this.i18n("nextPage"), "#iconRight", "right", this.nextClickHandler);

    this.containerElement.append(this.btnPrev, this.indicator, this.btnNext);
    protyleElement.appendChild(this.containerElement);
  }

  /**
   * 更新导航状态
   */
  private updateNavigationState(currentPosition: number, totalCount: number): void {
    if (this.indicator) {
      this.indicator.textContent = `${currentPosition} / ${totalCount}`;
    }
    if (this.btnPrev) {
      this.btnPrev.disabled = currentPosition === 1;
    }
    if (this.btnNext) {
      this.btnNext.disabled = currentPosition === totalCount;
    }
  }

  /**
   * 创建导航按钮
   */
  private createNavigationButton(
    text: string,
    iconHref: string,
    iconPosition: "left" | "right",
    onClick: EventListener
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = `${CSS_CLASSES.b3Button} ${CSS_CLASSES.b3ButtonOutline} ${CSS_CLASSES.button}`;
    button.contentEditable = "false";
    button.type = "button";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", CSS_CLASSES.b3ButtonIcon);
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", iconHref);
    svg.appendChild(use);
    
    const span = document.createElement("span");
    span.textContent = text;
    
    if (iconPosition === "left") {
      button.appendChild(svg);
      button.appendChild(span);
    } else {
      button.appendChild(span);
      button.appendChild(svg);
    }
    
    /**
     * 内存安全说明：
     * - onClick 参数是 prevClickHandler 或 nextClickHandler 的引用
     * - 这些引用保存在类属性中，因此 cleanup() 可以精确移除监听器
     * - 不会造成内存泄漏
     */
    button.addEventListener("click", onClick);
    return button;
  }

  /**
   * 创建页码指示器
   */
  private createPageIndicator(): HTMLSpanElement {
    const indicator = document.createElement("span");
    indicator.className = CSS_CLASSES.indicator;
    indicator.contentEditable = "false";
    return indicator;
  }

  /**
   * 处理导航
   */
  private async handleNavigate(offset: number): Promise<void> {
    if (this.isNavigating) return;

    this.isNavigating = true;
    try {
      const currentDocId = this.documentService.getCurrentDocumentId();
      if (!currentDocId) return;

      const notebookId = await this.documentService.getNotebookIdByDocId(currentDocId);
      if (!notebookId) return;

      const currentPosition = await this.documentService.getCurrentDocumentPosition(currentDocId);
      const targetPosition = currentPosition + offset;

      // 获取目标文档并导航
      const targetDocId = await this.documentService.getDocumentIdByPosition(notebookId, targetPosition);
      if (targetDocId) {
        this.navigationService.navigateToDocument(targetDocId);
      }
    } catch (err) {
      errorLog("UIRenderService", "Navigate failed:", err);
    } finally {
      this.isNavigating = false;
    }
  }
}
