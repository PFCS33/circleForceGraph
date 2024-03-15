<template>
  <div
    class="panel-container"
    v-loading="isLoading"
    element-loading-text="Fetching data..."
  ></div>
</template>

<script setup>
import { watch, ref, onMounted } from "vue";
import { baseUrl, postData } from "@/utils/api.js";
const props = defineProps({
  id: Number,
});

/* -------------------------------------------------------------------------- */
// communicate with backend server
/* -------------------------------------------------------------------------- */
const isLoading = ref(true);
const panelData = ref(null);
// communicate to server to get other insights in the same data scope
const postFunc = async (id) => {
  try {
    isLoading.value = true;
    const data = await postData(baseUrl + "/panel/data", {
      id: id,
    });
    panelData.value = data;
    isLoading.value = false;
  } catch (e) {
    ElMessage.error(`Panel Error: ${e.message}`);
  }
};

watch(panelData, (newVal, oldVal) => {
  console.log("watch", props.id);
  console.log(newVal, oldVal);
});

onMounted(() => {
  postFunc(props.id);
});
</script>

<style lang="scss" scoped>
.panel-container {
  width: 30rem;
  height: 100%;
  z-index: $z-middle;

  background-color: #fff;
  border-radius: $border-radius;
  border: $border;
}
</style>
