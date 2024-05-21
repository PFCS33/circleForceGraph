<template>
  <div id="preview-svg-container"></div>
</template>

<script setup>
import { ref, onMounted, computed, watch, defineComponent } from "vue";
import { useRoute } from "vue-router";
import { PDFGraph } from "@/utils/exporter/treeExporter.js";

defineComponent({
  name: "PreviewPage",
});
const route = useRoute();
const pathData = computed(() => {
  return JSON.parse(route.query.data);
});

const drawStory = (data) => {
  const pdfGraph = new PDFGraph(data);
  const containerNode = d3.select("#preview-svg-container").node();
  pdfGraph.createGraph(containerNode);
  //   const svgString = svg.node().outerHTML;
  //   downloadSVG(svgString);
};

onMounted(() => {
  drawStory(pathData.value);
});
</script>
