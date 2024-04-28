<template>
  <div class="filter-container">
    <div
      class="filter"
      v-loading="isLoading"
      element-loading-text="Fetching data..."
    >
      <div class="title">
        <h2 class="name">Data Scope</h2>
        <el-divider />
      </div>
      <div class="content" v-if="!isLoading">
        <div
          v-for="[key, range] in colInfoMap.entries()"
          :key="key"
          class="select-box"
        >
          <p class="label">{{ key }}</p>
          <el-select
            class="selector"
            v-model="curValues[key]"
            placement="right-start"
          >
            <el-option
              v-for="item in range"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </div>
      </div>
    </div>
    <div
      class="insight-box"
      v-loading="isLoadingPost"
      element-loading-text="Fetching data..."
    >
      <div class="insight-list-border" v-show="!isLoadingPost">
        <div
          class="wrapper"
          :key="insightData['realId']"
          v-for="insightData in currentPageData"
        >
          <transition name="slide">
            <div class="desc-container" v-show="insightData.isDescVisible">
              <div class="title">Description</div>
              <div class="value">{{ insightData.description }}</div>
            </div>
          </transition>
          <div
            :class="[
              'insight-border',
              { isSelected: curRealId === insightData['realId'] },
            ]"
            v-loading="isAddingNode && curAddingId === insightData['realId']"
            element-loading-text="Adding Node..."
          >
            <div class="text-container">
              <div class="type-box">
                <span class="title">Type</span>
                <span class="value">{{ insightData.type }}</span>
              </div>
              <div class="score-box">
                <span class="title">Score</span>
                <span class="value">{{
                  insightData.score ? insightData.score.toFixed(5) : ""
                }}</span>
              </div>
            </div>
            <div
              class="vl-container"
              :id="insightData['realId']"
              ref="vlContainers"
            ></div>
            <div class="btn-box">
              <SvgIcon
                iconName="add-outline"
                @click="addNewTopNode(insightData)"
                class="icon"
              ></SvgIcon>
              <SvgIcon
                :class="['icon', { 'has-desc': insightData.isDescVisible }]"
                iconName="more"
                @click="toggleShowDesc($event, insightData)"
              ></SvgIcon>
            </div>
          </div>
        </div>
      </div>
      <el-pagination
        v-show="!isLoadingPost"
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
import { ref, reactive, computed, watch, nextTick, defineComponent } from "vue";
import { useStore } from "vuex";
import { getInsights } from "@/api/filter";
import { drawVl } from "@/utils/vega_lite/vlDrawer.js";
import { vega } from "vega-embed";

defineComponent({
  name: "FilterPanel",
});
/* -------------------------------------------------------------------------- */
// get store data
/* -------------------------------------------------------------------------- */
const store = useStore();
const curRealId = computed(() => {
  return store.getters["focus/realId"];
});
const curDataScope = computed(() => {
  return store.getters["focus/dataScope"];
});

watch(curDataScope, (newVal, oldVal) => {
  myTool.reactiveAssign(newVal, curValues);
});

/* -------------------------------------------------------------------------- */
// communicate with backend server
/* -------------------------------------------------------------------------- */
// data loading flag
const isLoading = ref(true);
const isLoadingPost = ref(true);
const insightList = ref(null);
// communicate to server to get other insights in the same data scope
const handlePostData = (data) => {
  // assign data to local value
  insightList.value = data.insights.map((insight) => ({
    ...insight,
    isDescVisible: false,
  }));
  // initilize first page's data
  currentPageData.value = getPageData(currentPageNumber.value);
  // show content
  isLoadingPost.value = false;
};
/* -------------------------------------------------------------------------- */
// tree manipulation
/* -------------------------------------------------------------------------- */
const isAddingNode = ref(false);
const curAddingId = ref(0);
const addNewTopNode = (insightData) => {
  isAddingNode.value = true;
  curAddingId.value = insightData["realId"];
  const newData = {
    realId: insightData.realId,
    type: insightData.type,
    category: insightData.category,
    vegaLite: insightData.vegaLite,
  };
  store
    .dispatch("addNewTopNode", newData)
    .then((res) => {
      ElMessage.success(res.message);
    })
    .catch((e) => {
      ElMessage.error(`Add Node Error: ${e.message}`);
    })
    .finally(() => {
      isAddingNode.value = false;
      curAddingId.value = 0;
    });
};

/* -------------------------------------------------------------------------- */
// control show/not show of description box
/* -------------------------------------------------------------------------- */

const toggleShowDesc = (event, insightData) => {
  const descBox = event.target.parentNode;
  insightData.isDescVisible = !insightData.isDescVisible;
};
/* -------------------------------------------------------------------------- */
// pagination related
/* -------------------------------------------------------------------------- */
// create refs for drawing vl-graph
const vlContainers = ref([]);
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

// let pageData changes with page number
watch(currentPageNumber, (newVal, oldVal) => {
  currentPageData.value = getPageData(newVal);
});

// draw vl-graph based on new page data
watch(currentPageData, (newVal, oldVal) => {
  nextTick(() => {
    vlContainers.value.forEach((containerRef, index) => {
      // attention: attribute is String type
      const realId = +containerRef.getAttribute("id");
      const data = newVal.find((item) => item["realId"] === realId);
      drawVl(d3.select(containerRef), data);
    });
  });
});

/* -------------------------------------------------------------------------- */
// column info processing
/* -------------------------------------------------------------------------- */
// get column info (map)
const colInfoMap = computed(() => {
  return store.getters["colInfoMap"];
});
const curValues = reactive({});

