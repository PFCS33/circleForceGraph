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
import { ref, onMounted, computed, watch } from "vue";
import { useStore } from "vuex";
import CircleGraph from "@/components/circle-graph/CircleGraph.vue";

const store = useStore();

// data for creatring force graph
const graphData = computed(() => store.getters["tree/graphData"]);
// control timing of creating force graph component
const isLoading = ref(true);
const hasGetData = ref(false);
watch(graphData, (newVal) => {
  if (newVal) {
    hasGetData.value = true;
    isLoading.value = false;
  } else {
    ElMessage.error(`Graph Data NULL Error`);
  }
});

// starter
onMounted(() => {
  // load data
  store
    .dispatch("tree/initRawData", null)
    .then((res) => {
      ElMessage.success(res.message);
    })
    .catch((e) => {
      ElMessage.error(`Data Loading Error: ${e.message}`);
    });
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
    color: $text-color-light;
  }
}
</style>
