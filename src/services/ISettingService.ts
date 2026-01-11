export interface ISettingService {
  load(): Promise<void>;
  init(onUpdate: () => Promise<void>): void;
  getSettings(): import("../utils/constants").IPluginSettings;
  getI18nValue(key: string): string;
}
