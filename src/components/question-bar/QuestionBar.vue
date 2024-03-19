<template>
  <div class="qbar-container">
    <div class="qbar"></div>
  </div>
</template>
<script setup></script>

<style lang="scss" scoped>
.qbar-container {
  // border: $border;
  // height: 5rem;
  width: 100%;
  z-index: $z-middle;

  @include flex-box();
  justify-content: center;

  .qbar {
    height: 5rem;
    width: 60%;
    border: $border;
    background-color: #fff;
  }
}
</style>
