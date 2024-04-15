<template>
  <div class="v-boundary">
    <div class="icon-box">
      <div class="icon-border">
        <SvgIcon
          iconName="arrow-right"
          class="icon hide"
          @click="emit('hide', null)"
        ></SvgIcon>
      </div>
      <div
        :class="['icon-border', { isSelected: curTab === 'detail' }]"
        @click="switchTab('detail')"
      >
        <SvgIcon iconName="chart" class="icon chart"> </SvgIcon>
      </div>
      <div
        :class="['icon-border', { isSelected: curTab === 'history' }]"
        @click="switchTab('history')"
      >
        <SvgIcon iconName="history" class="icon history"> </SvgIcon>
      </div>
    </div>
    <div
      class="panel-container"
      v-loading="
        (curTab === 'detail' && isDetailLoading) ||
        (curTab === 'history' && isHisLoading)
      "
      element-loading-text="Fetching data..."
      element-loading-custom-class="info"
    >
      <div class="detail-page" v-if="curTab === 'detail'">
        <div class="scope-border border">
          <div class="title-box">
            <h2 class="title">Data Scope</h2>
            <SvgIcon
              iconName="turn-left"
              @click="setDataScope"
              class="icon"
            ></SvgIcon>
          </div>
          <div class="content">
            <div class="item-box" v-for="(value, col) in insightData.scope">
              <div class="label item">{{ col }}</div>
              <div class="value item">{{ value }}</div>
            </div>
          </div>
        </div>
        <div class="detail-border border">
          <h2 class="title">Details</h2>
          <div class="content">
            <div class="item-box">
              <div class="label item">Type</div>
              <div :class="['value', 'item', 'type', insightData.category]">
                {{ insightData.type }}
              </div>
            </div>
            <div class="item-box">
              <div class="label item">Score</div>
              <div class="value item score">{{ insightData.score }}</div>
            </div>
            <div class="item-box desc">
              <div class="label item">Description</div>
              <div class="value item">{{ insightData.description }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="history-page" v-else-if="curTab === 'history'">
        <!-- <div v-for="node in questionPath" :key="node.id">
          {{ `id: ${node.id}, question: ${node.question}` }}
        </div> -->
        <svg id="pg-container"></svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch, ref, onMounted, nextTick } from "vue";
import { baseUrl, postData } from "@/utils/api.js";
import SvgIcon from "../ui/SvgIcon.vue";
import { useStore } from "vuex";
import { PathGraph } from "@/utils/pathGenerator";

/* -------------------------------------------------------------------------- */
// props & emit
/* -------------------------------------------------------------------------- */
const props = defineProps({
  realId: Number,
  id: Number,
});
const realId = props.realId;
const id = props.id;
const emit = defineEmits(["hide"]);

/* -------------------------------------------------------------------------- */
// store settings
/* -------------------------------------------------------------------------- */
const store = useStore();
// set data scope of filter panel
const setDataScope = () => {
  store.dispatch("focus/changeDataScope", { ...insightData.scope });
};
/* -------------------------------------------------------------------------- */
// history related
/* -------------------------------------------------------------------------- */
const questionPath = computed(() => {
  const tree = store.getters["treeData"];
  return tree.getQuesionPath(id);
});

const pathGraph = ref(null);

/* -------------------------------------------------------------------------- */
// tab switching
/* -------------------------------------------------------------------------- */
const curTab = ref("null");
const switchTab = (mode) => {
  curTab.value = mode;
};

watch(curTab, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    switch (newVal) {
      case "detail":
        postFunc(realId);
        break;
      case "history":
        nextTick(() => {
          getVlSpec(questionPath.value.map((d) => d.id));
        });

        break;
    }
  }
});

/* -------------------------------------------------------------------------- */
// communicate with backend server
/* -------------------------------------------------------------------------- */
// history page
const isHisLoading = ref(true);
// get vl-spec from backend server, and merge data to form path graph
const getVlSpec = (ids) => {
  postData(baseUrl + "/panel/ids", {
    ids: ids,
  })
    .then((vlSpec) => {
      pathGraph.value = new PathGraph(
        "#pg-container",
        // add vega-lite attr in question path
        questionPath.value.map((d, idx) => ({ ...d, "vega-lite": vlSpec[idx] }))
      );
      pathGraph.value.createGraph();
      // show page
      isHisLoading.value = false;
    })
    .catch((e) => {
      ElMessage.error(`Panel Error: ${e.message}`);
    });
};

// detail page
const isDetailLoading = ref(true);
const insightData = reactive({
  scope: null,
  type: null,
  category: null,
  score: null,
  description: null,
});

