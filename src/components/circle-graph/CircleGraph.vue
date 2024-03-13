<template>
  <div class="graph-container">
    <transition name="slide">
      <InfoPanel class="panel" v-if="showPanel"></InfoPanel>
    </transition>
    <svg id="svg-container">
      <defs>
        <!-- vl-icon -->
        <symbol
          id="close"
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect fill="transparent" width="1024" height="1024"></rect>
          <path
            d="M595.392 504.96l158.4-158.464L663.296 256 504.896 414.4 346.496 256 256 346.496 414.4 504.96 256 663.296l90.496 90.496L504.96 595.392l158.4 158.4 90.496-90.496-158.4-158.4zM512 1024A512 512 0 1 1 512 0a512 512 0 0 1 0 1024z"
          ></path>
        </symbol>
        <symbol
          id="question"
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect fill="transparent" width="1024" height="1024"></rect>
          <path
            d="M512 1024A512 512 0 1 1 512 0a512 512 0 0 1 0 1024z m-63.168-320.128V832h130.624v-128.128H448.832zM311.04 416.576h122.304c0-14.976 1.664-28.992 4.992-41.984a101.12 101.12 0 0 1 15.36-34.112c7.04-9.728 15.872-17.472 26.688-23.296 10.816-5.824 23.68-8.768 38.656-8.768 22.208 0 39.552 6.08 52.032 18.304 12.48 12.16 18.688 31.04 18.688 56.576 0.576 14.976-2.048 27.52-7.872 37.44-5.824 9.984-13.44 19.2-22.912 27.52-9.408 8.32-19.648 16.64-30.72 24.96-11.136 8.32-21.696 18.112-31.68 29.44a171.904 171.904 0 0 0-26.24 41.216c-7.424 16.064-12.032 36.032-13.696 59.904v37.44H568.96v-31.616c2.24-16.64 7.68-30.528 16.256-41.6 8.576-11.072 18.432-20.928 29.504-29.504 11.136-8.64 22.912-17.216 35.392-25.792a162.048 162.048 0 0 0 59.904-75.264c6.912-17.28 10.368-39.168 10.368-65.792a149.312 149.312 0 0 0-44.928-104c-16.064-16.064-37.248-29.504-63.616-40.32-26.368-10.88-59.2-16.256-98.56-16.256-30.528 0-58.112 5.12-82.816 15.36a183.68 183.68 0 0 0-63.232 42.88A195.392 195.392 0 0 0 326.4 334.208c-9.728 24.96-14.848 52.48-15.36 82.368z"
          ></path>
        </symbol>
        <symbol
          id="pin"
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M334.72 612.16L127.36 404.736l85.12-85.184L390.016 391.04l275.968-214.4-72.32-72.32L678.912 19.2l82.944 82.88 0.192-0.128L928 267.84l-0.192 0.256 82.944 82.944-85.12 85.184-72.32-72.256L638.848 640l71.488 177.408-85.12 85.184-207.488-207.36-255.36 255.296-82.944-82.944 255.36-255.36z"
          ></path>
        </symbol>
        <!-- filter -->
        <filter
          id="inset-shadow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feComponentTransfer in="SourceAlpha">
            <feFuncA type="table" tableValues="1 0"></feFuncA>
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="3"></feGaussianBlur>
          <feOffset dx="5" dy="5" result="offsetblur"></feOffset>
          <feFlood flood-color="#cccccc" result="color"></feFlood>
          <feComposite in2="offsetblur" operator="in"></feComposite>
          <feComposite in2="SourceAlpha" operator="in"></feComposite>
          <feMerge>
            <feMergeNode in="SourceGraphic"></feMergeNode>
            <feMergeNode></feMergeNode>
          </feMerge>
        </filter>
        <filter id="hover-shadow">
          <feOffset in="SourceAlpha" dx="0" dy="0" result="offsetAlpha" />
          <feMorphology
            in="offsetAlpha"
            operator="dilate"
            radius="2.5"
            result="morphedAlpha"
          />
          <feGaussianBlur
            in="morphedAlpha"
            stdDeviation="6"
            result="blurAlpha"
          />
          <feFlood
            flood-color="#545b77"
            flood-opacity="0.8"
            result="floodColor"
          />
          <feComposite
            in="floodColor"
            in2="blurAlpha"
            operator="in"
            result="colorBlur"
          />
          <feMerge>
            <feMergeNode in="colorBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from "vue";
import { ForceGraph } from "@/utils/graphGenerator.js";
import InfoPanel from "@/components/circle-graph/InfoPanel.vue";
/* -------------------------------------------------------------------------- */
// get props
/* -------------------------------------------------------------------------- */
const props = defineProps({
  graphData: Object,
});
const nodeData = props.graphData.node;
const linkData = props.graphData.link;
/* -------------------------------------------------------------------------- */
// panel related
/* -------------------------------------------------------------------------- */
const showPanel = ref(false);
const toggleShowPanel = () => {
  if (showPanel.value) {
    showPanel.value = false;
    nextTick(() => {
      setTimeout(() => {
        showPanel.value = true;
      }, 150);
    });
  } else {
    showPanel.value = true;
  }
};
const closeShowPanel = () => {
  showPanel.value = false;
};
/* -------------------------------------------------------------------------- */
// focus node related
/* -------------------------------------------------------------------------- */
const focusNode = ref(null);
// watch to set css of new & old node
watch(focusNode, (newVal, oldVal) => {
  // cancle old node's css
  // only if node change, else persist
  if (!newVal || (oldVal && newVal.id != oldVal.id)) {
    toggleFocusCSS(oldVal, false);
    if (!newVal) {
      closeShowPanel();
    }
  }
  // set new node's css
  // only if node change
  if (!oldVal || (newVal && newVal.id != oldVal.id)) {
    toggleFocusCSS(newVal, true);
    toggleShowPanel();
  }
});
const toggleFocusCSS = (data, isHilight) => {
  const element = data.element;
  element.classed("has-focus", isHilight);
};
// call back function of event listener
const setFocusNode = (data) => {
  focusNode.value = data;
};
/* -------------------------------------------------------------------------- */
// life cycle hooks
/* -------------------------------------------------------------------------- */
onMounted(() => {
  const forceGraph = new ForceGraph("#svg-container", nodeData, linkData);
  forceGraph.on("node-click", setFocusNode);
  forceGraph.createForceGraph();
});
</script>

<style lang="scss" scoped>
.graph-container {
  @include container-base();

  .panel {
    position: fixed;
    top: 0;
    right: 0;
  }
  #svg-container {
    width: 100%;
    max-height: 100%;
    // cancle the bottom blank in inline style
    display: block;

    // border: 2px $secondary-color-dark solid;
    // overflow: visible;
  }
}
</style>

<!-- animation -->
<style lang="scss" scoped>
@include slide-animation();
</style>

<style lang="scss">
#svg-container {
  .circle-container {
    transition: transform 0.2s ease-out;
    &.has-hover {
      transform: scale(1.5);
    }
  }
  .vl-container {
    will-change: transform;
    .header {
      .vl-icon {
        fill: $icon-color-gray;
        transition: fill 0.2s ease-out;
        &:hover {
          fill: $primary-color;
        }
      }
    }

    .border {
      transition: filter 0.2s ease-out;
    }
    &.has-focus {
      .border.stroke {
        transition: stroke 0.2s ease-out;
        stroke-width: $border-width-focus;

        stroke: $primary-color;
      }
    }
    &.has-pinned {
      .vl-icon.pin {
        fill: $primary-color;
      }
      .border.shadow {
        filter: url(#inset-shadow);
      }
    }
  }
}
</style>
