import { errorLog } from "../../utils/logger";
import { IDocumentService } from "../DocumentService";
import { INavigationService } from "../NavigationService";

export class NavigationEventHandler {
  private isNavigating = false;

  constructor(
    private documentService: IDocumentService,
    private navigationService: INavigationService
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

  public async handleNavigate(offset: number): Promise<void> {
    if (this.isNavigating) return;

    this.isNavigating = true;
    try {
      const currentDocId = this.documentService.getCurrentDocumentId();
      if (!currentDocId) return;

      const notebookId = await this.documentService.getNotebookIdByDocId(currentDocId);
      if (!notebookId) return;

      const currentPosition = await this.documentService.getCurrentDocumentPosition(currentDocId);
      const targetPosition = currentPosition + offset;

      const targetDocId = await this.documentService.getDocumentIdByPosition(
        notebookId,
        targetPosition
      );
      if (targetDocId) {
        this.navigationService.navigateToDocument(targetDocId);
      }
    } catch (err) {
      errorLog("NavigationEventHandler", "Navigate failed:", err);
    } finally {
      this.isNavigating = false;
    }
  }
}
