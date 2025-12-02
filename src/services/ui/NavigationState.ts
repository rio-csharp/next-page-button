import { INavigationElements } from "./NavigationContainer";

export interface INavigationStateData {
  currentPosition: number;
  totalCount: number;
}

export class NavigationState {
  /**
   * 更新导航状态
   */
  update(elements: INavigationElements, state: INavigationStateData): void {
    const { currentPosition, totalCount } = state;

    // 更新页码指示器
    elements.indicator.textContent = `${currentPosition} / ${totalCount}`;

    // 更新按钮状态
    elements.btnPrev.disabled = currentPosition === 1;
    elements.btnNext.disabled = currentPosition === totalCount;
  }
}
