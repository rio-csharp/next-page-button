import { Plugin, openTab } from "siyuan";

interface DocItem {
  id: string;
  content: string;
  path: string;
}

export default class PageNavPlugin extends Plugin {
  private docs: DocItem[] = [];
  private isLoadingDocs = false; // 防止并发加载
  private readonly DEBUG = false; // 发布时改为 false，开发时改为 true

  private log(...args: any[]) {
    if (this.DEBUG) {
      console.log("[NextPageButton]", ...args);
    }
  }

  private logError(...args: any[]) {
    console.error("[NextPageButton]", ...args);
  }

  private getI18n(key: string): string {
    const value = this.i18n[key];
    if (this.DEBUG) {
      console.log(`[i18n] key: ${key}, value: ${value}, i18n object:`, this.i18n);
    }
    // Provide fallback text if i18n is not loaded
    if (!value) {
      const fallbacks: Record<string, string> = {
        "prevPage": "Previous",
        "nextPage": "Next"
      };
      return fallbacks[key] || key;
    }
    return value;
  }

  async onload() {
    this.log("插件加载中...");
    this.log("i18n 对象:", this.i18n);
    
    await this.loadDocList();
    
    // 加载完成后立即插入按钮
    setTimeout(() => {
      this.insertNavButtons();
    }, 500);

    // 监听文档切换和加载事件
    // 每次切换都重新加载文档列表，确保页码和按钮状态是最新的
    // 这样可以处理文档移动、重命名、排序等所有变更
    const handleDocumentSwitch = async (detail: any) => {
      await this.loadDocList();
      setTimeout(() => this.insertNavButtonsWithProtyle(detail?.protyle), 100);
    };

    this.eventBus.on("loaded-protyle-static", handleDocumentSwitch);
    this.eventBus.on("switch-protyle", handleDocumentSwitch);
    this.eventBus.on("loaded-protyle-dynamic", handleDocumentSwitch);

    // 监听 WebSocket 消息，捕获文档创建、删除、移动等操作
    // 这个主要是为了在不切换文档的情况下，后台有文档变更时也能更新
    this.eventBus.on("ws-main", (detail: any) => {
      const data = detail?.data;
      if (!data || data.cmd !== "transactions") return;
      
      this.log("文档变更事件触发，重新加载文档列表");
      setTimeout(async () => {
        await this.loadDocList();
        this.insertNavButtons();
      }, 500);
    });
  }

  onunload() {
    document.querySelectorAll("#page-nav-plugin-container").forEach(el => el.remove());
  }

  private async loadDocList() {
    // 防止并发加载，避免多个事件同时触发时重复加载
    if (this.isLoadingDocs) {
      this.log("文档列表正在加载中，跳过本次请求");
      return;
    }

    this.isLoadingDocs = true;
    try {
      const notebooksResponse = await fetch("/api/notebook/lsNotebooks", {
        method: "POST"
      });
      const notebooksResult: any = await notebooksResponse.json();
      
      if (notebooksResult.code !== 0 || !notebooksResult.data?.notebooks) {
        this.docs = [];
        return;
      }

      // 使用未公开的 API listDocsByPath 递归获取文档树
      // 这是唯一能获取用户拖拽后正确顺序的方法
      const allDocs: DocItem[] = [];
      for (const notebook of notebooksResult.data.notebooks) {
        if (notebook.closed) continue;
        
        await this.loadDocsFromPath(notebook.id, "/", allDocs);
      }
      
      this.docs = allDocs;
      this.log("已加载文档数量:", this.docs.length);
      this.log("文档顺序:", this.docs.map(d => d.content).join(" → "));
    } catch (e) {
      this.logError("加载文档列表失败:", e);
      this.docs = [];
    } finally {
      this.isLoadingDocs = false;
    }
  }

