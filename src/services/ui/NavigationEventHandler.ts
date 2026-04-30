import { errorLog } from "../../utils/logger";
import type { Tab } from "siyuan";
import type { IDocumentService } from "../DocumentService";
import type { INavigationService } from "../INavigationService";

export class NavigationEventHandler {
  private isNavigating = false;

  constructor(
    private documentService: IDocumentService,
    private navigationService: INavigationService,
    private shouldCloseCurrentTab: () => boolean
  ) {}

  createPrevHandler(): EventListener {
    return (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleNavigate(-1);
    };
  }

  createNextHandler(): EventListener {
    return (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleNavigate(1);
    };
  }

  public async handleNavigate(
    offset: number,
    docId?: string | null,
    sourceTab?: Tab | null
  ): Promise<void> {
    if (this.isNavigating) return;

    this.isNavigating = true;
    try {
      const currentDocId = docId || this.documentService.getCurrentDocumentId();
      if (!currentDocId) return;

      const targetDocId = await this.documentService.getDocumentIdByOffset(currentDocId, offset);
      if (targetDocId) {
        await this.navigationService.navigateToDocument(targetDocId, {
          closeCurrentTab: this.shouldCloseCurrentTab(),
          sourceTab
        });
      }
    } catch (err) {
      errorLog("NavigationEventHandler", "Navigate failed:", err);
    } finally {
      this.isNavigating = false;
    }
  }
}
