import { Plugin, openTab } from "siyuan";
import "./index.scss";

declare global {
  interface Window {
    openFileByURL?: (url: string) => void;
  }
}

interface DocItem {
  id: string;
  content: string;
  path: string;
  notebookId: string;
}

const CONTAINER_ID = "page-nav-plugin-container";
const CUSTOM_FULLWIDTH_ATTR = "custom-sy-fullwidth";
const MAX_RECURSION_DEPTH = 50;
const FETCH_TIMEOUT = 10000;

const isMobile = () => {
  return !!document.getElementById("sidebar") && window.siyuan?.config?.system?.container === "android";
};

export default class PageNavPlugin extends Plugin {
  private docs: DocItem[] = [];
  private isLoadingDocs = false;
  private isNavigating = false;
  private initialViewportHeight: number = 0;
  private resizeObserver?: ResizeObserver;

  private getI18n(key: string): string {
    return this.i18n[key] || key;
  }

  async onload() {
    try {
      await this.loadDocList();
      await this.renderNavButtons();

      this.eventBus.on("loaded-protyle-static", this.handleDocumentSwitch);
      this.eventBus.on("switch-protyle", this.handleDocumentSwitch);
      this.eventBus.on("loaded-protyle-dynamic", this.handleDocumentSwitch);
      this.eventBus.on("ws-main", this.handleWsMain);

      if (isMobile()) {
        this.setupKeyboardDetection();
      }
    } catch (err) {
      console.error("[NextPageButton] Plugin load failed:", err);
    }
  }

