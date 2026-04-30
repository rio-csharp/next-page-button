export const MAX_RECURSION_DEPTH = 50;
export const FETCH_TIMEOUT = 10000;

export type LayoutMode = "bottom" | "side";
export type LanguageMode = "auto" | "zh_CN" | "en_US";

export interface IPluginSettings {
  marginTop: string;
  marginBottom: string;
  language: LanguageMode;
  layoutMode: LayoutMode;
}

export const DEFAULT_SETTINGS: IPluginSettings = {
  marginTop: "0",
  marginBottom: "0",
  language: "auto",
  layoutMode: "bottom",
};

export const DEBUG_MODE = false;

export const API_ENDPOINTS = {
  getBlockInfo: "/api/block/getBlockInfo",
  listDocsByPath: "/api/filetree/listDocsByPath"
} as const;
