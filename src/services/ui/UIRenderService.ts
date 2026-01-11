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
    
    // Save current element to avoid losing reference when focus shifts (e.g., settings dialog opens)
    const savedProtyle = this.currentProtyleElement;
    
    if (this.renderAbortController) {
      this.renderAbortController.abort();
    }

    this.renderAbortController = new AbortController();
    const signal = this.renderAbortController.signal;

    try {
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

      // If docId is missing (common when dialog is open), extract from target element
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

      // Re-initialize if the protyle element changes, component doesn't exist, or layout mode changes
      if (this.currentProtyleElement !== protyleElement || !this.svelteComponent || this.currentLayoutMode !== layoutMode) {
        this.cleanup();
        this.currentProtyleElement = protyleElement;
        this.currentLayoutMode = layoutMode;
        
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
        this.svelteComponent.$set({
          currentPosition,
          totalCount
        });
        debugLog("UIRender", "Svelte component props updated");
      }

      this.applyStyles();
      
      debugLog("UIRender", `=== Render Complete (${Date.now() - renderStartTime}ms) ===`);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      errorLog("UIRenderService", "Render failed:", err);
      this.cleanup();
    }
  }

  /**
   * Apply dynamic styles such as margins.
   */
  private applyStyles(): void {
    const settings = this.getSettings();
    if (this.currentProtyleElement && settings.layoutMode !== "side") {
      const container = this.currentProtyleElement.querySelector("#page-nav-plugin-container") as HTMLElement;
      if (container) {
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
