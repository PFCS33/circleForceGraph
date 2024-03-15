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
const dataScope = ref(null);
const insightList = ref(null);
// communicate to server to get other insights in the same data scope
const postFunc = async (id) => {
  try {
    const data = await postData(baseUrl + "/panel/data", {
      id: id,
    });
    dataScope.value = data.dataScope;
    insightList.value = data.insightList;
    isLoading.value = false;
  } catch (e) {
    ElMessage.error(`Panel Error: ${e.message}`);
  }
};

// watch(panelData, (newVal, oldVal) => {
//   if (newVal) {
//   }
// });

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
