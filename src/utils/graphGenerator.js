import vegaEmbed, { vega } from "vega-embed";
/* generate a force svg graph */
class ForceGraph {
  constructor(containerId, nodeData, linkData) {
    // viewbox of container svg
    this.containerViewWidth = 1920;
    this.containerViewHeight = 1080;
    // node & link data for controling force graph
    // add config variables into origin data
    this.nodeData = nodeData.map((d) => ({
      ...d,
      showVL: false,
      vlConfig: null, // {view, border(w/h/r), img(w/h)}
    }));
    this.linkData = linkData.map((d) => ({
      ...d,
    }));
    // set attr of svg container
    this.svgContainer = this.setSvgContainer(containerId);
    // create id map for nodes & links data
    this.nodeIdMap = new Map();
    this.linkIdMap = new Map();
    this.nodeData.forEach((node) => {
      this.nodeIdMap.set(node.id, node);
    });
    this.linkData.forEach((link) => {
      this.linkIdMap.set(`${link.source}_${link.target}`, link);
    });
    // set initial value of max_layer
    this.maxLayer = d3.max(this.nodeData, (d) => d.layer);
    // other defalt configs
    this.durationTime = 150;
    this.defaltForceConfig = {
      alpha: 1,
      alphaMin: 0.001,
      alphaDecay: 1 - Math.pow(0.001, 1 / 300),
      alphaTarget: 0,
      velocityDecay: 0.4,
      centerX: this.containerViewWidth / 2,
      centerY: this.containerViewHeight / 2,
      centerStrength: 1,
      positionX: this.containerViewWidth / 2,
      positionY: this.containerViewHeight / 2,
      positionStrength: 0.1,
      collideStrength: 1,
      chargeStrength: -250,
      radialStrength: 1,
      nodeR: 10,
      rIncrease: 250,
    };
    this.defaltDomConfig = {
      // base circle
      circleR: 10,
      circleFill: "#aaa",
      // vl border
      borderFill: "#fff",
      borderStroke: "#ccc",
      borderWidth: 1.5,
      borderCornerR: 10,
      // vl icon
      vlIconSize: 15,
      vlIconGap: 2,
      vlIconColor: "#aaa",
      // other
      durationTime: this.durationTime,
      // bg circle
      bgCircleStroke: "#aaa",
      bgCircleWidth: 2.5,
      rIncrease: this.defaltForceConfig.rIncrease,
    };
  }

  /* set attr of svg_container
   * return its d3_ref */
  setSvgContainer(containerId) {
    const svgContainer = d3.select(containerId);
    const containerViewWidth = this.containerViewWidth;
    const containerViewHeight = this.containerViewHeight;
    svgContainer
      .attr("viewBox", [0, 0, containerViewWidth, containerViewHeight])
      .attr("preserveAspectRatio", "xMidYMid slice");
    return svgContainer;
  }

  /* draw force graph within a svg_container */
  createForceGraph(options = {}) {
    // this.drawBackground();
    const svgContainer = this.svgContainer;
    // freeze the 'zero' node
    const zeroData = this.nodeIdMap.get(0);
    zeroData.fx = this.containerViewWidth / 2;
    zeroData.fy = this.containerViewHeight / 2;
    // processing
    const config = { ...this.defaltForceConfig, ...options };
    // create 3 top elements
    const bgTopG = svgContainer.append("g").attr("class", "topg-bg");
    const linkTopG = svgContainer.append("g").attr("class", "topg-link");
    const nodeTopG = svgContainer.append("g").attr("class", "topg-node");
    // update dom by node & link data
    this.updateDomByData();

    const tick = function () {
      const nodeGs = nodeTopG.selectChildren("g");
      const linkGs = linkTopG.selectChildren("g");

      linkGs
        .selectChildren(".base-line")
        .attr("x1", function () {
          const d = d3.select(this.parentNode).datum();
          return d.source.x;
        })
        .attr("y1", function () {
          const d = d3.select(this.parentNode).datum();
          return d.source.y;
        })
        .attr("x2", function () {
          const d = d3.select(this.parentNode).datum();
          return d.target.x;
        })
        .attr("y2", function () {
          const d = d3.select(this.parentNode).datum();
          return d.target.y;
        });

      nodeGs.style("transform", (d) => `translate(${d.x}px,${d.y}px)`);
    };

    const simulation = this.createSimulation(tick, config);
    this.createDrag(simulation, nodeTopG);
    this.createZoom(simulation);
  }

