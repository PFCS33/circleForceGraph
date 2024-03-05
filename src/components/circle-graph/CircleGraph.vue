<template>
  <svg id="svg-container"></svg>
</template>

<script setup>
import { onMounted } from "vue";
import { ForceGraph } from "@/utils/graphGenerator.js";

// get props
const props = defineProps({
  graphData: Object,
});
const nodeData = props.graphData.node;
const linkData = props.graphData.link;

onMounted(() => {
  const forceGraph = new ForceGraph("#svg-container", nodeData, linkData);
  forceGraph.createForceGraph();
});
</script>

<style lang="scss" scoped>
#svg-container {
  width: 80%;
  height: 80%;
  border: 2px $secondary-color-dark solid;
  // overflow: visible;
}
</style>
