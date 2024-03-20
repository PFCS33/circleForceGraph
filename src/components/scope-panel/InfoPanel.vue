<template>
  <div class="v-boundary">
    <SvgIcon
      iconName="arrow-right"
      class="hide-icon"
      @click="emit('hide', null)"
    ></SvgIcon>
    <div
      class="panel-container"
      v-loading="isLoading"
      element-loading-text="Fetching data..."
    >
      <div class="scope-border">
        <el-tag
          class="scope-item"
          v-for="(value, col) in dataScope"
          :key="col"
          >{{ `${col}: ${value}` }}</el-tag
        >
      </div>
      <div class="insight-list-border">
        <div
          class="insight-border"
          v-for="insightData in currentPageData"
          :class="{ isSelected: currentId === insightData.id }"
        >
          <div class="vl-container" ref="vlContainers"></div>
          <div class="text-container">
            <div class="type-box">
              <span class="title">Type</span>
              <span class="value">{{ insightData.type }}</span>
            </div>
            <div class="score-box">
              <span class="title">Score</span>
              <span class="value">{{ insightData.score }}</span>
            </div>
            <div class="desc-box">
              <div class="title">Description</div>
              <div class="value">{{ insightData.description }}</div>
            </div>
            <button @click="switchInsight(insightData)" class="btn">
              {{ currentId === insightData.id ? "SELECTED" : "SELECT" }}
            </button>
          </div>
        </div>
      </div>
      <el-pagination
        v-if="insightList"
        small
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="insightList.length"
        v-model:current-page="currentPageNumber"
        class="pagination"
      />
    </div>
  </div>
</template>

<script setup>
import { watch, ref, onMounted, nextTick } from "vue";
import { baseUrl, postData } from "@/utils/api.js";
import vegaEmbed from "vega-embed";
import SvgIcon from "../ui/SvgIcon.vue";
const props = defineProps({
  id: Number,
});
const emit = defineEmits(["hide"]);
// create refs
const vlContainers = ref([]);
/* -------------------------------------------------------------------------- */
// insight switching
/* -------------------------------------------------------------------------- */
const currentId = ref(null);
const switchInsight = (insightData) => {
  const id = insightData.id;
  currentId.value = id;
};
/* -------------------------------------------------------------------------- */
// communicate with backend server
/* -------------------------------------------------------------------------- */
const isLoading = ref(true);
const dataScope = ref(null);
const insightList = ref(null);
const insightIdMap = new Map();
// communicate to server to get other insights in the same data scope
const postFunc = async (id) => {
  try {
    const data = await postData(baseUrl + "/panel/data", {
      id: id,
    });
    // assign data to local value
    dataScope.value = data.dataScope;
    insightList.value = data.insightList;
    // construct id map for look up
    insightList.value.forEach((insight) => {
      insightIdMap.set(insight.id, insight);
    });
    // initilize first page's data
    currentPageData.value = getPageData(currentPageNumber.value);
    // show page
    isLoading.value = false;
  } catch (e) {
    ElMessage.error(`Panel Error: ${e.message}`);
  }
};

/* -------------------------------------------------------------------------- */
// pagination related
/* -------------------------------------------------------------------------- */
// number of insights in one page
const pageSize = 3;
// current page number (position), start from 1
const currentPageNumber = ref(1);
// insights in current page
const currentPageData = ref(null);
// get one page's data by page number
const getPageData = (number) => {
  const start = pageSize * (number - 1);
  let end = start + pageSize;
  return insightList.value.slice(start, end);
};

// draw vl-graph inside the panel
const drawPanelVl = (container, data) => {
  // reset container width
  container.style("width", "60%");
  // get vl spec, and add config
  let vlSpec = JSON.parse(data["vega-lite"]);
  vlSpec.width = "container";
  vlSpec.height = "container";
  vlSpec.background = "transparent";
  vlSpec["usermeta"] = { embedOptions: { renderer: "svg" } };
  // render
  vegaEmbed(container.node(), vlSpec).then((result) => {
    const canvas = container.select("svg");
    // remove other components and re-insert canvas
    container.select("div").remove();
    container.select("details").remove();
    container.node().appendChild(canvas.node());
    container.style("width", "55%");
  });
};

// let pageData changes with page number
watch(currentPageNumber, (newVal, oldVal) => {
  currentPageData.value = getPageData(newVal);
});

// draw vl-graph based on new page data
watch(currentPageData, (newVal, oldVal) => {
  nextTick(() => {
    vlContainers.value.forEach((containerRef, index) => {
      const data = newVal[index];
      drawPanelVl(d3.select(containerRef), data);
    });
  });
});

