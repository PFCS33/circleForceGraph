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
      vegaLiteConfig: null, // {view, border(w/h/r), img(w/h)}
    }));
    this.linkData = linkData.map((d) => ({
      ...d,
    }));
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
    // other defalt configs
    this.defaltConfig = {
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
    this.durationTime = 150;
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
    this.drawBackground();
    const svgContainer = this.svgContainer;
    // freeze the 'zero' node
    const zeroData = this.nodeIdMap.get(0);
    zeroData.fx = this.containerViewWidth / 2;
    zeroData.fy = this.containerViewHeight / 2;
    // processing
    const config = { ...this.defaltConfig, ...options };
    // create 2 top elements
    const linkTopG = svgContainer.append("g").attr("class", "topg-link");
    const nodeTopG = svgContainer.append("g").attr("class", "topg-node");
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

  drawBackground({ rIncrease = this.defaltConfig.rIncrease } = {}) {
    const backgroundG = this.svgContainer.append("g").attr("class", "topg-bg");
    for (let i = 4; i > 0; i--) {
      backgroundG
        .append("circle")
        .attr("r", i * rIncrease)
        .attr("cx", this.containerViewWidth / 2)
        .attr("cy", this.containerViewHeight / 2)
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1)
        .attr("fill", "#fff");
    }
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
            +self.defaltConfig.alphaTarget + 0.3 > 1
              ? 1
              : +self.defaltConfig.alphaTarget + 0.3
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
        simulation.alphaTarget(self.defaltConfig.alphaTarget);
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
    nodeTopG
      .selectChildren("g")
      .filter((d) => d.id !== 0)
      .selectChildren(".base-circle")
      .call(dragDefine);
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
  updateDomByData({
    circleR = 10,
    circleFill = "#aaa",
    borderFill = "#fff",
    borderStroke = "#ccc",
    borderWidth = 1.5,
    durationTime = this.durationTime,
  } = {}) {
    const self = this;
    const nodeData = this.nodeData;
    const linkData = this.linkData;
    const svgContainer = this.svgContainer;
    const nodeTopG = svgContainer.selectChild(".topg-node");
    const linkTopG = svgContainer.selectChild(".topg-link");
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
            .style("transition", "transform 0.2s")
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
                topG.selectChild(".base-circle").attr("display", "none");
                topG.selectChild(".vegalite-container").attr("display", null);
                // draw vega-lite graph
                self.drawVegaLite(topG);
              }
            });

          // add vega-lite related
          // g as vega-lite container
          const vegeLiteContainers = nodeGs
            .append("g")
            .attr("class", "vegalite-container")
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
            .attr("pointer-events", "none");
          // rect as headers
          const headers = vegeLiteContainers
            .append("g")
            .attr("class", "header");

          const vegaLiteBoxes = vegeLiteContainers
            .append("g")
            .attr("class", "vegalite-box");

          // add animation
          nodeGs
            .attr("opacity", 0)
            .transition()
            .duration(durationTime)
            .attr("opacity", 1);
        },
        (update) => update,
        (exit) => {
          exit
            .attr("opacity", 1)
            .transition()
            .duration(durationTime)
            .attr("opacity", 0)
            .remove();
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
          linkGs
            .attr("opacity", 0)
            .transition()
            .duration(durationTime)
            .attr("opacity", 1);
        },
        (update) => update,
        (exit) => {
          exit
            .attr("opacity", 1)
            .transition()
            .duration(durationTime)
            .attr("opacity", 0)
            .remove();
        }
      );
  }

  /* show vega-lite graph within topG */
  drawVegaLite(
    topG,
    {
      durationTime = this.durationTime,
      vegaLiteWidth = 100,
      vegaLiteHeight = 150,
      borderWidthOffset = 3,
      borderHeightOffset = 8,
      borderCornerR = 10,
    } = {}
  ) {
    let configData = topG.datum().vegaLiteConfig;

    const vegaLiteContainer = topG.selectChild(".vegalite-container");
    const vegaLiteBox = vegaLiteContainer.selectChild(".vegalite-box");
    if (configData) {
    } else {
      // create new config data
      configData = {
        view: null,
        border: null,
        img: null,
      };
      const data = topG.datum();
      data.vegaLiteConfig = configData;
      // create new vega-lite svg
      const vlSpec = JSON.parse(data["vega-lite"]);
      // add options
      vlSpec["width"] = vegaLiteWidth;
      vlSpec["height"] = vegaLiteHeight;
      vlSpec["usermeta"] = { embedOptions: { renderer: "svg" } };
      // generate vega-lite svg
      vegaEmbed(vegaLiteBox.node(), vlSpec).then((result) => {
        // get view data
        const view = result.view.background("transparent");
        configData.view = view;
        // get svg element, and reposition it
        const vegaLiteSvg = vegaLiteBox
          .select("svg")
          .attr("class", "svg-graph");
        vegaLiteBox.style(
          "transform",
          `translate(${borderWidthOffset}px, ${borderHeightOffset}px)`
        );
        // remove unrelated generated components
        vegaLiteBox.node().appendChild(vegaLiteSvg.node());
        vegaLiteBox.selectChild("div").remove();
        vegaLiteBox.selectChild("details").remove();
        // get w&h of svg
        const graphWidth = vegaLiteSvg.attr("width");
        const graphHeight = vegaLiteSvg.attr("height");
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
        vegaLiteContainer.style(
          "transform",
          `translate(${-borderWidth / 2}px, ${-borderHeight / 2}px)`
        );
        // set position of other components & add animation
        vegaLiteContainer
          .selectChild(".border")
          .attr("rx", borderCornerR)
          .attr("width", 0)
          .attr("height", 0)
          .transition()
          .duration(durationTime)

          .attr("width", borderWidth)
          .attr("height", borderHeight);
        // add animation of svg
        vegaLiteSvg
          .attr("fill-opacity", 0)
          .attr("stroke-opacity", 0)
          .transition()
          .duration(durationTime + 25)
          .attr("fill-opacity", 1)
          .attr("stroke-opacity", 1);
      });
    }
  }
}

export { ForceGraph };
