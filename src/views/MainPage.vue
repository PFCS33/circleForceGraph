<template>
  <div
    class="container"
    v-loading="isLoading"
    element-loading-text="Computing..."
  >
    <CircleGraph
      class="graph"
      v-if="hasGetData"
      :graphData="graphData"
    ></CircleGraph>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import CircleGraph from "@/components/circle-graph/CircleGraph.vue";

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
  @include container-base();

  @include flex-box(column);
  align-items: center;
  justify-content: center;

  .graph {
    @include container-base();
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