watch(colInfoMap, (newVal) => {
  if (newVal) {
    // initialize binding values
    for (const colName of newVal.keys()) {
      curValues[colName] = "*";
    }
    isLoading.value = false;
  } else {
    ElMessage.error("Error: Column Info NULL");
  }
});

watch(curValues, (newVal) => {
  // everytime filter change. post scope to get new data
  isLoadingPost.value = true;

  getInsights(newVal)
    .then((res) => {
      handlePostData(res.data);
    })
    .catch((e) => {
      ElMessage.error(`Fetch Scope Data Error: ${e.message}`);
    });
});
</script>

<style lang="scss" scoped>
.filter-container {
  @include container-base();
  display: flex;
  user-select: none;
  .filter {
    box-shadow: 0.4rem 0rem 1rem 0rem rgba($primary-color, 0.26);
    flex: auto;
    background-color: $primary-color;
    .title {
      color: $secondary-color;
      @include flex-box(column);
      gap: 0.5rem;
      .name {
        margin: 0.6rem 0 0 0.5rem;
      }
    }
    .content {
      color: $background-color-dark;
      @include flex-box(column);
      gap: 0.8rem;
      padding: 0.5rem;
      padding-right: 0.8rem;
      padding-top: 1rem;
      .select-box {
        // border: $border;
        @include flex-box(column);
        gap: 0.3rem;
        .label {
          font-size: 1.2rem;
          font-weight: $font-weight-bold;
        }

        .selector {
        }
      }
    }
  }

  .insight-box {
    width: 65%;
    min-width: 65%;

    border-right: $border;
    border-radius: $border-radius + 0.3rem;
    border-color: rgba($primary-color, 0.3);
    // box-shadow: inset 0.1rem 0.2rem 0.6rem 0.2rem rgba($primary-color, 0.3);
    @include flex-box(column);

    justify-content: space-between;
    .insight-list-border {
      flex: auto;

      .wrapper {
        position: relative;
        width: 100%;
        height: 33.3%;

        .desc-container {
          position: absolute;
          left: 102%;
          top: 1%;
          width: 15rem;
          height: 99%;

          border: $border-text;
          border-radius: 0.3rem;
          background-color: $primary-color-gray;

          @include flex-box(column);
          gap: 0.6rem;
          padding: 0.6rem 0.4rem;
          z-index: $z-bottom;

          .title {
            font-weight: $font-weight-bold;
            color: $primary-color;
            // font-size: 1.2rem;
          }
          .value {
            color: rgba($text-color, 0.8);
            // border: $border-text;
            // border-radius: 0.5rem;
            // padding: 0.5rem;
            flex-grow: 1;
          }
        }
        .insight-border {
          width: 100%;
          height: 100%;

          @include flex-box(column);
          align-items: flex-start;
          gap: 0.3rem;
          // z-index: $z-middle;
          background-color: $primary-color-gray;

          border-bottom: $border;
          border-color: rgba($primary-color, 0.3);
          padding-top: 0.8rem;
          padding-left: 1rem;
          transition: all 0.2s ease-out;
          position: relative;

          &:hover {
            box-shadow: 0.1rem 0.5rem 0.5rem 0rem rgba($primary-color, 0.26);
            // background-color: $primary-color;
            z-index: $z-middle;
          }

          .vl-container {
            width: 100%;
            height: 90%;
            flex-shrink: 0;
            svg {
              // background-color: #fff;
            }
          }
          .text-container {
            flex: auto;
            width: 100%;
            @include flex-box();
            align-items: center;
            // justify-content: space-evenly;
            gap: 2rem;
            font-size: 1.1rem;

            .type-box,
            .score-box {
              @include flex-box();
              align-items: center;
              gap: 0.5rem;
              .title {
                font-weight: $font-weight-bold;
                color: $primary-color;
              }
              .value {
                color: rgba($text-color, 0.8);
              }
            }
          }

          .btn-box {
            position: absolute;
            right: 1%;
            top: calc(50% - $icon-size-small - 0.2rem);
            @include flex-box(column);
            gap: 0.4rem;
            .icon {
              @include icon-style($icon-size-small);
              border-radius: $border-radius;

              &.has-desc {
                background-color: $primary-color;
                fill: #fff;
              }
            }
          }

          &.isSelected {
            box-shadow: inset 0.3rem 0.6rem 0.8rem 0.1rem
              rgba($primary-color, 0.26);
            background-color: rgba($primary-color-light, 0.1);
            .text-container {
              .btn {
                color: $third-color-light;
              }
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
}
</style>
<style lang="scss" scoped>
@include slide-animation(-1);
</style>
<style lang="scss">
.pagination {
  --el-color-primary: #{$primary-color};
  --el-text-color-primary: #{$text-color-light};
  --el-fill-color-blank: rgba($primary-color, 0.05);
  .el-pager {
    justify-content: center;
    flex: 0.8;
  }
}

.filter {
  .el-divider {
    margin: 0;
  }

  .el-select {
    // adjust line height of el select box
    --el-component-size: 2.6rem;
    // font-size
    --el-font-size-base: 1.3rem;
    // highlight color
    --el-color-primary: #{$secondary-color};
  }
}
.el-select-dropdown {
  --el-color-primary: #{$secondary-color};
  --el-text-color-regular: #{$background-color};
  --el-fill-color-light: #{$background-color};
  background-color: $primary-color;
  .el-select-dropdown__item.hover,
  .el-select-dropdown__item:hover {
    color: $primary-color;
  }
  .el-select-dropdown__item.selected:hover,
  .el-select-dropdown__item.selected.hover {
    color: $secondary-color-dark;
  }
  --el-text-color-secondary: #{$background-color};
}
</style>
