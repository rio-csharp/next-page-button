import { Plugin, Setting } from "siyuan";
import { DEFAULT_SETTINGS } from "../utils/constants";
import type { IPluginSettings, LanguageMode, LayoutMode } from "../utils/constants";
import { errorLog } from "../utils/logger";
import type { ISettingService } from "./ISettingService";

export class SettingService implements ISettingService {
  private settings: IPluginSettings = DEFAULT_SETTINGS;
  private manualI18n: Record<string, string> | null = null;
  private onUpdateCallback: (() => Promise<void>) | null = null;
  private marginActionElements = new Set<HTMLElement>();

  constructor(private plugin: Plugin) {}

  async load() {
    const savedSettings = await this.plugin.loadData("settings.json") as Partial<IPluginSettings> | null;
    this.settings = this.normalizeSettings(savedSettings);

    if (this.settings.language !== "auto") {
      await this.loadLanguageData(this.settings.language);
    }
  }

  getSettings(): IPluginSettings {
    return this.settings;
  }

  getI18nValue(key: string): string {
    const targetI18n = this.manualI18n || this.plugin.i18n;
    if (!targetI18n) return key;
    return targetI18n[key] || key;
  }

  init(onUpdate: () => Promise<void>) {
    this.onUpdateCallback = onUpdate;
    this.rebuildSetting();
  }

  /**
   * Builds or rebuilds the setting interface to respond to language changes.
   */
  private rebuildSetting() {
    this.marginActionElements.clear();

    this.plugin.setting = new Setting({
      confirmCallback: async () => {
        if (this.settings.language !== "auto") {
          await this.loadLanguageData(this.settings.language);
        } else {
          this.manualI18n = null; // Clear manual i18n when switching back to auto
        }
        
        await this.plugin.saveData("settings.json", this.settings);
        
        // Rebuild settings items so that the next time the dialog opens, it uses the new language
        this.rebuildSetting();
        
        if (this.onUpdateCallback) {
          await this.onUpdateCallback();
        }
      }
    });

    this.addLanguageItem();
    this.addLayoutModeItem();
    this.addCloseCurrentTabItem();
    this.addMarginItem("marginTopTitle", "marginTopDesc", "marginTop");
    this.addMarginItem("marginBottomTitle", "marginBottomDesc", "marginBottom");
  }

  private createSelect<T extends string>(
    options: { value: T, text: string }[],
    currentValue: T,
    onChange: (value: T) => void
  ): HTMLSelectElement {
    const select = document.createElement("select");
    select.className = "b3-select fn__size-200";
    options.forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.text = opt.text;
      if (currentValue === opt.value) o.selected = true;
      select.appendChild(o);
    });
    select.onchange = () => onChange(select.value as T);
    return select;
  }

  private addLanguageItem() {
    this.plugin.setting.addItem({
      title: this.getI18nValue("languageTitle"),
      description: this.getI18nValue("languageDesc"),
      createActionElement: () => {
        return this.createSelect([
          { value: "auto", text: this.getI18nValue("languageAuto") },
          { value: "zh_CN", text: this.getI18nValue("languageZH") },
          { value: "en_US", text: this.getI18nValue("languageEN") }
        ], this.settings.language, (val: LanguageMode) => { this.settings.language = val; });
      }
    });
  }

  private addLayoutModeItem() {
    this.plugin.setting.addItem({
      title: this.getI18nValue("layoutModeTitle"),
      description: this.getI18nValue("layoutModeDesc"),
      createActionElement: () => {
        return this.createSelect([
          { value: "bottom", text: this.getI18nValue("layoutModeBottom") },
          { value: "side", text: this.getI18nValue("layoutModeSide") }
        ], this.settings.layoutMode, (val: LayoutMode) => {
          this.settings.layoutMode = val;
          this.updateMarginItemsVisibility();
        });
      }
    });
  }

  private addCloseCurrentTabItem() {
    this.plugin.setting.addItem({
      title: this.getI18nValue("closeCurrentTabTitle"),
      description: this.getI18nValue("closeCurrentTabDesc"),
      createActionElement: () => {
        const input = document.createElement("input");
        input.className = "b3-switch fn__flex-center";
        input.type = "checkbox";
        input.checked = this.settings.closeCurrentTab;
        input.onchange = () => {
          this.settings.closeCurrentTab = input.checked;
        };
        return input;
      }
    });
  }

  private addMarginItem(titleKey: string, descKey: string, settingKey: 'marginTop' | 'marginBottom') {
    this.plugin.setting.addItem({
      title: this.getI18nValue(titleKey),
      description: this.getI18nValue(descKey),
      createActionElement: () => {
        const container = document.createElement("div");
        container.className = "fn__flex fn__flex-center";
        container.dataset.pageNavMarginItem = settingKey;
        this.marginActionElements.add(container);
        
        const input = document.createElement("input");
        input.className = "b3-text-field fn__size-60"; 
        input.type = "number";
        input.min = "0";
        input.style.height = "28px";
        input.style.padding = "4px 8px";
        input.style.textAlign = "right";
        input.value = this.settings[settingKey] || "0";
        input.oninput = () => {
          this.settings[settingKey] = input.value;
        };
        
        const label = document.createElement("span");
        label.innerText = "px";
        label.className = "fn__space-left";
        label.style.whiteSpace = "nowrap";
        
        container.appendChild(input);
        container.appendChild(label);

        window.setTimeout(() => this.updateMarginItemsVisibility());
        return container;
      }
    });
  }

  private updateMarginItemsVisibility(): void {
    for (const element of this.marginActionElements) {
      const settingRow = element.closest(".b3-label") as HTMLElement | null;
      if (settingRow) {
        settingRow.style.display = this.settings.layoutMode === "bottom" ? "" : "none";
      }
    }
  }

  private async loadLanguageData(lang: LanguageMode) {
    if (lang === "auto") {
      this.manualI18n = null;
      return;
    }

    try {
      const response = await fetch(`/plugins/next-page-button/i18n/${lang}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.manualI18n = await response.json();
    } catch (e) {
      errorLog("NextPageButton", `Failed to load language: ${lang}`, e);
    }
  }

  private normalizeSettings(savedSettings: Partial<IPluginSettings> | null): IPluginSettings {
    const language = savedSettings?.language;
    const layoutMode = savedSettings?.layoutMode;

    return {
      marginTop: this.normalizePixelValue(savedSettings?.marginTop),
      marginBottom: this.normalizePixelValue(savedSettings?.marginBottom),
      language: language === "zh_CN" || language === "en_US" ? language : DEFAULT_SETTINGS.language,
      layoutMode: layoutMode === "side" || layoutMode === "bottom" ? layoutMode : DEFAULT_SETTINGS.layoutMode,
      closeCurrentTab: savedSettings?.closeCurrentTab === true
    };
  }

  private normalizePixelValue(value: unknown): string {
    const numericValue = Number(value ?? 0);
    return Number.isFinite(numericValue) ? String(Math.max(0, numericValue)) : "0";
  }
}
