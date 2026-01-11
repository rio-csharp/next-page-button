export const CONTAINER_ID = "page-nav-plugin-container";
export const CUSTOM_FULLWIDTH_ATTR = "custom-sy-fullwidth";
export const MAX_RECURSION_DEPTH = 50;
export const FETCH_TIMEOUT = 10000;
export const KEYBOARD_THRESHOLD = 150;

export type LayoutMode = "bottom" | "side";

export interface IPluginSettings {
  marginTop: string;
  marginBottom: string;
  language: string;
  layoutMode: LayoutMode;
}

export const DEFAULT_SETTINGS: IPluginSettings = {
  marginTop: "0",
  marginBottom: "0",
  language: "auto",
  layoutMode: "bottom",
};

/**
 * Debug options
 * Set to true to output detailed logs to the console for development.
 * Should be set to false for production releases.
 */
export const DEBUG_MODE = false;

export const CSS_CLASSES = {
  container: "page-nav-plugin-container",
  indicator: "page-nav-indicator",
  button: "page-nav-button",
  buttonPrev: "page-nav-button--prev",
  buttonNext: "page-nav-button--next",
  b3Button: "b3-button",
  b3ButtonOutline: "b3-button--outline",
  b3ButtonIcon: "b3-button__icon"
} as const;

export const ICONS = {
  left: "#iconLeft",
  right: "#iconRight"
} as const;

export const API_ENDPOINTS = {
  listDocsByPath: "/api/filetree/listDocsByPath"
} as const;
