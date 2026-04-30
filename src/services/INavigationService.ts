import type { Tab } from "siyuan";

export interface NavigateOptions {
  closeCurrentTab?: boolean;
  sourceTab?: Tab | null;
}

export interface INavigationService {
  navigateToDocument(docId: string, options?: NavigateOptions): Promise<void>;
}
