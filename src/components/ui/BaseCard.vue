<template>
  <div :class="mode">
    <slot></slot>
  </div>
</template>

<script>
export default {
  props: {
    mode: {
      type: String,
      required: false,
      default: "card",
    },
  },
};
</script>

<style scoped>
.card {
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
}

.flat {
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}
</style>
