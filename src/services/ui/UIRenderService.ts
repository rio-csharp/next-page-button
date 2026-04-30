import Navigation from "./Navigation.svelte";
import SideNavigation from "./SideNavigation.svelte";
import type { IProtyle } from "siyuan";
import { debugLog, errorLog } from "../../utils/logger";
import type { IDocumentService } from "../DocumentService";
import type { INavigationService } from "../INavigationService";
import { NavigationEventHandler } from "./NavigationEventHandler";
import type { IPluginSettings } from "../../utils/constants";
import { DomUtils } from "../../utils/domUtils";

export interface IUIRenderService {
  renderNavigationButtons(force?: boolean, protyle?: IProtyle): Promise<void>;
  cleanupProtyle(protyle: IProtyle): void;
  cleanup(): void;
  toggleVisibility(show: boolean): void;
}

interface NavigationComponentProps {
  currentPosition: number;
  totalCount: number;
  i18n: (key: string) => string;
  onPrev: () => void;
  onNext: () => void;
}

interface NavigationComponentInstance {
  $set(props: Partial<NavigationComponentProps>): void;
  $destroy(): void;
}

type NavigationComponentConstructor = new (options: {
  target: HTMLElement;
  props: NavigationComponentProps;
}) => NavigationComponentInstance;

export class UIRenderService implements IUIRenderService {
  private renderAbortController: AbortController | null = null;
  private svelteComponent: NavigationComponentInstance | null = null;
  private eventHandler: NavigationEventHandler;
  private currentProtyleElement: HTMLElement | null = null;
  private currentLayoutMode: string | null = null;
  private originalProtylePosition: string | null = null;
  private currentDocumentId: string | null = null;

  constructor(
    private documentService: IDocumentService,
    navigationService: INavigationService,
    private i18n: (key: string) => string,
    private getSettings: () => IPluginSettings
  ) {
    this.eventHandler = new NavigationEventHandler(documentService, navigationService);
  }

  async renderNavigationButtons(force = false, protyle?: IProtyle): Promise<void> {
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
        this.destroyMountedComponent();
      }

      let docId = protyle?.block?.rootID || this.documentService.getCurrentDocumentId();
      
      if (signal.aborted) return;

      const protyleElement = protyle?.element || this.getActiveProtyleElement() || savedProtyle;
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

      const navigationInfo = await this.documentService.getDocumentNavigationInfo(docId);
      if (signal.aborted) return;
      
      if (!navigationInfo) {
        this.cleanup();
        return;
      }

      const { currentPosition, totalCount } = navigationInfo;
      const settings = this.getSettings();
      const layoutMode = settings.layoutMode || "bottom";
      const ComponentClass = (
        layoutMode === "side" ? SideNavigation : Navigation
      ) as unknown as NavigationComponentConstructor;

      // Re-initialize if the protyle element changes, component doesn't exist, or layout mode changes
      if (this.currentProtyleElement !== protyleElement || !this.svelteComponent || this.currentLayoutMode !== layoutMode) {
        this.destroyMountedComponent();
        this.currentProtyleElement = protyleElement;
        this.currentLayoutMode = layoutMode;
        this.currentDocumentId = docId;
        
        if (layoutMode === "side" && protyleElement.style.position !== "relative") {
          this.originalProtylePosition = protyleElement.style.position;
          protyleElement.style.position = "relative";
        }

        this.svelteComponent = new ComponentClass({
          target: protyleElement,
          props: {
            currentPosition,
            totalCount,
            i18n: this.i18n,
            onPrev: () => this.eventHandler.handleNavigate(-1, this.currentDocumentId),
            onNext: () => this.eventHandler.handleNavigate(1, this.currentDocumentId)
          }
        });
        debugLog("UIRender", `Svelte component mounted (${layoutMode})`);
      } else {
        this.currentDocumentId = docId;
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

  cleanupProtyle(protyle: IProtyle): void {
    if (this.currentProtyleElement === protyle.element) {
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

    this.destroyMountedComponent();
  }

  private destroyMountedComponent(): void {
    if (this.svelteComponent) {
      this.svelteComponent.$destroy();
      this.svelteComponent = null;
    }

    if (this.currentProtyleElement && this.originalProtylePosition !== null) {
      this.currentProtyleElement.style.position = this.originalProtylePosition;
      this.originalProtylePosition = null;
    }

    this.currentProtyleElement = null;
    this.currentLayoutMode = null;
    this.currentDocumentId = null;
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
    return DomUtils.getActiveProtyleElement();
  }
}
