import { CONTAINER_ID, CSS_CLASSES } from "../../utils/constants";
import { debugLog } from "../../utils/logger";

export interface INavigationElements {
  container: HTMLDivElement;
  btnPrev: HTMLButtonElement;
  btnNext: HTMLButtonElement;
  indicator: HTMLSpanElement;
}

export class NavigationContainer {
  private elements: INavigationElements | null = null;
  private prevClickHandler: EventListener | null = null;
  private nextClickHandler: EventListener | null = null;

  /**
   * 创建导航容器并挂载到目标元素
   */
  create(
    protyleElement: HTMLElement,
    i18n: (key: string) => string,
    onPrev: EventListener,
    onNext: EventListener
  ): INavigationElements {
    // 清理旧容器
    this.destroy();

    // 保存事件处理器引用
    this.prevClickHandler = onPrev;
    this.nextClickHandler = onNext;

    // 创建容器
    const container = document.createElement("div");
    container.id = CONTAINER_ID;

    // 创建按钮和指示器
    const btnPrev = this.createNavigationButton(
      i18n("prevPage"),
      "#iconLeft",
      "left",
      this.prevClickHandler
    );
    const indicator = this.createPageIndicator();
    const btnNext = this.createNavigationButton(
      i18n("nextPage"),
      "#iconRight",
      "right",
      this.nextClickHandler
    );

    container.append(btnPrev, indicator, btnNext);
    protyleElement.appendChild(container);

    this.elements = { container, btnPrev, btnNext, indicator };
    debugLog("NavigationContainer", "Container created");

    return this.elements;
  }

  /**
   * 获取当前元素
   */
  getElements(): INavigationElements | null {
    return this.elements;
  }

  /**
   * 显示/隐藏容器
   */
  setVisibility(show: boolean): void {
    if (this.elements) {
      this.elements.container.style.display = show ? "flex" : "none";
    }
  }

  /**
   * 检查容器是否需要重建
   */
  needsRecreate(protyleElement: HTMLElement): boolean {
    return (
      !this.elements ||
      !this.elements.container.parentNode ||
      this.elements.container.parentNode !== protyleElement
    );
  }

  /**
   * 销毁容器
   */
  destroy(): void {
    if (!this.elements) return;

    // 移除事件监听器
    if (this.prevClickHandler) {
      this.elements.btnPrev.removeEventListener("click", this.prevClickHandler);
    }
    if (this.nextClickHandler) {
      this.elements.btnNext.removeEventListener("click", this.nextClickHandler);
    }

    // 移除DOM
    this.elements.container.remove();

    // 清空引用
    this.elements = null;
    this.prevClickHandler = null;
    this.nextClickHandler = null;

    debugLog("NavigationContainer", "Container destroyed");
  }

  /**
   * 创建导航按钮
   */
  private createNavigationButton(
    text: string,
    iconHref: string,
    iconPosition: "left" | "right",
    onClick: EventListener
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = `${CSS_CLASSES.b3Button} ${CSS_CLASSES.b3ButtonOutline} ${CSS_CLASSES.button}`;
    button.contentEditable = "false";
    button.type = "button";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", CSS_CLASSES.b3ButtonIcon);
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", iconHref);
    svg.appendChild(use);

    const span = document.createElement("span");
    span.textContent = text;

    if (iconPosition === "left") {
      button.appendChild(svg);
      button.appendChild(span);
    } else {
      button.appendChild(span);
      button.appendChild(svg);
    }

    button.addEventListener("click", onClick);
    return button;
  }

  /**
   * 创建页码指示器
   */
  private createPageIndicator(): HTMLSpanElement {
    const indicator = document.createElement("span");
    indicator.className = CSS_CLASSES.indicator;
    indicator.contentEditable = "false";
    return indicator;
  }
}