  onunload() {
    try {
      this.eventBus.off("loaded-protyle-static", this.handleDocumentSwitch);
      this.eventBus.off("switch-protyle", this.handleDocumentSwitch);
      this.eventBus.off("loaded-protyle-dynamic", this.handleDocumentSwitch);
      this.eventBus.off("ws-main", this.handleWsMain);
      
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = undefined;
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", this.handleViewportResize);
      } else {
        window.removeEventListener("resize", this.handleViewportResize);
      }
      document.removeEventListener("focusin", this.handleEditorFocus);
      document.removeEventListener("focusout", this.handleEditorBlur);
      
      document.querySelectorAll(`#${CONTAINER_ID}`).forEach(el => el.remove());
      
      this.docs = [];
      this.isLoadingDocs = false;
      this.isNavigating = false;
    } catch (err) {
      console.error("[NextPageButton] Plugin unload failed:", err);
    }
  }

  private handleDocumentSwitch = async (detail: any) => {
    try {
      await this.loadDocList();
      await this.renderNavButtonsWithProtyle(detail?.protyle);
    } catch (err) {
      console.error("[NextPageButton] Document switch failed:", err);
    }
  };

  private handleWsMain = async (detail: any) => {
    try {
      const data = detail?.data;
      if (!data || data.cmd !== "transactions") return;

      const transactions = data.transactions || [];
      let needReload = false;
      let needRerender = false;

      for (const transaction of transactions) {
        if (!transaction.doOperations) continue;
        
        for (const op of transaction.doOperations) {
          if (op.action === "update" && op.data?.new?.[CUSTOM_FULLWIDTH_ATTR] !== op.data?.old?.[CUSTOM_FULLWIDTH_ATTR]) {
            needRerender = true;
          }
          if (op.action === "create" || op.action === "delete" || op.action === "move") {
            needReload = true;
          }
        }
      }

      if (needReload) {
        await this.loadDocList();
      }
      if (needReload || needRerender) {
        await this.renderNavButtons();
      }
    } catch (err) {
      console.error("[NextPageButton] WebSocket event handling failed:", err);
    }
  };

  private async loadDocList(): Promise<void> {
    if (this.isLoadingDocs) return;

    this.isLoadingDocs = true;
    const timeoutId = setTimeout(() => {
      console.warn("[NextPageButton] Load doc list timeout");
      this.isLoadingDocs = false;
    }, FETCH_TIMEOUT);

    try {
      const response = await fetch("/api/notebook/lsNotebooks", { method: "POST" });
      const result = await response.json();

      if (result.code !== 0 || !result.data?.notebooks) {
        this.docs = [];
        return;
      }

      const allDocs: DocItem[] = [];
      for (const notebook of result.data.notebooks) {
        if (!notebook.closed) {
          await this.loadDocsFromPath(notebook.id, "/", allDocs);
        }
      }
      this.docs = allDocs;
    } catch (err) {
      console.error("[NextPageButton] Failed to load doc list:", err);
      this.docs = [];
    } finally {
      clearTimeout(timeoutId);
      this.isLoadingDocs = false;
    }
  }

  private async loadDocsFromPath(notebookId: string, path: string, result: DocItem[], depth = 0): Promise<void> {
    if (depth >= MAX_RECURSION_DEPTH) {
      console.warn(`[NextPageButton] Max recursion depth reached at path: ${path}`);
      return;
    }

    try {
      const response = await fetch("/api/filetree/listDocsByPath", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebook: notebookId, path })
      });
      const data = await response.json();

      if (data.code !== 0 || !data.data?.files) return;

      for (const file of data.data.files) {
        if (!file.id || !file.name) continue;

        result.push({
          id: file.id,
          content: file.name.replace(/\.sy$/, ""),
          path: file.path,
          notebookId
        });

        if (file.subFileCount > 0) {
          await this.loadDocsFromPath(notebookId, file.path, result, depth + 1);
        }
      }
    } catch (err) {
      console.error(`[NextPageButton] Failed to load path ${path}:`, err);
    }
  }

  private createNavigationContainer(
    currentDocId: string,
    notebookId: string,
    notebookDocs: DocItem[],
    indexInNotebook: number
  ): HTMLDivElement {
    const container = document.createElement("div");
    container.id = CONTAINER_ID;

    const isFirst = indexInNotebook === 0;
    const isLast = indexInNotebook === notebookDocs.length - 1;

    const prevText = this.getI18n("prevPage");
    const nextText = this.getI18n("nextPage");

    const btnPrev = this.createButton(
      `<svg class="b3-button__icon"><use xlink:href="#iconLeft"></use></svg><span>${prevText}</span>`,
      isFirst,
      () => this.navigatePrev(currentDocId, notebookId)
    );

    const indicator = document.createElement("span");
    const currentPage = indexInNotebook + 1;
    const totalPages = notebookDocs.length;
    indicator.textContent = `${currentPage} / ${totalPages}`;
    indicator.className = "page-nav-indicator";
    indicator.contentEditable = "false";

    const btnNext = this.createButton(
      `<span>${nextText}</span><svg class="b3-button__icon"><use xlink:href="#iconRight"></use></svg>`,
      isLast,
      () => this.navigateNext(currentDocId, notebookId)
    );

    container.appendChild(btnPrev);
    container.appendChild(indicator);
    container.appendChild(btnNext);

    return container;
  }

  private createButton(innerHTML: string, disabled: boolean, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.innerHTML = innerHTML;
    button.className = "b3-button b3-button--outline page-nav-button";
    button.contentEditable = "false";
    button.disabled = disabled;
    button.type = "button";

    if (!disabled) {
      const handleClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      };
      button.addEventListener("click", handleClick, { once: false });
    }

    return button;
  }

  private openDocument(id: string): void {
    if (isMobile()) {
      if (window.openFileByURL) {
        window.openFileByURL(`siyuan://blocks/${id}`);
      } else {
        console.error("[NextPageButton] window.openFileByURL not available");
      }
    } else {
      openTab({ app: this.app, doc: { id } });
    }
  }

  private async navigatePrev(currentDocId: string, notebookId: string): Promise<void> {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    try {
      await this.loadDocList();
      const notebookDocs = this.docs.filter(doc => doc.notebookId === notebookId);
      const currentIndex = notebookDocs.findIndex(doc => doc.id === currentDocId);

      if (currentIndex > 0) {
        this.openDocument(notebookDocs[currentIndex - 1].id);
      } else {
        await this.renderNavButtons();
      }
    } catch (err) {
      console.error("[NextPageButton] Navigate prev failed:", err);
    } finally {
      this.isNavigating = false;
    }
  }

  private async navigateNext(currentDocId: string, notebookId: string): Promise<void> {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    try {
      await this.loadDocList();
      const notebookDocs = this.docs.filter(doc => doc.notebookId === notebookId);
      const currentIndex = notebookDocs.findIndex(doc => doc.id === currentDocId);

      if (currentIndex >= 0 && currentIndex < notebookDocs.length - 1) {
        this.openDocument(notebookDocs[currentIndex + 1].id);
      } else {
        await this.renderNavButtons();
      }
    } catch (err) {
      console.error("[NextPageButton] Navigate next failed:", err);
    } finally {
      this.isNavigating = false;
    }
  }

  private async renderNavButtonsWithProtyle(protyle?: any): Promise<void> {
    if (!protyle?.block) {
      return this.renderNavButtons();
    }

    try {
      const docId = protyle.block.rootID;
      const protyleElement = protyle.element;

      if (!docId || !protyleElement || !this.docs.length) return;

      const currentDoc = this.docs.find(doc => doc.id === docId);
      if (!currentDoc) return;

      const notebookDocs = this.docs.filter(doc => doc.notebookId === currentDoc.notebookId);
      if (notebookDocs.length === 0) return;

      const index = notebookDocs.findIndex(doc => doc.id === docId);
      if (index < 0) return;

      protyleElement.querySelectorAll(`#${CONTAINER_ID}`).forEach((el: Element) => {
        if (el.parentNode) {
          el.remove();
        }
      });

      const container = this.createNavigationContainer(docId, currentDoc.notebookId, notebookDocs, index);
      if (protyleElement.parentNode) {
        protyleElement.appendChild(container);
      }
    } catch (err) {
      console.error("[NextPageButton] Render buttons with protyle failed:", err);
    }
  }

  private async renderNavButtons(): Promise<void> {
    try {
      document.querySelectorAll(`#${CONTAINER_ID}`).forEach(el => {
        if (el.parentNode) {
          el.remove();
        }
      });

      const protyleTitle = document.querySelector(".protyle:not(.fn__none) .protyle-title");
      const protyleContent = document.querySelector(".protyle:not(.fn__none) .protyle-content");

      const docId = protyleTitle?.getAttribute("data-node-id") || protyleContent?.getAttribute("data-node-id");
      const protyleElement = (protyleTitle || protyleContent)?.closest(".protyle");

      if (!docId || !protyleElement || !this.docs.length) return;

      const currentDoc = this.docs.find(doc => doc.id === docId);
      if (!currentDoc) return;

      const notebookDocs = this.docs.filter(doc => doc.notebookId === currentDoc.notebookId);
      if (notebookDocs.length === 0) return;

      const index = notebookDocs.findIndex(doc => doc.id === docId);
      if (index < 0) return;

      const container = this.createNavigationContainer(docId, currentDoc.notebookId, notebookDocs, index);
      if (protyleElement.parentNode) {
        protyleElement.appendChild(container);
      }
    } catch (err) {
      console.error("[NextPageButton] Render buttons failed:", err);
    }
  }

  private setupKeyboardDetection(): void {
    this.initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this.handleViewportResize);
    } else {
      window.addEventListener("resize", this.handleViewportResize);
    }

    this.setupFocusDetection();
  }

  private handleViewportResize = (): void => {
    const currentHeight = window.visualViewport?.height || window.innerHeight;
    const heightDiff = this.initialViewportHeight - currentHeight;
    const isKeyboardVisible = heightDiff > 150;

    this.toggleNavButtons(!isKeyboardVisible);
  };

  private setupFocusDetection(): void {
    document.addEventListener("focusin", this.handleEditorFocus);
    document.addEventListener("focusout", this.handleEditorBlur);
  }

  private handleEditorFocus = (e: FocusEvent): void => {
    const target = e.target as HTMLElement;
    
    if (target && (
      target.classList.contains("protyle-wysiwyg") ||
      target.closest(".protyle-wysiwyg") ||
      target.getAttribute("contenteditable") === "true"
    )) {
      setTimeout(() => {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const heightDiff = this.initialViewportHeight - currentHeight;
        const isKeyboardVisible = heightDiff > 150;
        
        if (isKeyboardVisible) {
          this.toggleNavButtons(false);
        }
      }, 300);
    }
  };

  private handleEditorBlur = (): void => {
    setTimeout(() => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = this.initialViewportHeight - currentHeight;
      const isKeyboardVisible = heightDiff > 150;
      
      if (!isKeyboardVisible) {
        this.toggleNavButtons(true);
      }
    }, 300);
  };

  private toggleNavButtons(show: boolean): void {
    const containers = document.querySelectorAll(`#${CONTAINER_ID}`);
    containers.forEach((container: Element) => {
      if (container instanceof HTMLElement) {
        container.style.display = show ? "flex" : "none";
      }
    });
  }
}
