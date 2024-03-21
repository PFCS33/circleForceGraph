<template>
  <div class="graph-container">
    <transition name="slide">
      <SvgIcon
        iconName="detail"
        class="panel-show-icon"
        @click="cancleHide"
        v-show="hasHide"
      ></SvgIcon>
    </transition>
    <transition name="slide">
      <InfoPanel
        class="panel"
        v-if="showPanel"
        v-show="!hasHide"
        :id="panelNode.id"
        @hide="hidePanel"
      ></InfoPanel>
    </transition>
    <transition name="pop">
      <QuestionBar
        class="qsbar"
        v-if="showQsBar"
        @close="
          setQuestionEmitNode({
            id: questionNode.id,
            element: null,
          })
        "
      >
      </QuestionBar>
    </transition>
    <svg id="svg-container">
      <defs>
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
import { onMounted, ref, reactive, watch, nextTick, onUnmounted } from "vue";
import { ForceGraph } from "@/utils/graphGenerator.js";
import InfoPanel from "@/components/scope-panel/InfoPanel.vue";
import QuestionBar from "@/components/question-bar/QuestionBar.vue";

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
// control whether to hide icon (detail icon related)
const hasHide = ref(false);
const hidePanel = () => {
  hasHide.value = true;
};
const cancleHide = () => {
  hasHide.value = false;
  if (!showPanel.value) {
    showPanel.value = true;
  }
};
// control whether panel was shown
const showPanel = ref(false);
const toggleShowPanel = () => {
  if (hasHide.value) {
    // if mode === hide, do not set showPanel immediately, delay it till cancleHide event
    showPanel.value = false;
    hasHide.value = false;
    nextTick(() => {
      setTimeout(() => {
        // showPanel.value = true
        hasHide.value = true;
      }, 150);
    });
  } else {
    if (showPanel.value) {
      showPanel.value = false;
      nextTick(() => {
        setTimeout(() => {
          showPanel.value = true;
        }, 150);
      });
    } else {
      // start point, hasHide always false
      showPanel.value = true;
    }
  }
};
const closeShowPanel = () => {
  showPanel.value = false;
};

/* -------------------------------------------------------------------------- */
// question related
/* -------------------------------------------------------------------------- */
const showQsBar = ref(false);
const questionEmitNode = reactive({
  id: -1,
  element: null,
});
const questionNode = reactive({
  id: -1,
  element: null,
});
watch(questionEmitNode, (newVal) => {
  if (!newVal.element) {
    if (newVal.id === questionNode.id) {
      toggleQuestionCSS(questionNode, false);
      closeQsBar();
      myTool.reactiveAssign(
        {
          id: -1,
          element: null,
        },
        questionNode
      );
    }
  } else {
    if (newVal.id !== questionNode.id) {
      if (questionNode.element) {
        toggleQuestionCSS(questionNode, false);
      }
      toggleQuestionCSS(newVal, true);
      myTool.reactiveAssign(newVal, questionNode);
      toggleShowQsBar();
    }
  }
});
const toggleShowQsBar = () => {
  if (showQsBar.value) {
    showQsBar.value = false;
    nextTick(() => {
      setTimeout(() => {
        showQsBar.value = true;
      }, 150);
    });
  } else {
    showQsBar.value = true;
  }
};
const toggleQuestionCSS = (data, isQuestion) => {
  const element = data.element;
  element.classed("has-question", isQuestion);
};
const closeQsBar = () => {
  showQsBar.value = false;
};
const setQuestionEmitNode = (paylaod) => {
  myTool.reactiveAssign(paylaod, questionEmitNode);
};

/* -------------------------------------------------------------------------- */
// focus node related
/* -------------------------------------------------------------------------- */
// node that child component emits
const focusEmitNode = reactive({
  id: -1,
  element: null,
});
// 'real' focus node
const panelNode = reactive({
  id: -1,
  element: null,
});
// watch to set css of new & old node
watch(focusEmitNode, (newVal) => {
  // first, check whether empty node was emitted
  if (!newVal.element) {
    // if newNode is empty, check whether it is current panelNode
    if (newVal.id === panelNode.id) {
      toggleFocusCSS(panelNode, false);
      closeShowPanel();
      // make sure at the beginning, hasHide always false
      hasHide.value = false;
      // clear panelNode
      myTool.reactiveAssign(
        {
          id: -1,
          element: null,
        },
        panelNode
      );
    }
  } else {
    // check whether oldNode element exit and whether focus node was change, if was, cancel its css
    if (newVal.id != panelNode.id) {
      if (panelNode.element) {
        // hanlde old node
        toggleFocusCSS(panelNode, false);
      }
      // set new node
      toggleFocusCSS(newVal, true);
      // set panel node
      myTool.reactiveAssign(newVal, panelNode);
      // switch panel status
      toggleShowPanel();
    }
  }
});
const toggleFocusCSS = (data, isHilight) => {
  const element = data.element;
  element.classed("has-focus", isHilight);
};
// call back function of event listener
const setFocusEmitNode = (data) => {
  myTool.reactiveAssign(data, focusEmitNode);
};
/* -------------------------------------------------------------------------- */
// life cycle hooks
/* -------------------------------------------------------------------------- */
onMounted(() => {
  const forceGraph = new ForceGraph("#svg-container", nodeData, linkData);
  forceGraph.on("node-click", setFocusEmitNode);
  forceGraph.on("question-click", setQuestionEmitNode);
  forceGraph.createForceGraph();
});

onUnmounted(() => {
  forceGraph.off("node-click", setFocusEmitNode);
  forceGraph.off("question-click", showQuestionBar);
});
</script>

<style lang="scss" scoped>
.graph-container {
  @include container-base();
  position: relative;
  // isolate inner elements from other doms, preventing jiggles when side animation is applied
  contain: layout style;

  .qsbar {
    position: fixed;
    bottom: 0;
  }

  .panel-show-icon {
    position: absolute;
    top: 0;
    right: 0.3rem;
    @include icon-style($icon-size-large);
    border-radius: $border-radius;
    padding: 0.3rem;
  }

  .panel {
    position: absolute;
    top: 0;
    right: 0;
  }
  #svg-container {
    width: 100%;
    height: 100%;
    // cancle the bottom blank in inline style
    display: block;
  }
}
</style>

<!-- animation -->
<style lang="scss" scoped>
@include slide-animation();
@include pop-animation();
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

          &.question {
            fill: $third-color;
          }
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
    &.has-question {
      .vl-icon.question {
        fill: $third-color;
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
