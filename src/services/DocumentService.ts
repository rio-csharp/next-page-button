import { FileTreeNode } from "../models/DocItem";
import { API_ENDPOINTS, MAX_RECURSION_DEPTH } from "../utils/constants";
import { debugLog, errorLog } from "../utils/logger";

export interface IDocumentService {
  getCurrentDocumentId(): string | null;
  getNotebookIdByDocId(docId: string): Promise<string | null>;
  getNotebookDocumentCount(notebookId: string): Promise<number>;
  getCurrentDocumentPosition(docId: string): Promise<number>;
  getDocumentIdByPosition(notebookId: string, position: number): Promise<string | null>;
}

/**
 * 文档服务
 * 
 * 设计说明：
 * - 不使用缓存机制，每次都实时查询文档列表
 * - 原因：思源笔记是本地应用，查询性能不是瓶颈
 * - 实时性更重要：用户添加/删除文档后，页码需要立即更新
 * - 如果使用缓存，会导致用户操作后页码不准确（延迟问题）
 */
export class DocumentService implements IDocumentService {
  getCurrentDocumentId(): string | null {
    const protyleTitle = document.querySelector(".protyle:not(.fn__none) .protyle-title");
    const protyleContent = document.querySelector(".protyle:not(.fn__none) .protyle-content");
    return protyleTitle?.getAttribute("data-node-id") || protyleContent?.getAttribute("data-node-id") || null;
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
   * 获取文档在其所属笔记本中的位置（从1开始）
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
   * 根据笔记本ID和位置获取文档ID
   */
  async getDocumentIdByPosition(notebookId: string, position: number): Promise<string | null> {
    try {
      const docIds = await this.loadDocumentIdList(notebookId);
      if (docIds.length === 0) {
        return null;
      }
      
      const index = Math.max(0, Math.min(position, docIds.length) - 1);
      return docIds[index];
    } catch (err) {
      errorLog("DocumentService", "Failed to get document by position:", err);
      return null;
    }
  }

  /**
   * 加载笔记本的文档ID列表
   * 
   * 重要：每次都重新加载，不使用缓存
   * - 确保获取最新的文档树结构
   * - 用户添加/删除/移动文档后立即生效
   * - 本地查询性能足够快（通常 < 100ms）
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
      const files = await this.fetchFileTree(notebookId, path);

      for (const file of files) {
        if (!file.id) continue;

        // 只保存文档ID
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
