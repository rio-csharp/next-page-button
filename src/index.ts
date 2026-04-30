import { Plugin } from "siyuan";
import type { IProtyle } from "siyuan";
import "./index.scss";
import { infoLog, errorLog } from "./utils/logger";
import { DocumentService } from "./services/DocumentService";
import type { IDocumentService } from "./services/DocumentService";
import { NavigationService } from "./services/NavigationService";
import type { INavigationService } from "./services/INavigationService";
import { UIRenderService } from "./services/ui/UIRenderService";
import type { IUIRenderService } from "./services/ui/UIRenderService";
import { SettingService } from "./services/SettingService";
import type { ISettingService } from "./services/ISettingService";

export default class PageNavPlugin extends Plugin {
  private documentService!: IDocumentService;
  private navigationService!: INavigationService;
  private uiRenderService!: IUIRenderService;
  private settingService!: ISettingService;

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

      infoLog("NextPageButton", "Plugin loaded successfully");
    } catch (err) {
      errorLog("NextPageButton", "Plugin load failed:", err);
    }
  }

  onunload() {
    try {
      this.unregisterEventListeners();

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
  }

  private registerEventListeners(): void {
    this.eventBus.on("switch-protyle", this.handleDocumentSwitch);
    this.eventBus.on("loaded-protyle-static", this.handleDocumentSwitch);
    this.eventBus.on("destroy-protyle", this.handleProtyleDestroy);
    this.eventBus.on("mobile-keyboard-show", this.handleMobileKeyboardShow);
    this.eventBus.on("mobile-keyboard-hide", this.handleMobileKeyboardHide);
  }

  private unregisterEventListeners(): void {
    this.eventBus.off("switch-protyle", this.handleDocumentSwitch);
    this.eventBus.off("loaded-protyle-static", this.handleDocumentSwitch);
    this.eventBus.off("destroy-protyle", this.handleProtyleDestroy);
    this.eventBus.off("mobile-keyboard-show", this.handleMobileKeyboardShow);
    this.eventBus.off("mobile-keyboard-hide", this.handleMobileKeyboardHide);
  }

  private handleDocumentSwitch = async (event?: CustomEvent<{ protyle: IProtyle }>) => {
    try {
      await this.uiRenderService.renderNavigationButtons(false, event?.detail?.protyle);
    } catch (err) {
      errorLog("NextPageButton", "Document switch handling error:", err);
    }
  };

  private handleProtyleDestroy = (event: CustomEvent<{ protyle: IProtyle }>) => {
    this.uiRenderService.cleanupProtyle(event.detail.protyle);
  };

  private handleMobileKeyboardShow = () => {
    this.uiRenderService.toggleVisibility(false);
  };

  private handleMobileKeyboardHide = () => {
    this.uiRenderService.toggleVisibility(true);
  };
}