  /**
   * 递归加载指定路径下的所有文档
   * 注意：使用了 SiYuan 的未公开 API /api/filetree/listDocsByPath
   * 这是唯一能获取用户手动拖拽后正确文档顺序的方法
   */
  private async loadDocsFromPath(notebookId: string, path: string, result: DocItem[]): Promise<void> {
    try {
      const response = await fetch("/api/filetree/listDocsByPath", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebook: notebookId,
          path: path
        })
      });
      const data: any = await response.json();
      
      if (data.code !== 0 || !data.data?.files) {
        return;
      }
      
      // 遍历当前路径下的所有文档
      for (const file of data.data.files) {
        if (file.id && file.name) {
          // 从 name 中去掉 .sy 后缀得到文档标题
          const title = file.name.replace(/\.sy$/, '');
          
          result.push({
            id: file.id,
            content: title,
            path: file.path
          });
          
          // 如果有子文档，递归获取
          if (file.subFileCount > 0) {
            await this.loadDocsFromPath(notebookId, file.path, result);
          }
        }
      }
    } catch (e) {
      this.log("加载路径失败:", path, e);
    }
  }

  private createNavigationContainer(index: number): HTMLDivElement {
    const container = document.createElement("div");
    container.id = "page-nav-plugin-container";
    container.style.cssText = `
      padding: 16px;
      margin-top: 24px;
      border-top: 1px solid var(--b3-theme-surface-lighter);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      background: var(--b3-theme-background);
    `;

    const isFirst = index === 0;
    const isLast = index === this.docs.length - 1;

    const btnPrev = this.createButton(
      `<svg class="b3-button__icon"><use xlink:href="#iconLeft"></use></svg><span>${this.getI18n("prevPage")}</span>`,
      isFirst,
      async () => {
        if (index > 0) {
          await this.navigateToDoc(this.docs[index - 1].id);
        }
      }
    );

    const indicator = document.createElement("span");
    indicator.textContent = `${index + 1} / ${this.docs.length}`;
    indicator.style.cssText = `
      color: var(--b3-theme-on-surface);
      font-size: 13px;
      opacity: 0.7;
      white-space: nowrap;
      user-select: none;
    `;

    const btnNext = this.createButton(
      `<span>${this.getI18n("nextPage")}</span><svg class="b3-button__icon"><use xlink:href="#iconRight"></use></svg>`,
      isLast,
      async () => {
        if (index < this.docs.length - 1) {
          await this.navigateToDoc(this.docs[index + 1].id);
        }
      }
    );

    container.appendChild(btnPrev);
    container.appendChild(indicator);
    container.appendChild(btnNext);

    return container;
  }

  private createButton(innerHTML: string, disabled: boolean, onClick: () => Promise<void>): HTMLButtonElement {
    const button = document.createElement("button");
    button.innerHTML = innerHTML;
    button.className = "b3-button b3-button--outline";
    button.contentEditable = "false";
    button.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-height: 32px;
      opacity: ${disabled ? '0.5' : '1'};
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      user-select: none;
      ${disabled ? 'pointer-events: none;' : ''}
    `;
    
    if (disabled) {
      button.disabled = true;
    } else {
      button.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await onClick();
      };
    }
    
    return button;
  }

  private async navigateToDoc(docId: string) {
    try {
      openTab({ app: this.app, doc: { id: docId } });
    } catch (err) {
      this.logError("打开文档失败:", err);
      await this.loadDocList();
      this.insertNavButtons();
    }
  }

  private insertNavButtonsWithProtyle = async (protyle?: any) => {
    if (!protyle?.block) {
      return this.insertNavButtons();
    }

    const dataNodeId = protyle.block.rootID;
    const protyleElement = protyle.element;
    
    if (!dataNodeId || !protyleElement) {
      this.log("未找到文档块ID或protyle元素");
      return;
    }

    if (!this.docs.length) {
      this.log("文档列表为空");
      return;
    }

    const index = this.docs.findIndex(doc => doc.id === dataNodeId);
    if (index < 0) {
      this.log("当前文档不在列表中:", dataNodeId);
      return;
    }
    
    this.log("找到当前文档:", this.docs[index].content, "索引:", index + 1, "/", this.docs.length);

    protyleElement.querySelectorAll("#page-nav-plugin-container").forEach(el => el.remove());

    const container = this.createNavigationContainer(index);
    const wysiwyg = protyleElement.querySelector(".protyle-wysiwyg");
    if (wysiwyg) {
      wysiwyg.appendChild(container);
      this.log("按钮已插入到文档");
    }
  };

  private insertNavButtons = async () => {
    document.querySelectorAll("#page-nav-plugin-container").forEach(el => el.remove());

    const protyleTitle = document.querySelector(".protyle:not(.fn__none) .protyle-title");
    const protyleContent = document.querySelector(".protyle:not(.fn__none) .protyle-content");
    
    const dataNodeId = protyleTitle?.getAttribute("data-node-id") 
      || protyleContent?.getAttribute("data-node-id");
    
    const protyleWysiwyg = (protyleTitle || protyleContent)
      ?.closest(".protyle")
      ?.querySelector(".protyle-wysiwyg");
    
    if (!dataNodeId || !protyleWysiwyg) {
      this.log("降级方法：未找到文档ID或编辑器容器");
      return;
    }

    if (!this.docs.length) {
      this.log("文档列表为空");
      return;
    }

    const index = this.docs.findIndex(doc => doc.id === dataNodeId);
    if (index < 0) {
      this.log("当前文档不在列表中:", dataNodeId);
      return;
    }
    
    this.log("降级方法找到文档，索引:", index + 1, "/", this.docs.length);

    const container = this.createNavigationContainer(index);
    protyleWysiwyg.appendChild(container);
    this.log("按钮已插入（降级方法）");
  };
}
