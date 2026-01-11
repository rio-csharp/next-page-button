<script lang="ts">
  export let currentPosition: number;
  export let totalCount: number;
  export let i18n: (key: string) => string;
  export let onPrev: () => void;
  export let onNext: () => void;

  $: isFirstPage = currentPosition <= 1;
  $: isLastPage = currentPosition >= totalCount;
</script>

<div id="page-nav-side-container" class="page-nav-side-container">
  <button
    class="page-nav-side-button page-nav-side-button--prev"
    class:hidden={isFirstPage}
    on:click|preventDefault|stopPropagation={onPrev}
    title={i18n("prevPage")}
    aria-label={i18n("prevPage")}
  >
    <svg class="b3-button__icon"><use xlink:href="#iconLeft"></use></svg>
  </button>

  <button
    class="page-nav-side-button page-nav-side-button--next"
    class:hidden={isLastPage}
    on:click|preventDefault|stopPropagation={onNext}
    title={i18n("nextPage")}
    aria-label={i18n("nextPage")}
  >
    <svg class="b3-button__icon"><use xlink:href="#iconRight"></use></svg>
  </button>
</div>

<style lang="scss">
  .page-nav-side-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 10; // 确保在编辑器内容之上但可能在某些浮窗之下
  }

  .page-nav-side-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 64px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-surface-lighter);
    box-shadow: var(--b3-dialog-shadow);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    pointer-events: auto;
    opacity: 0.2;
    transition: opacity 0.2s, transform 0.2s, background-color 0.2s;
    border-radius: 4px;
    color: var(--b3-theme-on-surface);

    &:hover {
      opacity: 0.9;
      background-color: var(--b3-theme-primary-lighter);
      color: var(--b3-theme-primary);
    }

    &.hidden {
      display: none;
    }

    svg {
      width: 24px;
      height: 24px;
    }

    &--prev {
      left: 0px;
      border-left: none;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    &--next {
      right: 0px;
      border-right: none;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
</style>
