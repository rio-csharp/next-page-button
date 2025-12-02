import { Plugin } from "siyuan";
import "./index.scss";
import { isMobile } from "./utils/platformUtils";
import { infoLog, errorLog } from "./utils/logger";
import { DocumentService } from "./services/DocumentService";
import { KeyboardDetectionService } from "./services/KeyboardDetectionService";
import { NavigationService } from "./services/NavigationService";
import { UIRenderService } from "./services/UIRenderService";

export default class PageNavPlugin extends Plugin {
  private documentService!: DocumentService;
  private navigationService!: NavigationService;
  private uiRenderService!: UIRenderService;
  private keyboardDetectionService?: KeyboardDetectionService;

  private getI18n(key: string): string {
    // 防御性检查：确保 i18n 对象存在
    if (!this.i18n) {
      errorLog("NextPageButton", "i18n object not initialized");
      return key;
    }
    return this.i18n[key] || key;
  }
  async onload() {
    try {
      this.initializeServices();

      await this.uiRenderService.renderNavigationButtons();

      this.registerEventListeners();

      if (isMobile() && this.keyboardDetectionService) {
        this.keyboardDetectionService.start((keyboardVisible: boolean) => {
          this.uiRenderService.toggleVisibility(!keyboardVisible);
        });
      }

      infoLog("NextPageButton", "Plugin loaded successfully");
    } catch (err) {
      errorLog("NextPageButton", "Plugin load failed:", err);
    }
  }

  onunload() {
    try {
      this.unregisterEventListeners();

      if (this.keyboardDetectionService) {
        this.keyboardDetectionService.stop();
      }

      this.uiRenderService.cleanup();

      infoLog("NextPageButton", "Plugin unloaded successfully");
    } catch (err) {
      errorLog("NextPageButton", "Plugin unload failed:", err);
    }
  }

  private initializeServices(): void {
    this.documentService = new DocumentService();

    this.navigationService = new NavigationService(this.app);

    this.uiRenderService = new UIRenderService(
      this.documentService,
      this.navigationService,
      (key: string) => this.getI18n(key)
    );

    if (isMobile()) {
      this.keyboardDetectionService = new KeyboardDetectionService();
    }
  }

  private registerEventListeners(): void {
    // 文档切换事件 - 用户切换到不同的文档时触发
    this.eventBus.on("switch-protyle", this.handleDocumentSwitch);
    
    // 编辑器加载完成事件 - 静态编辑器加载完成时触发（例如打开只读文档）
    this.eventBus.on("loaded-protyle-static", this.handleDocumentSwitch);
  }

  private unregisterEventListeners(): void {
    this.eventBus.off("switch-protyle", this.handleDocumentSwitch);
    this.eventBus.off("loaded-protyle-static", this.handleDocumentSwitch);
  }

  // 文档切换处理：重新渲染导航按钮
  // 使用箭头函数确保 this 上下文正确绑定，避免在事件回调中 this 指向错误
  private handleDocumentSwitch = async () => {
    try {
      await this.uiRenderService.renderNavigationButtons();
    } catch (err) {
      // UIRenderService 内部已有错误处理，这里只是额外的保护层
      errorLog("NextPageButton", "Document switch handling error:", err);
    }
  };
}
