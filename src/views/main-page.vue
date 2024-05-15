<template>
  <div
    class="container"
    v-loading="isLoading"
    element-loading-custom-class="main"
    element-loading-text="Computing..."
  >
    <div class="nav-bar">
      <div class="brand">Exploration</div>
      <div style="flex-grow: 1"></div>
      <SvgIcon iconName="upload" class="icon"></SvgIcon>
      <SvgIcon iconName="export" class="icon" @click="handleExport"></SvgIcon>
    </div>
    <div class="content-box">
      <div class="filter-box" v-show="!exportMode">
        <FilterPanel></FilterPanel>
      </div>
      <div class="graph-box">
        <CircleGraph></CircleGraph>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed, watch, defineComponent } from "vue";
import { getNodeDetail, getVlSpec } from "@/api/panel.js";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import CircleGraph from "@/components/graph/circle-graph.vue";
import FilterPanel from "@/components/filter/filter-panel.vue";
import SvgIcon from "../components/ui/svg-icon.vue";
import { PDFGraph } from "@/utils/exporter/PDFGenerator.js";

defineComponent({
  name: "MainPage",
});

/* -------------------------------------------------------------------------- */
// other
/* -------------------------------------------------------------------------- */
const store = useStore();
const router = useRouter();
// control timing of creating force graph component
const isLoading = ref(true);
/* -------------------------------------------------------------------------- */
// export mode
/* -------------------------------------------------------------------------- */

const exportMode = computed(() => {
  return store.getters["export/mode"];
});
const handleExport = () => {
  store.commit("export/setMode", true);
};
const freezeId = computed(() => {
  return store.getters["freeze/id"];
});

// construct data for pdf-graph
const constructPdfData = async (data) => {
  console.log(data);
  const questionData = data.map((d) => ({ id: d.id, question: d.question }));
  const relaData = data.map((d) => ({
    id: d.id,
    relationship: d.relationship,
  }));
  const relTypeData = data.map((d) => ({
    id: d.id,
    relType: d.relType,
  }));
  questionData.shift();
  relaData.shift();
  relTypeData.shift();
  const idList = data.map((d) => d.id);
  const realIdList = data.map((d) => d.realId);

  // get vlSpecs
  const vlSpecListResult = await getVlSpec(realIdList);
  const vlSpecList = vlSpecListResult.data.vlList;

  // get descriptions
  const descriptionPromiseList = realIdList.map((id) => getNodeDetail(id));
  const nodeDetailResults = await Promise.all(descriptionPromiseList);
  const descriptionList = nodeDetailResults.map((res) => res.data.description);
  // const relTypeData = nodeDetailResults.map((res) => {
  //   id: res.data.id;
  //   relType: res.data.relType;
  // });
  const insightData = idList.map((id, index) => ({
    id: id,
    description: descriptionList[index],
    vegaLite: vlSpecList[index],
  }));

  return {
    questionData,
    relaData,
    insightData,
    relTypeData,
  };
};

watch(freezeId, (newVal) => {
  if (exportMode.value && newVal !== -1) {
    store.dispatch("export/startExport", newVal).then((data) => {
      constructPdfData(data).then((data) => {
        const pdfGraph = new PDFGraph(data);
        pdfGraph.createGraph();
        // router.push({
        //   name: "preview",
        //   query: {
        //     data: JSON.stringify(data),
        //   },
        // });
      });
    });
  }
});

// starter
onMounted(() => {
  // load data
  store
    .dispatch("initRawData", null)
    .then((res) => {
      isLoading.value = false;

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
  // gap: 0.5rem;

  .nav-bar {
    flex: auto;
    width: 100%;
    box-shadow: 0rem 0.2rem 0.3rem 0rem rgba(0, 0, 0, 0.2);
    z-index: $z-top;
    @include flex-box();
    align-items: center;
    padding-left: 1rem;
    background-color: $background-color-light;
    .brand {
      font-size: 2rem;
      font-weight: bold;
      color: $primary-color;
    }
    .icon {
      @include icon-style($icon-size-small);
      margin-right: 6px;
    }
  }

  .content-box {
    height: 95%;
    width: 100%;
    display: flex;
    .filter-box {
      width: 32%;
    }
    .graph-box {
      flex: auto;
    }
  }
}
</style>

<style lang="scss">
// set style of el-mask
.el-loading-mask {
  z-index: $z-top;
  --el-color-primary: $primary-color;
  --el-mask-color: #{rgba($background-color-light, 0.6)};
  .el-loading-spinner {
    stroke: $primary-color;
  }
  .el-loading-text {
    color: $text-color-light;
  }

  &.main {
    --el-mask-color: #{rgba($background-color-light, 0.9)};
  }
  &.info {
    --el-mask-color: #{$background-color-light, };
  }
}
</style>
