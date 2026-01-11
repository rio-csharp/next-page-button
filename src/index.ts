import { Plugin } from "siyuan";
import "./index.scss";
import { isMobile } from "./utils/platformUtils";
import { infoLog, errorLog } from "./utils/logger";
import { DocumentService, IDocumentService } from "./services/DocumentService";
import { KeyboardDetectionService, IKeyboardDetectionService } from "./services/KeyboardDetectionService";
import { NavigationService } from "./services/NavigationService";
import { INavigationService } from "./services/INavigationService";
import { UIRenderService, IUIRenderService } from "./services/ui/UIRenderService";
import { SettingService } from "./services/SettingService";
import { ISettingService } from "./services/ISettingService";

export default class PageNavPlugin extends Plugin {
  private documentService!: IDocumentService;
  private navigationService!: INavigationService;
  private uiRenderService!: IUIRenderService;
  private settingService!: ISettingService;
  private keyboardDetectionService?: IKeyboardDetectionService;

  async onload() {
    try {
      this.settingService = new SettingService(this);
      await this.settingService.load();

      this.initializeServices();
      
      this.settingService.init(async () => {
        // Redraw component to apply setting changes (like language or layout) immediately
        await this.uiRenderService.renderNavigationButtons(true);
      });

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
