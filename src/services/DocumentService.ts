import type { FileTreeNode } from "../models/DocItem";
import { API_ENDPOINTS, MAX_RECURSION_DEPTH } from "../utils/constants";
import { debugLog, errorLog } from "../utils/logger";
import { DomUtils } from "../utils/domUtils";
import type { BlockInfo, ISiYuanApiClient, ListDocsByPathResult } from "./SiYuanApiClient";
import { SiYuanApiClient } from "./SiYuanApiClient";

export interface IDocumentService {
  getCurrentDocumentId(): string | null;
  getDocumentNavigationInfo(docId: string): Promise<DocumentNavigationInfo | null>;
  getDocumentIdByOffset(docId: string, offset: number): Promise<string | null>;
}

export interface DocumentNavigationInfo {
  notebookId: string;
  currentPosition: number;
  totalCount: number;
}

/**
 * Document Service
 * 
 * Design Notes:
 * - Documents are queried in real-time without caching.
 * - Reasons: Local app performance is sufficient, and real-time accuracy is critical 
 *   when documents are added/deleted.
 */
export class DocumentService implements IDocumentService {
  constructor(private apiClient: ISiYuanApiClient = new SiYuanApiClient()) {}

  getCurrentDocumentId(): string | null {
    const protyle = DomUtils.getActiveProtyleElement();
    return protyle ? DomUtils.getDocIdFromProtyle(protyle) : null;
  }

  private async getNotebookIdByDocId(docId: string): Promise<string | null> {
    try {
      debugLog("DocumentService", `Getting notebook ID for doc: ${docId}`);

      const data = await this.apiClient.post<BlockInfo>(API_ENDPOINTS.getBlockInfo, { id: docId });
      if (data?.box) {
        debugLog("DocumentService", `Found notebook ID: ${data.box}`);
        return data.box;
      }
      
      debugLog("DocumentService", "No notebook ID found");
      return null;
    } catch (err) {
      errorLog("DocumentService", "Failed to get notebook ID:", err);
      return null;
    }
  }

  async getDocumentNavigationInfo(docId: string): Promise<DocumentNavigationInfo | null> {
    const notebookId = await this.getNotebookIdByDocId(docId);
    if (!notebookId) {
      return null;
    }

    const docIds = await this.loadDocumentIdList(notebookId);
    const index = docIds.findIndex(id => id === docId);
    if (index < 0 || docIds.length === 0) {
      return null;
    }

    return {
      notebookId,
      currentPosition: index + 1,
      totalCount: docIds.length
    };
  }

  async getDocumentIdByOffset(docId: string, offset: number): Promise<string | null> {
    const notebookId = await this.getNotebookIdByDocId(docId);
    if (!notebookId) {
      return null;
    }

    const docIds = await this.loadDocumentIdList(notebookId);
    if (docIds.length === 0) {
      return null;
    }

    const currentIndex = docIds.findIndex(id => id === docId);
    if (currentIndex < 0) {
      return null;
    }

    const targetIndex = Math.max(0, Math.min(currentIndex + offset, docIds.length - 1));
    return docIds[targetIndex];
  }

  /**
   * Load document ID list for notebook. Queries in real-time without caching.
   */
  private async loadDocumentIdList(notebookId: string): Promise<string[]> {
    const loadStartTime = Date.now();
    debugLog("DocumentService", `Loading document ID list for notebook: ${notebookId}`);
    const docIds: string[] = [];
    await this.loadDocIdsFromPath(notebookId, "/", docIds);
    const loadTime = Date.now() - loadStartTime;
    debugLog("DocumentService", `Loaded ${docIds.length} document IDs in ${loadTime}ms`);
    debugLog("DocumentService", `Doc IDs: [${docIds.join(", ")}]`);
    
    return docIds;
  }

  private async loadDocIdsFromPath(
    notebookId: string,
    path: string,
    result: string[],
    depth = 0
  ): Promise<void> {
    if (depth >= MAX_RECURSION_DEPTH) {
      debugLog("DocumentService", `Max recursion depth reached at: ${path}`);
      return;
    }

    try {
      // API handles sorting automatically based on notebook settings
      const files = await this.fetchFileTree(notebookId, path);

      for (const file of files) {
        if (!file.id) continue;

        result.push(file.id);

        if (file.subFileCount > 0) {
          await this.loadDocIdsFromPath(notebookId, file.path, result, depth + 1);
        }
      }
    } catch (err) {
      errorLog("DocumentService", `Failed to load path ${path}:`, err);
    }
  }

  private async fetchFileTree(notebookId: string, path: string): Promise<FileTreeNode[]> {
    try {
      // API uses the notebook's default sort mode when sort parameter is omitted.
      const data = await this.apiClient.post<ListDocsByPathResult<FileTreeNode>>(
        API_ENDPOINTS.listDocsByPath,
        { notebook: notebookId, path }
      );
      return data?.files ?? [];
    } catch (err) {
      errorLog("DocumentService", "Failed to fetch file tree:", err);
      return [];
    }
  }
}
