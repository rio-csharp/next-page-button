<script lang="ts">
  export let currentPosition: number;
  export let totalCount: number;
  export let i18n: (key: string) => string;
  export let onPrev: () => void;
  export let onNext: () => void;

  $: isFirstPage = currentPosition <= 1;
  $: isLastPage = currentPosition >= totalCount;
</script>

<div id="page-nav-plugin-container" class="page-nav-plugin-container">
  <button
    class="page-nav-button page-nav-button--prev b3-button b3-button--outline"
    disabled={isFirstPage}
    on:click|preventDefault|stopPropagation={onPrev}
    aria-label={i18n("prevPage")}
  >
    <svg class="b3-button__icon"><use xlink:href="#iconLeft"></use></svg>
    {i18n("prevPage")}
  </button>

  <span class="page-nav-indicator">
    {currentPosition} / {totalCount}
  </span>

  <button
    class="page-nav-button page-nav-button--next b3-button b3-button--outline"
    disabled={isLastPage}
    on:click|preventDefault|stopPropagation={onNext}
    aria-label={i18n("nextPage")}
  >
    {i18n("nextPage")}
    <svg class="b3-button__icon"><use xlink:href="#iconRight"></use></svg>
  </button>
</div>

<style lang="scss">
  // 样式保持在 index.scss 中或迁移至此均可
  // 建议保留在 index.scss 以维持全局一致性，或在这里写组件特定样式
</style>