  /* create zoom & apply it to according svg elements */
  createZoom(simulation, { scale = [0.3, 8] } = {}) {
    const self = this;
    const svgContainer = this.svgContainer;
    const topGs = svgContainer.selectChildren("g");
    // zoom function
    const zooming = function (event, d) {
      // get transform
      const transform = event.transform;
      // apply transform to top g elements
      topGs.attr("transform", transform);
    };

    const zoom = d3.zoom().scaleExtent(scale).on("zoom", zooming);
    svgContainer.call(zoom);
  }
  /* create drag & apply it to according svg elements */
  createDrag(simulation, nodeTopG) {
    const self = this;
    // drag function
    const dragstarted = function (event) {
      if (!event.active) {
        simulation
          .alphaTarget(
            +self.defaltForceConfig.alphaTarget + 0.3 > 1
              ? 1
              : +self.defaltForceConfig.alphaTarget + 0.3
          )
          .restart();
      }

      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };
    const dragged = function (event) {
      // 更新节点位置
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };
    const dragended = function (event) {
      if (!event.active) {
        simulation.alphaTarget(self.defaltForceConfig.alphaTarget);
      }

      if (event.subject.pinned) {
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      } else {
        event.subject.fx = null;
        event.subject.fy = null;
      }
    };
    // create drag instance
    const dragDefine = d3
      .drag()
      .container(nodeTopG.node())
      .subject(function () {
        return d3.select(this.parentNode).datum();
      })
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
    // apply drag to svg elements
    const targetNodeGs = nodeTopG.selectChildren("g").filter((d) => d.id !== 0);
    targetNodeGs.selectChildren(".base-circle").call(dragDefine);
    targetNodeGs.selectChildren(".vl-container").call(dragDefine);
  }

  /* create force simulation
   * return simulation */
  createSimulation(
    tick,
    {
      alpha,
      alphaMin,
      alphaDecay,
      alphaTarget,
      velocityDecay,
      centerX,
      centerY,
      centerStrength,
      positionX,
      positionY,
      positionStrength,
      collideStrength,
      chargeStrength,
      radialStrength,
      nodeR,
      rIncrease,
    } = {}
  ) {
    const nodeData = this.nodeData;
    const linkData = this.linkData;
    const simulation = d3
      .forceSimulation(nodeData)
      .force("charge", d3.forceManyBody().strength(chargeStrength))
      .force(
        "center",
        d3.forceCenter(centerX, centerY).strength(centerStrength)
      )
      .force(
        "radial",
        d3
          .forceRadial()
          .radius((d) => d.layer * rIncrease)
          .x(centerX)
          .y(centerY)
          .strength(radialStrength)
      )
      //   .force("x", d3.forceX().x(positionX).strength(positionStrength))
      //   .force("y", d3.forceY().y(positionY).strength(positionStrength))
      .force("collide", d3.forceCollide(nodeR).strength(collideStrength))
      .force(
        "link",
        d3
          .forceLink(linkData)
          .id((d) => d.id)
          .distance(rIncrease)
      )
      .alpha(alpha)
      .alphaMin(alphaMin)
      .alphaTarget(alphaTarget)
      .alphaDecay(alphaDecay)
      .velocityDecay(velocityDecay)
      .on("tick", tick);
    return simulation;
  }

