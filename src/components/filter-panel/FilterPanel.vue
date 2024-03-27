<template>
  <div class="filter-container">
    <div class="filter">
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
    <div class="insight-box"></div>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { ref, reactive, computed, watch } from "vue";
import { useStore } from "vuex";

const store = useStore();

// data loading flag
const isLoading = ref(true);
/* -------------------------------------------------------------------------- */
// column info
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
      curValues[colName] = null;
    }
    isLoading.value = false;
  } else {
    ElMessage.error("Error: Column Info NULL");
  }
});

// watch(curValues, (newVal) => {
//   console.log(newVal);
// });
</script>

<style lang="scss" scoped>
.filter-container {
  @include container-base();
  display: flex;
  user-select: none;
  .filter {
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
    // border: $border;
    width: 68%;
    min-width: 68%;
  }
}
</style>

<style lang="scss">
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
