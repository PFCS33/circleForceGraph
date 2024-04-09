class PathGraph {
  constructor(containerId, pathList) {
    this.containerViewWidth = 300;
    this.containerViewHeight = 300;
    this.pathList = pathList;
    this.svgContainer = this.setSvgContainer(containerId);
    this.graphConfig = {
      hGap: this.containerViewHeight / 3,
      vGap: this.containerViewHeight / 10,
      rectWidth: this.containerViewHeight / 2,
      rectHeight: this.containerViewHeight / 10,
      circleR: this.containerViewHeight / 20,
    };
  }

  /* set basic attr of container, and return it
   */
  setSvgContainer(containerId) {
    const svgContainer = d3
      .select(containerId)
      .attr("viewBox", [
        0,
        0,
        this.containerViewWidth,
        this.containerViewHeight,
      ])
      .attr("preserveAspectRatio", "xMidYMid slice");
    return svgContainer;
  }

  createGraph() {
    this.updateDomByData(this.pathList);
  }

  updateDomByData(pathList) {
    const graphConfig = this.graphConfig;
    const svgContainer = this.svgContainer;
    const itLinkTopG = svgContainer.append("g").attr("class", "top-g-link");
    const blockTopG = svgContainer.append("g").attr("class", "top-g-block");
    itLinkTopG
      .selectChildren("g")
      .data(d3.range(0, pathList.length - 1), (d) => d)
      .join(
        (enter) => {
          const topGs = enter.append("g").attr("class", "g-link");
          //   console.log(topGs);
          const interLines = topGs
            .append("line")
            .attr("x1", graphConfig.rectWidth / 2)
            .attr(
              "y1",
              (d) =>
                d * (graphConfig.rectHeight + graphConfig.vGap) +
                graphConfig.rectHeight
            )
            .attr("x2", graphConfig.rectWidth + graphConfig.hGap)
            .attr(
              "y2",
              (d) => (d + 1) * (graphConfig.rectHeight + graphConfig.vGap)
            )
            .attr("stroke", "#000");
          console.log(interLines);
        },
        (update) => {},
        (exist) => {
          exist.remove();
        }
      );
    blockTopG
      .selectChildren("g")
      // bind only index onto dom element, and 0 refers to the "end" of the path
      .data(d3.range(0, pathList.length), (d) => d)
      .join(
        (enter) => {
          const topGs = enter
            .append("g")
            .attr("class", "g-block")
            // move the whole
            .attr(
              "style",
              (d) =>
                `transform:
                translate(0, ${
                  d * (graphConfig.rectHeight + graphConfig.vGap)
                }px)`
            );
          // append rect as question bar
          const questionBars = topGs
            .append("rect")
            .attr("width", graphConfig.rectWidth)
            .attr("height", graphConfig.rectHeight)
            .attr("fill", "none")
            .attr("stroke", "#000");

          // append circle as node in the graph
          const nodes = topGs
            .append("circle")
            .attr("r", graphConfig.circleR)
            .attr("cx", graphConfig.hGap + graphConfig.rectWidth)
            .attr("stroke", "#000")
            .attr("fill", "none")
            .attr("cy", graphConfig.rectHeight / 2);

          const innerLines = topGs
            .append("line")
            .attr("x1", graphConfig.rectWidth)
            .attr("y1", graphConfig.rectHeight / 2)
            .attr(
              "x2",
              graphConfig.rectWidth + graphConfig.hGap - graphConfig.circleR
            )
            .attr("y2", graphConfig.circleR)
            .attr("stroke", "#000");
        },
        (update) => {},
        (exist) => {
          exist.remove();
        }
      );
  }
}

export { PathGraph };