  /* 'refresh' DOM by new data*/
  updateDomByData(
    {
      // base circle
      circleR,
      circleFill,
      // vl border
      borderFill,
      borderStroke,
      borderWidth,
      borderCornerR,
      // vl icon
      vlIconSize,
      vlIconGap,
      vlIconColor,
      // other
      durationTime,
      // bg circle
      bgCircleStroke,
      bgCircleWidth,
      rIncrease,
    } = this.defaltDomConfig
  ) {
    const self = this;
    const nodeData = this.nodeData;
    const linkData = this.linkData;
    const svgContainer = this.svgContainer;
    const nodeTopG = svgContainer.selectChild(".topg-node");
    const linkTopG = svgContainer.selectChild(".topg-link");
    const bgTopG = svgContainer.selectChild(".topg-bg");

    bgTopG
      .selectAll("circle")
      .data(d3.range(1, this.maxLayer + 1))
      .join(
        (enter) => {
          const bgCircles = enter
            .append("circle")
            .attr("class", "bg-circle")
            .attr("r", (d) => d * rIncrease)
            .attr("cx", this.containerViewWidth / 2)
            .attr("cy", this.containerViewHeight / 2)
            .attr("stroke", bgCircleStroke)
            .attr("stroke-width", bgCircleWidth)
            .attr("fill", "none")
            .attr("opacity", 0);

          this.fadeInTransition(bgCircles, 0.3);
        },
        (update) => update,
        (exit) => {
          this.fadeOutTransition(exit);
        }
      );
    nodeTopG
      .selectAll("g")
      .data(nodeData, (d) => d.id)
      .join(
        (enter) => {
          const nodeGs = enter.append("g");
          // add base circle
          nodeGs
            .append("circle")
            .attr("class", "base-circle")
            .attr("cursor", "pointer")
            .attr("r", (d) => (d.id === 0 ? circleR * 1.5 : circleR))
            .attr("fill", (d) => (d.id === 0 ? "red" : circleFill))
            .attr("display", function () {
              const data = d3.select(this.parentNode).datum();
              return data.showVL ? "none" : null;
            })
            .on("click", function () {
              // get top g & data of this node
              const topG = d3.select(this.parentNode);
              const data = topG.datum();
              if (data.id !== 0) {
                // change data
                data.showVL = false;
                // switch display btw circle and vega-lite
                const baseCirlce = topG.selectChild(".base-circle");
                self.fadeOutTransition(baseCirlce, "hide");
                // reset attr of vl-container, prepare for animation
                const vlContainer = topG.selectChild(".vl-container");
                vlContainer.attr("opacity", 0).attr("display", null);
                vlContainer
                  .selectChild(".border")
                  .attr("width", 0)
                  .attr("height", 0);

                // if don't have config, draw vega-lite graph
                if (!data.vlConfig) {
                  self.drawVl(topG);
                } else {
                  // add fade-in animation
                  self.vlInTransition(
                    vlContainer,
                    data.vlConfig.border.width,
                    data.vlConfig.border.height
                  );
                }
              }
            });

          // add vega-lite related
          // g as vega-lite container
          const vegeLiteContainers = nodeGs
            .append("g")
            .attr("class", "vl-container")

            .attr("display", function () {
              const data = d3.select(this.parentNode).datum();
              return !data.showVL ? "none" : null;
            });
          // rect as border
          const borders = vegeLiteContainers
            .append("rect")
            .attr("class", "border")
            .attr("fill", borderFill)
            .attr("stroke", borderStroke)
            .attr("stroke-width", borderWidth)
            .attr("rx", borderCornerR);

          // rect as headers
          const headers = vegeLiteContainers
            .append("g")
            .attr("class", "header");
          // add vl icons

          headers
            .append("use")
            .attr("href", "#close")
            .attr("class", ".icon-close")
            .attr("cursor", "pointer")
            .attr("width", vlIconSize)
            .attr("height", vlIconSize)
            .attr("fill", vlIconColor)
            .style("transform", `translate(${-vlIconSize - vlIconGap}px, ${0})`)
            .on("click", function () {
              const topG = d3.select(this.parentNode.parentNode.parentNode);
              const vlContainer = topG.selectChild(".vl-container");
              const baseCirlce = topG.selectChild(".base-circle");
              const vlConfig = topG.datum().vlConfig;
              // add animation of vl graph
              self.vlOutTransition(
                vlContainer,
                vlConfig.border.width,
                vlConfig.border.height
              );
              // prepare base-cirle for fade-in animation
              baseCirlce.attr("display", null).attr("opacity", 0);
              // add animation of base-circle
              self.fadeInTransition(baseCirlce, 1, self.durationTime + 100);
            });
          headers
            .append("use")
            .attr("href", "#question")
            .attr("class", ".icon-close")
            .attr("cursor", "pointer")
            .attr("width", vlIconSize)
            .attr("height", vlIconSize)
            .attr("fill", vlIconColor)
            .style(
              "transform",
              `translate(${-(vlIconSize + vlIconGap) * 2}px, ${0})`
            );

          const vlBoxes = vegeLiteContainers
            .append("g")
            .attr("class", "vl-box");

          // add animation
          this.fadeInTransition(nodeGs);
        },
        (update) => update,
        (exit) => {
          this.fadeOutTransition(exit);
        }
      );
    linkTopG
      .selectAll("g")
      .data(linkData, (d) => {
        if (typeof d.source === "object") {
          return `${d.source.id}_${d.target.id}`;
        } else {
          return `${d.source}_${d.target}`;
        }
      })
      .join(
        (enter) => {
          const linkGs = enter.append("g");
          linkGs
            .append("line")
            .attr("class", "base-line")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", 1);

          // add animation
          this.fadeInTransition(linkGs);
        },
        (update) => update,
        (exit) => {
          this.fadeOutTransition(exit);
        }
      );
  }

