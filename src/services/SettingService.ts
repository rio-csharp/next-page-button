import { Plugin, Setting } from "siyuan";
import { DEFAULT_SETTINGS, IPluginSettings } from "../utils/constants";
import { errorLog } from "../utils/logger";
import { ISettingService } from "./ISettingService";

export class SettingService implements ISettingService {
  private settings: IPluginSettings = DEFAULT_SETTINGS;
  private manualI18n: any = null;
  private onUpdateCallback: () => Promise<void> = null;

  constructor(private plugin: Plugin) {}

  async load() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.plugin.loadData("settings.json")
    );

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
    this.addMarginItem("marginTopTitle", "marginTopDesc", "marginTop");
    this.addMarginItem("marginBottomTitle", "marginBottomDesc", "marginBottom");
  }

  private createSelect(options: { value: string, text: string }[], currentValue: string, onChange: (value: string) => void) {
    const select = document.createElement("select");
    select.className = "b3-select fn__size-200";
    options.forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.text = opt.text;
      if (currentValue === opt.value) o.selected = true;
      select.appendChild(o);
    });
    select.onchange = () => onChange(select.value);
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
        ], this.settings.language, (val) => { this.settings.language = val; });
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
        ], this.settings.layoutMode, (val) => { this.settings.layoutMode = val as any; });
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
        
        const input = document.createElement("input");
        input.className = "b3-text-field fn__size-60"; 
        input.type = "number";
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
        return container;
      }
    });
  }

  private async loadLanguageData(lang: string) {
    try {
      const response = await fetch(`/plugins/next-page-button/i18n/${lang}.yaml`);
      const text = await response.text();
      const data: any = {};
      
      // Basic robust YAML parser
      text.split(/\r?\n/).forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          if (key) {
            // Remove quotes if present
            data[key] = value.replace(/^["'](.*)["']$/, '$1');
          }
        }
      });
      this.manualI18n = data;
    } catch (e) {
      errorLog("NextPageButton", `Failed to load language: ${lang}`, e);
    }
  }
}
