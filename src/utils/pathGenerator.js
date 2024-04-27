import { drawVl } from "@/utils/vlDrawer";
import EventEmitter from "@/utils/eventEmitter.js";
class PathGraph extends EventEmitter {
  constructor(containerId, pathList) {
    super();
    this.containerViewWidth = 300;
    this.containerViewHeight = 600;
    this.pathList = pathList;
    this.containerId = containerId;
    this.svgContainer = null;

    this.graphConfig = {
      hGap: this.containerViewWidth / 4,
      vGap: 30,
      rectWidth: this.containerViewWidth / 2,
      rectHeight: this.containerViewHeight / 8,
      circleR: this.containerViewWidth / 20,
      vlSize: this.containerViewHeight / 8,
      lineColor: "#64748b",
      // start node
      imgSize: 30,
      startR: 50,
      // border
      borderStroke: "#8996a9",
      borderWidth: 2,
      borderRadius: 5,
      rectFill: "#fff",
      // text
      fontSize: 12,
      fontColor: "#334155",
      textVGap: 3,
      textHGap: 5,
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
      .attr("preserveAspectRatio", "xMidYMid slice")
      .attr("overflow", "visible");
    return svgContainer;
  }

  createGraph() {
    console.log(this.pathList);
    const svgContainer = this.setSvgContainer(this.containerId);
    this.svgContainer = svgContainer;
    // append the top g node first
    // inter-link
    const itLinkTopG = svgContainer.append("g").attr("class", "top-g-link");
    // "row block" item
    const blockTopG = svgContainer.append("g").attr("class", "top-g-block");

    this.updateDomByData(this.pathList);
  }

  updateDomByData(pathList) {
    const graphConfig = this.graphConfig;
    const svgContainer = this.svgContainer;
    const itLinkTopG = svgContainer.selectChild(".top-g-link");
    const blockTopG = svgContainer.selectChild(".top-g-block");
    const num = pathList.length;
    const self = this;

    itLinkTopG
      .selectChildren("g")
      .data(d3.range(0, pathList.length - 1), (d) => d)
      .join(
        (enter) => {
          const topGs = enter.append("g").attr("class", "link-container");
          const interLines = topGs
            .append("path")
            .attr("d", (d) =>
              this.calcArrowPath(
                graphConfig.vlSize + graphConfig.hGap,
                graphConfig.vlSize,
                d * (graphConfig.rectHeight + graphConfig.vGap) +
                  graphConfig.rectHeight / 2,
                (d + 1) * (graphConfig.rectHeight + graphConfig.vGap) +
                  graphConfig.rectHeight / 2
              )
            )
            .attr("stroke", graphConfig.lineColor);
          // .append("line")
          // .attr("x1", graphConfig.circleR * 2 + graphConfig.hGap)
          // .attr("x2", graphConfig.circleR * 2)
          // .attr(
          //   "y1",
          //   (d) =>
          //     d * (graphConfig.rectHeight + graphConfig.vGap) +
          //     graphConfig.rectHeight / 2
          // )
          // .attr(
          //   "y2",
          //   (d) =>
          //     (d + 1) * (graphConfig.rectHeight + graphConfig.vGap) +
          //     graphConfig.rectHeight / 2
          // )
        },
        (update) => {},
        (exist) => {
          exist.remove();
        }
      );
    blockTopG
      .selectChildren("g")
      // bind only index onto dom element, and 0 refers to the "end" of the path
      .data(d3.range(0, num), (d) => d)
      .join(
        (enter) => {
          const topGs = enter
            .append("g")
            .attr("class", "item-container")
            // move the whole
            .attr(
              "style",
              (d) =>
                `transform:
                translate(0, ${
                  (num - 1 - d) * (graphConfig.rectHeight + graphConfig.vGap)
                }px)`
            );
          // append rect as question bar
          const questionBars = topGs
            .filter((d) => d != 0)
            .append("rect")
            .attr("width", graphConfig.rectWidth)
            .attr("height", graphConfig.rectHeight)
            .attr("x", graphConfig.vlSize + graphConfig.hGap)
            .attr("rx", graphConfig.borderRadius)
            .attr("fill", graphConfig.rectFill)
            .attr("stroke-width", graphConfig.borderWidth)
            .attr("stroke", graphConfig.borderStroke);

          // add texts
          const texts = topGs
            .filter((d) => d != 0)
            .append("text")
            .text((d) => pathList[d - 1].question || "NULL")
            .attr("font-size", graphConfig.fontSize)
            .attr("fill", graphConfig.fontColor)
            .attr(
              "x",
              graphConfig.vlSize +
                graphConfig.hGap +
                graphConfig.borderWidth +
                graphConfig.textHGap
            )
            .attr(
              "y",
              graphConfig.borderWidth +
                graphConfig.fontSize +
                graphConfig.textVGap
            );

          // append circle as node in the graph
          // const nodes = topGs
          //   .append("circle")
          //   .attr("r", graphConfig.circleR)
          //   .attr("cx", graphConfig.circleR)
          //   .attr("cy", graphConfig.rectHeight / 2)
          //   .attr("stroke", graphConfig.borderStroke)
          //   .attr("stroke-width", graphConfig.borderWidth)
          //   .attr("fill", "none");

          // vega-lite graph
          const nodeGs = topGs.append("g").attr("class", "node-container");
          // add cursor event handler
          topGs
            .filter((d) => d !== num - 1)
            .style("cursor", "pointer")
            .on("mouseenter", function (_event, idx) {
              self.emit("node-hover", {
                id: pathList[idx].id,
              });
            })
            .on("mouseleave", function (_event, idx) {
              self.emit("node-hover", {
                id: null,
              });
            });
          // draw special start point
          const startNodeG = nodeGs.filter((d) => d === num - 1);
          startNodeG
            .append("circle")
            .attr("r", graphConfig.startR / 2)
            .attr("cx", graphConfig.vlSize / 2)
            .attr("cy", graphConfig.rectHeight / 2)
            .attr("fill", "#64748b");
          startNodeG
            .append("image")
            .attr("href", "/pic/insight-icon/start.png")
            .attr("width", graphConfig.imgSize)
            .attr("height", graphConfig.imgSize)
            .attr("x", graphConfig.rectHeight / 2 - graphConfig.imgSize / 2)
            .attr("y", graphConfig.rectHeight / 2 - graphConfig.imgSize / 2);
          // draw vl graph
          const vlBorders = nodeGs
            .filter((d) => d !== num - 1)
            .append("rect")
            .attr("class", "vl-border")
            .attr("width", graphConfig.vlSize)
            .attr("height", graphConfig.vlSize)
            .attr("rx", graphConfig.borderRadius)
            .attr("fill", graphConfig.rectFill)
            .attr("stroke-width", graphConfig.borderWidth)
            .attr("stroke", graphConfig.borderStroke);

          const vlGs = nodeGs
            .filter((d) => d !== num - 1)
            .append("g")
            .attr("class", "vl-container");
          vlGs.each(function (d) {
            const data = pathList[d];
            const nodeG = d3.select(this);

            drawVl(nodeG, data, {
              width: graphConfig.vlSize + 50,
              height: graphConfig.vlSize + 50,
            }).then((svg) => {
              svg
                .attr("width", graphConfig.vlSize)
                .attr("height", graphConfig.vlSize);
            });
          });

          const innerLines = topGs
            .filter((d) => d != 0)
            .append("path")
            .attr("d", (d) =>
              this.calcArrowPath(
                d === num - 1 ? graphConfig.startR : graphConfig.vlSize,
                graphConfig.vlSize + graphConfig.hGap,
                graphConfig.rectHeight / 2,
                graphConfig.rectHeight / 2
              )
            )
            .attr("stroke", graphConfig.lineColor);
          // .append("line")
          // .attr("x1", graphConfig.circleR * 2)
          // .attr("y1", graphConfig.rectHeight / 2)
          // .attr("x2", graphConfig.circleR * 2 + graphConfig.hGap)
          // .attr("y2", graphConfig.rectHeight / 2)
          // .attr("marker-end", "url(#arrow)");
        },
        (update) => {},
        (exist) => {
          exist.remove();
        }
      );
  }
  // draw a line with arrow
  calcArrowPath(x1, x2, y1, y2, size = 10, arrowAngle = Math.PI / 6) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    const arrowLeftX = midX - size * Math.cos(angle - arrowAngle);
    const arrowLeftY = midY - size * Math.sin(angle - arrowAngle);
    const arrowRightX = midX - size * Math.cos(angle + arrowAngle);
    const arrowRightY = midY - size * Math.sin(angle + arrowAngle);

    // 创建路径字符串
    const pathData = `M ${x1} ${y1} L ${x2} ${y2} 
                  M ${midX} ${midY} L ${arrowLeftX} ${arrowLeftY} 
                  M ${midX} ${midY} L ${arrowRightX} ${arrowRightY}`;
    return pathData;
  }
}

export { PathGraph };
