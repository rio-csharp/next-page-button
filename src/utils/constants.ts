/**
 * 常量定义
 */

export const CONTAINER_ID = "page-nav-plugin-container";
export const CUSTOM_FULLWIDTH_ATTR = "custom-sy-fullwidth";
export const MAX_RECURSION_DEPTH = 50;
export const FETCH_TIMEOUT = 10000;
export const KEYBOARD_THRESHOLD = 150;

/**
 * 插件设置接口
 */
export interface IPluginSettings {
  marginTop: string;
  marginBottom: string;
}

/**
 * 默认设置
 */
export const DEFAULT_SETTINGS: IPluginSettings = {
  marginTop: "0",
  marginBottom: "0",
};

/**
 * 调试选项
 * 设置为 true 以在控制台输出详细日志，用于开发调试
 * 发布版本应设置为 false
 */
export const DEBUG_MODE = false;

/**
 * CSS类名常量
 */
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

/**
 * SVG图标ID
 */
export const ICONS = {
  left: "#iconLeft",
  right: "#iconRight"
} as const;

/**
 * API端点
 */
export const API_ENDPOINTS = {
  listDocsByPath: "/api/filetree/listDocsByPath"
} as const;
