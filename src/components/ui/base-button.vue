<template>
  <button :class="['base', type]">
    <slot></slot>
  </button>
</template>

<script setup>
import { defineComponent } from "vue";
const props = defineProps({
  type: String,
});
defineComponent({
  name: "BaseButton",
});
</script>

<style lang="scss" scoped>
.base {
  height: 32px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  text-align: center;
  cursor: pointer;
  user-select: none;
  padding: 8px 15px;
  font-size: 14px;
  font-weight: 500;
  // border: 1px solid;
  // border-color: $primary-color-light;
  border: none;
  border-radius: 4px;
  background-color: $primary-color-light;
  color: $background-color;
  transition: background-color 0.2s ease-out;
  &:hover {
    background-color: adjust-color(
      $color: $primary-color-light,
      $lightness: 10%
    );
  }
  &:active {
    background-color: $primary-color;
  }
}

.outline {
  border: 1px solid $primary-color;
  color: $primary-color;
  background-color: rgba($primary-color-light, 0.05);
  &:hover {
    color: #fff;
    background-color: $primary-color;
  }
}
</style>
