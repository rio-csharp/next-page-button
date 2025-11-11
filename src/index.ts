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
    // 文档切换事件
    this.eventBus.on("switch-protyle", this.handleDocumentSwitch);
    
    // 编辑器加载完成事件
    this.eventBus.on("loaded-protyle-static", this.handleDocumentSwitch);
  }

  private unregisterEventListeners(): void {
    this.eventBus.off("switch-protyle", this.handleDocumentSwitch);
    this.eventBus.off("loaded-protyle-static", this.handleDocumentSwitch);
  }

  // 文档切换处理：重新渲染导航按钮
  private handleDocumentSwitch = async () => {
    await this.uiRenderService.renderNavigationButtons();
  };
}
