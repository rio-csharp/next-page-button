import { Plugin } from "siyuan";
import "./index.scss";
import { isMobile } from "./utils/platformUtils";
import { infoLog, errorLog } from "./utils/logger";
import { DocumentService } from "./services/DocumentService";
import { KeyboardDetectionService } from "./services/KeyboardDetectionService";
import { NavigationService } from "./services/NavigationService";
import { UIRenderService } from "./services/ui/UIRenderService";
import { SettingService } from "./services/SettingService";

export default class PageNavPlugin extends Plugin {
  private documentService!: DocumentService;
  private navigationService!: NavigationService;
  private uiRenderService!: UIRenderService;
  private settingService!: SettingService;
  private keyboardDetectionService?: KeyboardDetectionService;

  async onload() {
    try {
      // 1. 初始化设置服务
      this.settingService = new SettingService(this);
      await this.settingService.load();

      // 2. 初始化核心服务
      this.initializeServices();
      
      // 3. 初始化设置菜单
      this.settingService.init(async () => {
        // 传入 true 强制重绘组件，确保语言切换立即生效
        await this.uiRenderService.renderNavigationButtons(true);
      });

      // 4. 执行初始渲染
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
      (key: string) => this.settingService.getI18nValue(key),
      () => this.settingService.getSettings()
    );

    if (isMobile()) {
      this.keyboardDetectionService = new KeyboardDetectionService();
    }
  }

  private registerEventListeners(): void {
    this.eventBus.on("switch-protyle", this.handleDocumentSwitch);
    this.eventBus.on("loaded-protyle-static", this.handleDocumentSwitch);
  }

  private unregisterEventListeners(): void {
    this.eventBus.off("switch-protyle", this.handleDocumentSwitch);
    this.eventBus.off("loaded-protyle-static", this.handleDocumentSwitch);
  }

  private handleDocumentSwitch = async () => {
    try {
      await this.uiRenderService.renderNavigationButtons();
    } catch (err) {
      errorLog("NextPageButton", "Document switch handling error:", err);
    }
  };
}