// detail page: get data scope and description about focus insight
const postFunc = async (id) => {
  try {
    const data = await postData(baseUrl + "/panel/id", {
      realId: id,
    });

    // assign data to local value
    insightData.scope = data.dataScope;
    insightData.type = data.type;
    insightData.category = data.category;
    insightData.score = data.score;
    insightData.description = data.description;

    // show page
    isDetailLoading.value = false;
  } catch (e) {
    ElMessage.error(`Panel Error: ${e.message}`);
  }
};

/* -------------------------------------------------------------------------- */
// life hooks
/* -------------------------------------------------------------------------- */
onMounted(() => {
  curTab.value = "detail";
});
</script>

<style lang="scss" scoped>
.v-boundary {
  height: 100%;
  position: relative;
  .icon-box {
    position: absolute;
    top: 0;
    left: -$icon-size-regular - $border-width - 0.6rem;
    @include flex-box(column);
    gap: 0.15rem;
    .icon-border {
      padding: 0.3rem;
      border: $border;
      // border-color: $primary-color;
      border-right: none;
      background-color: $background-color-light;
      transition: background-color ease-out 0.2s;
      .icon {
        @include icon-style();
      }
      &.isSelected,
      &:hover {
        background-color: $primary-color;
        cursor: pointer;
        .icon {
          background-color: $primary-color;
          fill: #fff;
        }
      }
    }
  }
}

.panel-container {
  width: 25rem;
  height: 100%;
  z-index: $z-middle;

  background-color: $primary-color-gray;
  border-radius: $border-radius;
  border: $border;

  .detail-page {
    @include flex-box(column);
    // user-select: none;
    gap: 1rem;

    .border {
      width: 100%;
      @include flex-box(column);
      gap: 0.8rem;
      .title {
        color: $primary-color;
        margin: 0.6rem 0 0 0.5rem;
        font-weight: $font-weight-bold;
        user-select: none;
      }
      .content {
        @include flex-box(column);
        align-items: flex-start;
        gap: 0.4rem;
        width: 100%;
        padding: 0 0.4rem;
        padding-left: 0.6rem;

        .item-box {
          height: 100%;
          width: 100%;
          @include flex-box();
          align-items: center;

          .item {
            height: 100%;
            @include flex-box();
            align-items: center;
          }
          .value {
            color: $primary-color-dark;
          }
          .label {
            font-weight: $font-weight-bold;
            user-select: none;
          }
        }
      }
    }

    .scope-border {
      .title-box {
        @include flex-box();
        justify-content: space-between;
        align-items: center;
        padding: 0.6rem 0 0 0.5rem;
        .title {
          margin: 0;
        }
        .icon {
          @include icon-style();
          margin-right: 0.5rem;
        }
      }
      .content {
        .item-box {
          border-radius: 0.5rem;
          background-color: $primary-color-light;
          padding: 0.2rem;
          height: 2.6rem;
          gap: 0.6rem;

          .label {
            color: $background-color;
            width: 25%;
            margin-left: 0.2rem;
          }
          .value {
            background-color: $background-color-light;
            border: $border-text;
            flex: auto;

            font-size: 1.3rem;
            padding-left: 0.5rem;
          }
        }
      }
    }
    .detail-border {
      .content {
        gap: 0.6rem;
        .item-box {
          gap: 0.8rem;
          .label {
            color: $primary-color;
          }
          .value {
            border: 0.2rem solid $primary-color-light;
            border-radius: 0.5rem;
            padding: 0.3rem;
            font-size: 1.3rem;
            background-color: $background-color-light;
            &.type {
              color: #fff;
              border: none;
              padding: 0.4rem 0.8rem;
            }
            &.score {
            }
            &.point {
              background-color: $point-color;
            }
            &.shape {
              background-color: $shape-color;
            }
            &.compound {
              background-color: $compound-color;
            }
          }

          &.desc {
            @include flex-box(column);
            align-items: flex-start;
            gap: 0.6rem;
            .value {
              width: 100%;
              padding: 0.5rem;
              padding-right: 0.8rem;
            }
          }
        }
      }
    }
  }
  .history-page {
    height: 100%;
    width: 100%;
    padding: 1rem;
    // overflow-y: auto;
  }
}
</style>

<style lang="scss">
.el-tag {
  --el-tag-bg-color: #{$primary-color};
  --el-tag-border-color: #{$border-color-text};
  --el-tag-text-color: #{$background-color-dark};
}

.panel-container {
  .el-divider {
    margin: 0;
  }
}
</style>
