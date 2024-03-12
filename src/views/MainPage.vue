<template>
  <div
    class="container"
    v-loading="isLoading"
    element-loading-text="Computing..."
  >
    <InfoPanel class="panel"></InfoPanel>
    <CircleGraph v-if="hasGetData" :graphData="graphData"></CircleGraph>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import CircleGraph from "@/components/circle-graph/CircleGraph.vue";
import InfoPanel from "@/components/circle-graph/InfoPanel.vue";
import { fetchData } from "@/utils/api";

const graphData = ref(null);
const isLoading = ref(true);
const hasGetData = ref(false);

onMounted(async () => {
  // fetch data from server
  try {
    const baseUrl = "http://localhost:3000";
    graphData.value = await fetchData(baseUrl + "/graph/data");
    hasGetData.value = true;

    ElMessage.success(`Calculation complete`);
  } catch (e) {
    ElMessage.error(`Error: ${e.message}`);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;
  max-height: 100%;

  @include flex-box(column);
  align-items: center;
  justify-content: center;
  position: relative;

  .panel {
    position: absolute;
    top: 0;
    right: 0;
  }
}
</style>

<style lang="scss">
// set style of el-mask
.el-loading-mask {
  z-index: $z-top;
  --el-color-primary: $primary-color;
  .el-loading-spinner {
    stroke: $primary-color;
  }
  .el-loading-text {
    color: $text-color-2nd;
  }
}
</style>
