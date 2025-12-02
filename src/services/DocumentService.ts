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
    // 参考思源源码 src/plugin/API.ts 中的 getActiveEditor 方法
    // 优先从当前选区所在的编辑器获取
    const range = window.getSelection()?.rangeCount > 0 ? window.getSelection().getRangeAt(0) : null;
    let protyleElement: HTMLElement | null = null;
    
    if (range) {
      // 如果有选区，找到选区所在的 protyle
      protyleElement = range.startContainer.parentElement?.closest('.protyle:not(.fn__none)') as HTMLElement;
    }
    
    if (!protyleElement) {
      // 如果没有选区或找不到，找活动窗口中的 protyle
      protyleElement = document.querySelector('.layout__wnd--active .protyle:not(.fn__none)') as HTMLElement;
    }
    
    if (!protyleElement) {
      // 最后尝试找任何可见的 protyle
      protyleElement = document.querySelector('.protyle:not(.fn__none)') as HTMLElement;
    }
    
    if (!protyleElement) {
      return null;
    }
    
    // 从 protyle-title 或 protyle-wysiwyg 获取 data-node-id（这就是 rootID）
    const titleElement = protyleElement.querySelector('.protyle-title[data-node-id]');
    const wysiwygElement = protyleElement.querySelector('.protyle-wysiwyg[data-node-id]');
    
    return titleElement?.getAttribute('data-node-id') || 
           wysiwygElement?.getAttribute('data-node-id') || 
           null;
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
      
      // 重要：使用 /api/filetree/listDocsByPath 获取实时文档数量
      // ListDocTree 直接读取文件系统，确保获取最新数据（不依赖数据库事务队列）
      // SQL API 有延迟问题：事务队列异步处理，可能有 50-60ms 延迟
      // 参考：siyuan/kernel/model/file.go:233 ListDocTree()
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
   * 
   * 重要：位置顺序遵循文档树的排序规则
   * - /api/filetree/listDocsByPath 会根据笔记本配置的排序方式返回
   * - 支持所有排序模式：文件名、修改时间、自定义排序等
   * - 不传 sort 参数时，API 自动使用笔记本的排序配置
   * - 参考：siyuan/kernel/model/file.go:233 ListDocTree()
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
   * 
   * @param notebookId 笔记本ID
   * @param position 文档位置（从1开始，1表示第一个文档）
   * @returns 文档ID，如果位置无效则返回边界文档
   * 
   * 边界处理：
   * - position <= 0：返回第一个文档
   * - position > 文档总数：返回最后一个文档
   * - 空笔记本：返回 null
   */
  async getDocumentIdByPosition(notebookId: string, position: number): Promise<string | null> {
    try {
      const docIds = await this.loadDocumentIdList(notebookId);
      if (docIds.length === 0) {
        return null;
      }
      
      // 将位置转换为数组索引（position 从 1 开始，index 从 0 开始）
      // 使用边界限制确保索引在有效范围内 [0, docIds.length - 1]
      const index = Math.max(0, Math.min(position - 1, docIds.length - 1));
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
      // fetchFileTree 返回的文件已按笔记本配置的排序规则排序
      // API 会自动处理各种排序模式（文件名、修改时间、自定义排序等）
      const files = await this.fetchFileTree(notebookId, path);

      for (const file of files) {
        if (!file.id) continue;

        // 按顺序保存文档ID，保持与文档树显示顺序一致
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
      // 重要：不传 sort 参数，让 API 使用笔记本配置的排序规则
      // ListDocTree 会自动读取笔记本的 sortMode 配置
      // 这样可以确保与用户在文档树中看到的顺序完全一致
      // 参考：siyuan/kernel/model/file.go:259-262
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