// watch(panelData, (newVal, oldVal) => {
//   if (newVal) {
//   }
// });

onMounted(() => {
  const id = props.id;
  postFunc(id);
  currentId.value = id;
});
</script>

<style lang="scss" scoped>
.v-boundary {
  height: 100%;
  position: relative;
}
.hide-icon {
  position: absolute;
  top: 0;
  right: 43rem;
  border: $border;
  border-right: none;
  background-color: $background-color-light;
  @include icon-style();
}
.panel-container {
  width: 43rem;
  height: 100%;
  z-index: $z-middle;

  background-color: $background-color;
  border-radius: $border-radius;
  border: $border;

  @include flex-box(column);
  justify-content: space-between;
  user-select: none;
  // gap: 1rem;

  .scope-border {
    @include flex-box();
    align-items: center;
    gap: 0.8rem;
    padding-left: 0.5rem;
    flex-shrink: 0;
    flex-grow: 0;
    height: 6%;
    overflow-y: hidden;
    overflow-x: auto;
  }

  .insight-list-border {
    flex-grow: 1;
    @include flex-box(column);

    justify-content: space-between;
    .insight-border {
      width: 100%;
      height: 33.3%;
      @include flex-box();
      justify-content: stretch;
      align-items: center;
      border-bottom: $border;
      padding-right: 1.2rem;
      transition: all 0.2s ease-out;
      // border-color: $primary-color;
      &:first-child {
        border-top: $border;
        // border-color: $primary-color;
      }
      &:hover {
        box-shadow: 0rem 0.2rem 0.6rem 0.1rem rgba(#000, 0.26);
        // background-color: $primary-color;
      }

      .vl-container {
        width: 60%;
        height: 98%;
        flex-shrink: 0;
        svg {
          // background-color: #fff;
        }
      }
      .text-container {
        background-color: $background-color-light;
        box-shadow: 0.1rem 0.1rem 0.2rem 0.15rem rgba($primary-color, 0.4);

        // margin-right: 1.2rem;
        padding: 0.8rem 1rem;
        border-radius: $border-radius + 0.3rem;

        flex: auto;
        height: 95%;
        // border: $border;
        @include flex-box(column);
        gap: 0.4rem;
        font-size: 1.1rem;
        // transition: background-color 0.2s ease-out;

        .type-box,
        .score-box {
          @include flex-box();
          align-items: center;

          .title {
            font-weight: $font-weight-bold;
            width: 20%;
            color: $primary-color;
            // font-size: 1.2rem;
            transition: color 0.2s ease-out;
          }
          .value {
            padding: 0.2rem 0.5rem;
            color: rgba($text-color, 0.8);
            transition: color 0.2s ease-out;
          }
        }
        .desc-box {
          flex-grow: 1;
          @include flex-box(column);
          gap: 0.5rem;

          .title {
            font-weight: $font-weight-bold;
            color: $primary-color;
            transition: color 0.2s ease-out;
            // font-size: 1.2rem;
          }
          .value {
            color: rgba($text-color, 0.8);
            border: $border-text;

            border-radius: 0.5rem;
            padding: 0.5rem;
            flex-grow: 1;
            transition: color 0.2s ease-out;
          }
        }
        .btn {
          background-color: $primary-color;
          border: none;
          color: $secondary-color;
          font-weight: $font-weight-bold;
          padding: 0.3rem;
          cursor: pointer;
          transition: all 0.2s ease-out;
          border-radius: $border-radius;
          &:hover,
          &:active {
            background-color: $primary-color-dark;
            color: $background-color;
          }
        }
      }
      &.isSelected {
        box-shadow: inset 0.5rem 0.3rem 0.8rem -0.3rem rgba($primary-color, 0.5);

        .text-container {
          .btn {
            color: $third-color-light;
          }
        }
      }
    }
  }
  .pagination {
    @include flex-box();
    align-items: center;
    justify-content: center;
    padding: 0.6rem;
    flex-shrink: 0;
    flex-grow: 0;
  }
}
</style>

<style lang="scss">
.pagination {
  --el-color-primary: #{$primary-color};
  --el-text-color-primary: #{$text-color-muted};

  .el-pager {
    justify-content: center;

    flex: 0.8;
  }
}
.el-tag {
  --el-tag-bg-color: #{$primary-color};
  --el-tag-border-color: #{$border-color-text};
  --el-tag-text-color: #{$background-color-dark};
}
</style>
