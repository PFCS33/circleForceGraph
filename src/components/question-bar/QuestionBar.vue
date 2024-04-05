<template>
  <div class="qbar-container">
    <div class="qbar">
      <el-input
        v-model="content"
        class="chat-input"
        :autosize="{ maxRows: 6 }"
        type="textarea"
        placeholder="Please input"
      >
      </el-input>
      <SvgIcon
        iconName="send"
        class="icon send"
        @click="sendQuestion"
      ></SvgIcon>
    </div>
    <SvgIcon iconName="close" class="icon close" @click="closeBar"> </SvgIcon>
  </div>
</template>
<script setup>
import { ref } from "vue";
import SvgIcon from "../ui/SvgIcon.vue";

/* -------------------------------------------------------------------------- */
// emit
/* -------------------------------------------------------------------------- */
const emit = defineEmits(["close", "query"]);
const closeBar = () => {
  emit("close", null);
};
/* -------------------------------------------------------------------------- */
// question content
/* -------------------------------------------------------------------------- */
const { queryId } = defineProps({
  queryId: Number,
});
const content = ref(null);
const sendQuestion = () => {
  emit("query", {
    id: queryId,
    content: content.value,
  });
  // reset content
  content.value = null;
};
</script>

<style lang="scss" scoped>
.qbar-container {
  width: 100%;
  z-index: $z-middle;
  position: absolute;

  @include flex-box();
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 1rem;
  gap: 1rem;

  .qbar {
    width: 60%;
    border: $border;
    border-color: $border-color-text;
    border-radius: 2rem;
    background-color: #fff;
    position: relative;
    padding: 0.7rem;

    .icon.send {
      position: absolute;
      bottom: 0.5rem;
      right: 1.2rem;
    }
  }
  .icon {
    @include icon-style($icon-size-large);
    background-color: transparent !important;
    &.close {
      margin-bottom: 0.5rem;
    }
    &:hover {
      fill: $primary-color-dark;
      background-color: #fff;
    }
  }
}
</style>

<style lang="scss">
.chat-input {
  position: relative;
  bottom: 0;
  .el-textarea__inner {
    @include fancier-scroll-bar();
    // width: 100%;
    padding-right: $icon-size-large + 0.5rem;
    border: none;
    box-shadow: none;
    background-color: transparent;
    resize: none;
  }
}
</style>