  /* show vega-lite graph within topG */
  drawVl(
    topG,
    {
      durationTime = this.durationTime,
      vlWidth = 125,
      vlHeight = 125,
      borderWidthOffset = 3,
      borderHeightOffset = 8,
      vlIconSize = this.defaltDomConfig.vlIconSize,
      vlIconGap = this.defaltDomConfig.vlIconGap,
    } = {}
  ) {
    const vlContainer = topG.selectChild(".vl-container");
    const vlBox = vlContainer.selectChild(".vl-box");

    // create new config data
    let configData = {
      view: null,
      border: null,
      img: null,
    };
    const data = topG.datum();
    data.vlConfig = configData;
    // create new vega-lite svg
    const vlSpec = JSON.parse(data["vega-lite"]);
    // add options
    vlSpec["width"] = vlWidth;
    vlSpec["height"] = vlHeight;
    vlSpec["usermeta"] = { embedOptions: { renderer: "svg" } };
    // generate vega-lite svg
    vegaEmbed(vlBox.node(), vlSpec).then((result) => {
      // get view data
      const view = result.view.background("transparent");
      configData.view = view;
      // get svg element, and reposition it
      const vlSvg = vlBox.select("svg").attr("class", "svg-graph");
      vlBox.style(
        "transform",
        `translate(${borderWidthOffset}px, ${borderHeightOffset}px)`
      );
      // remove unrelated generated components
      vlBox.node().appendChild(vlSvg.node());
      vlBox.selectChild("div").remove();
      vlBox.selectChild("details").remove();
      // get w&h of svg
      const graphWidth = vlSvg.attr("width");
      const graphHeight = vlSvg.attr("height");
      // set img config
      configData.img = {
        width: graphWidth,
        height: graphHeight,
      };
      // compute position/shape data of components
      const borderWidth = +graphWidth + borderWidthOffset * 2;
      const borderHeight = +graphHeight + borderHeightOffset * 2;
      const translateX = borderWidth / 2;
      const translateY = borderHeight / 2;
      // set border config
      configData.border = {
        r: Math.sqrt(Math.pow(translateX, 2) + Math.pow(translateY, 2)),
        width: borderWidth,
        height: borderHeight,
      };

      // set position of whole vega-lite graph
      vlContainer.style(
        "transform",
        `translate(${-borderWidth / 2}px, ${-borderHeight / 2}px)`
      );
      // set position of header(icons)
      vlContainer
        .selectChild(".header")
        .style(
          "transform",
          `translate(${borderWidth}px,${-vlIconSize - vlIconGap}px)`
        );
      // add animation
      this.vlInTransition(vlContainer, borderWidth, borderHeight);
    });
  }

  // specific transition for vega-lite graph - in
  vlInTransition(vlContainer, width, height, duration = this.durationTime) {
    vlContainer
      .selectChild(".border")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .transition()
      .duration(duration)
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height);

    vlContainer
      .transition()
      .duration(duration + 100)
      .attr("opacity", 1);
  }
  // specific transition for vega-lite graph - out
  vlOutTransition(vlContainer, width, height, duration = this.durationTime) {
    vlContainer
      .selectChild(".border")
      .transition()
      .duration(duration + 150)
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("width", 0)
      .attr("height", 0);

    vlContainer
      .transition()
      .duration(duration)
      .attr("opacity", 0)
      .on("end", function () {
        vlContainer.attr("display", "none");
      });
  }

  // apply fade-in transition to a selection
  fadeInTransition(selection, opacity = 1, duration = this.durationTime) {
    selection.transition().duration(duration).attr("opacity", opacity);
  }
  /* apply fade-out transition to a selection
   * endAction: 'remove' / 'hide'
   */
  fadeOutTransition(
    selection,
    endAction = "remove",
    opacity = 0,
    duration = this.durationTime
  ) {
    selection
      .transition()
      .duration(duration)
      .attr("opacity", 0)
      .on("end", function () {
        if (endAction === "remove") {
          d3.select(this).remove();
        } else if (endAction === "hide") {
          d3.select(this).attr("display", "none");
        }
      });
  }
}

export { ForceGraph };
