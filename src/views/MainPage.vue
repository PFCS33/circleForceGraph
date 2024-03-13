<template>
  <div
    class="container"
    v-loading="isLoading"
    element-loading-text="Computing..."
  >
    <div class="nav-bar">
      <div class="brand">Exploration</div>
    </div>
    <div class="content-box">
      <CircleGraph
        class="graph"
        v-if="hasGetData"
        :graphData="graphData"
      ></CircleGraph>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import CircleGraph from "@/components/circle-graph/CircleGraph.vue";

import { baseUrl, fetchData } from "@/utils/api";

const graphData = ref(null);
const isLoading = ref(true);
const hasGetData = ref(false);

onMounted(async () => {
  // fetch data from server
  try {
    graphData.value = await fetchData(baseUrl + "/graph/data");
    hasGetData.value = true;

    ElMessage.success(`Calculation complete`);
  } catch (e) {
    ElMessage.error(`Graph Error: ${e.message}`);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.container {
  @include container-base();
  @include flex-box(column);
  max-height: 100%;
  gap: 0.5rem;

  .nav-bar {
    flex: auto;
    width: 100%;
    box-shadow: 0rem 0.1rem 0.2rem 0rem rgba(0, 0, 0, 0.2);
    z-index: $z-top;

    @include flex-box(column);
    justify-content: center;
    padding-left: 1rem;
    .brand {
      font-size: 2rem;
      font-weight: bold;
      color: $primary-color;
    }
  }

  .content-box {
    max-height: 95%;
    width: 100%;
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
