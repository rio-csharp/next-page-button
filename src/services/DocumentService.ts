import { FileTreeNode } from "../models/DocItem";
import { API_ENDPOINTS, MAX_RECURSION_DEPTH } from "../utils/constants";
import { debugLog, errorLog } from "../utils/logger";
import { DomUtils } from "../utils/domUtils";

export interface IDocumentService {
  getCurrentDocumentId(): string | null;
  getNotebookIdByDocId(docId: string): Promise<string | null>;
  getNotebookDocumentCount(notebookId: string): Promise<number>;
  getCurrentDocumentPosition(docId: string): Promise<number>;
  getDocumentIdByPosition(notebookId: string, position: number): Promise<string | null>;
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
  getCurrentDocumentId(): string | null {
    const protyle = DomUtils.getActiveProtyleElement();
    return protyle ? DomUtils.getDocIdFromProtyle(protyle) : null;
  }

  async getNotebookIdByDocId(docId: string): Promise<string | null> {
    try {
      debugLog("DocumentService", `Getting notebook ID for doc: ${docId}`);
      
      const response = await fetch("/api/block/getBlockInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId })
      });
      const data = await response.json();

      if (data.code === 0 && data.data?.box) {
        debugLog("DocumentService", `Found notebook ID: ${data.data.box}`);
        return data.data.box;
      }
      
      debugLog("DocumentService", "No notebook ID found");
      return null;
    } catch (err) {
      errorLog("DocumentService", "Failed to get notebook ID:", err);
      return null;
    }
  }

  async getNotebookDocumentCount(notebookId: string): Promise<number> {
    try {
      debugLog("DocumentService", `Getting document count for notebook: ${notebookId}`);
      
      // Use /api/filetree/listDocsByPath for real-time count to avoid SQL sync latency (~50-60ms).
      const docIds = await this.loadDocumentIdList(notebookId);
      const count = docIds.length;
      debugLog("DocumentService", `Document count: ${count}`);
      return count;
    } catch (err) {
      errorLog("DocumentService", "Failed to get document count:", err);
      return 0;
    }
  }

  /**
   * Get document position within notebook (1-indexed).
   * Note: Order follows document tree rules (filename, modified time, or custom sort).
   */
  async getCurrentDocumentPosition(docId: string): Promise<number> {
    try {
      const notebookId = await this.getNotebookIdByDocId(docId);
      if (!notebookId) {
        return 0;
      }

      const docIds = await this.loadDocumentIdList(notebookId);
      const index = docIds.findIndex(id => id === docId);
      return index >= 0 ? index + 1 : 0;
    } catch (err) {
      errorLog("DocumentService", "Failed to get document position:", err);
      return 0;
    }
  }

  /**
   * Get document ID by notebook ID and position.
   * 
   * @param notebookId Notebook ID
   * @param position Document position (1-indexed)
   * @returns Document ID, or boundary document if position is out of range
   */
  async getDocumentIdByPosition(notebookId: string, position: number): Promise<string | null> {
    try {
      const docIds = await this.loadDocumentIdList(notebookId);
      if (docIds.length === 0) {
        return null;
      }
      
      // Boundary handling: restrict index to [0, docIds.length - 1]
      const index = Math.max(0, Math.min(position - 1, docIds.length - 1));
      return docIds[index];
    } catch (err) {
      errorLog("DocumentService", "Failed to get document by position:", err);
      return null;
    }
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
      const response = await fetch(API_ENDPOINTS.listDocsByPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebook: notebookId, path })
      });
      const data = await response.json();

      if (data.code !== 0 || !data.data?.files) {
        return [];
      }

      return data.data.files;
    } catch (err) {
      errorLog("DocumentService", "Failed to fetch file tree:", err);
      return [];
    }
  }
}
