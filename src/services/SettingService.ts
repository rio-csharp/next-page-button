import { Plugin, Setting } from "siyuan";
import { DEFAULT_SETTINGS, IPluginSettings } from "../utils/constants";
import { errorLog } from "../utils/logger";

export class SettingService {
  private settings: IPluginSettings = DEFAULT_SETTINGS;
  private manualI18n: any = null;

  constructor(private plugin: Plugin) {}

  /**
   * 加载设置并初始化语言
   */
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

  /**
   * 获取翻译文字
   */
  getI18nValue(key: string): string {
    const targetI18n = this.manualI18n || this.plugin.i18n;
    if (!targetI18n) return key;
    return targetI18n[key] || key;
  }

  /**
   * 初始化思源设置菜单
   */
  init(onUpdate: () => Promise<void>) {
    this.plugin.setting = new Setting({
      confirmCallback: async () => {
        // 保存前处理语言逻辑
        if (this.settings.language !== "auto") {
          await this.loadLanguageData(this.settings.language);
        } else {
          this.manualI18n = null; // 切换回自动则清空手动语言包
        }
        
        await this.plugin.saveData("settings.json", this.settings);
        await onUpdate();
      }
    });

    this.addLanguageItem();
    this.addLayoutModeItem();
    this.addMarginItem("marginTopTitle", "marginTopDesc", "marginTop");
    this.addMarginItem("marginBottomTitle", "marginBottomDesc", "marginBottom");
  }

  private addLanguageItem() {
    this.plugin.setting.addItem({
      title: this.getI18nValue("languageTitle"),
      description: this.getI18nValue("languageDesc"),
      createActionElement: () => {
        const select = document.createElement("select");
        select.className = "b3-select fn__size-200";
        
        const options = [
          { value: "auto", text: this.getI18nValue("languageAuto") },
          { value: "zh_CN", text: this.getI18nValue("languageZH") },
          { value: "en_US", text: this.getI18nValue("languageEN") }
        ];
        
        options.forEach(opt => {
          const o = document.createElement("option");
          o.value = opt.value;
          o.text = opt.text;
          if (this.settings.language === opt.value) o.selected = true;
          select.appendChild(o);
        });
        
        select.onchange = () => {
          this.settings.language = select.value;
        };
        
        return select;
      }
    });
  }

  private addLayoutModeItem() {
    this.plugin.setting.addItem({
      title: this.getI18nValue("layoutModeTitle"),
      description: this.getI18nValue("layoutModeDesc"),
      createActionElement: () => {
        const select = document.createElement("select");
        select.className = "b3-select fn__size-200";

        const options = [
          { value: "bottom", text: this.getI18nValue("layoutModeBottom") },
          { value: "side", text: this.getI18nValue("layoutModeSide") }
        ];

        options.forEach(opt => {
          const o = document.createElement("option");
          o.value = opt.value;
          o.text = opt.text;
          if (this.settings.layoutMode === opt.value) o.selected = true;
          select.appendChild(o);
        });

        select.onchange = () => {
          this.settings.layoutMode = select.value as any;
        };

        return select;
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
      text.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          data[parts[0].trim()] = parts.slice(1).join(':').trim();
        }
      });
      this.manualI18n = data;
    } catch (e) {
      errorLog("NextPageButton", `Failed to load language: ${lang}`, e);
    }
  }
}
