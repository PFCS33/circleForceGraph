import vegaEmbed from "vega-embed";
import EventEmitter from "@/utils/common/eventEmitter.js";

/* generate a force svg graph */
class ForceGraph extends EventEmitter {
  constructor(containerId, nodeData, linkData) {
    super();
    // viewbox of container svg
    this.containerViewWidth = 1920;
    this.containerViewHeight = 1080;
    // set freeze mode of whole graph
    this.hasFreeze = false;
    this.freezeFocusId = -1;
    // prepare ref for tooltip
    this.tooltip = null;
    // create id map for nodes & links data
    this.nodeIdMap = new Map();
    this.linkIdMap = new Map();
    // node & link data for controling force graph
    // add config variables into origin data
    this.nodeData = this.constructNodeData(nodeData);
    this.linkData = linkData.map((d) => ({
      ...d,
    }));
    // set id-maps
    this.resetIdMap();
    // set max layer
    this.maxLayer = this.getMaxLayer();
    // other variables' initialization
    this.svgContainer = this.setSvgContainer(containerId);
    this.simulation = null;
    // set initial value of max_layer

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
      positionStrength: -0.1,
      collideStrength: 1,
      chargeStrength: -250,
      radialStrength: 1,
      nodeR: 30,
      baseRadius: 250,
    };
    this.defaltDomConfig = {
      // base circle
      circleR: this.defaltForceConfig.nodeR,
      circleFill: "#aaa",
      // insight icon
      insightIconSize: 45,
      // vl border
      borderFill: "#fff",
      borderStroke: "#ccc",
      borderWidth: 5,
      borderCornerR: 10,
      // vl icon
      vlIconSize: 20,
      vlIconGap: 3,
      // vlIconColor: "#aaa",
      // other
      durationTime: this.durationTime,
      // bg circle
      bgCircleStroke: "#aaa",
      bgCircleWidth: 2.5,
      // tooltip
      ttWidth: 300,
      ttHeight: 120,
      ttGap: 15,
      ttFontSize: 14,
      textGap: 5,
    };
  }
  /* -------------------------------------------------------------------------- */
  // initializer
  /* -------------------------------------------------------------------------- */
  /* draw force graph within a svg_container */
  createForceGraph(options = {}) {
    const self = this;
    const svgContainer = this.svgContainer;
    // freeze the 'zero' node
    const zeroData = this.nodeIdMap.get(0);
    zeroData.fx = this.containerViewWidth / 2;
    zeroData.fy = this.containerViewHeight / 2;
    // processing ...
    const config = { ...this.defaltForceConfig, ...options };
    // create 3 top elements
    const bgTopG = svgContainer.append("g").attr("class", "topg-bg ");
    const linkTopG = svgContainer.append("g").attr("class", "topg-link ");
    const nodeTopG = svgContainer.append("g").attr("class", "topg-node ");
    // construct tooltip
    this.createToolTip();
    // create force
    this.simulation = this.createSimulation(tick, config);
    // create drag & zoom
    this.dragDefine = this.createDrag(this.simulation, nodeTopG);
    this.createZoom(this.simulation);

    // update dom by node & link data
    this.updateDomByData();

    // tick function
    function tick() {
      const nodeGs = nodeTopG.selectChildren("g");
      const linkGs = linkTopG.selectChildren("g");

      // force position of nodes to be on circle
      const centerX = self.defaltForceConfig.centerX;
      const centerY = self.defaltForceConfig.centerY;
      nodeGs.each(function (d) {
        if (d.id != 0) {
          let dx = d.x - centerX;
          let dy = d.y - centerY;
          const disToCenter = Math.sqrt(dx * dx + dy * dy);
          const targetDis = self.getLayerR(d.layer);
          const ratio = targetDis / disToCenter;
          d.x = centerX + dx * ratio;
          d.y = centerY + dy * ratio;
        }
      });
      // update base-line position
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

      // update angle-line position (redraw d attr of path)
      linkGs.selectChildren(".angle-line").attr("d", function () {
        const d = d3.select(this.parentNode).datum();
        let point1 = [];
        let point2 = [];
        const relType = d.relType;

        if (relType === "specialization") {
          point1 = [d.source.x, d.source.y];
          point2 = [d.target.x, d.target.y];
        } else {
          point1 = [d.target.x, d.target.y];
          point2 = [d.source.x, d.source.y];
        }
        const widthAtStart = 15;
        const widthAtEnd = 1;

        const angle = Math.atan2(point2[1] - point1[1], point2[0] - point1[0]);

        const p1 = [
          point1[0] + widthAtStart * Math.sin(angle),
          point1[1] - widthAtStart * Math.cos(angle),
        ];

        const p2 = [
          point1[0] - widthAtStart * Math.sin(angle),
          point1[1] + widthAtStart * Math.cos(angle),
        ];

        const p3 = [
          point2[0] - widthAtEnd * Math.sin(angle),
          point2[1] + widthAtEnd * Math.cos(angle),
        ];

        const p4 = [
          point2[0] + widthAtEnd * Math.sin(angle),
          point2[1] - widthAtEnd * Math.cos(angle),
        ];

        return `M${p1} L${p2} L${p3} L${p4} Z`;
      });
      // move relationship border
      // linkGs
      //   .selectChildren(".relationship-border")
      //   .style(
      //     "transform",
      //     (d) =>
      //       `translate(${(d.target.x + d.source.x) / 2}px,${
      //         (d.target.y + d.source.y) / 2
      //       }px)`
      //   );
      nodeGs.style("transform", (d) => `translate(${d.x}px,${d.y}px)`);
    }
  }
  createToolTip() {
    const tooltip = d3
      .select(this.svgContainer.node().parentNode)
      .append("div")
      .attr("class", "tooltip")
      // .style("width", this.defaltDomConfig.ttWidth + "px")
      .style("max-width", this.defaltDomConfig.ttWidth + "px")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("overflow", "auto")
      .style("font-size", `${this.defaltDomConfig.ttFontSize}px`)
      .style("color", "#aaa")
      .style("border", "1px solid #555")
      .style("background-color", "#fff")
      .style("padding", `${this.defaltDomConfig.textGap}px`)
      .style("z-index", 99)
      .style("position", "fixed");

    // tooltip
    //   .append("rect")
    //   .attr("class", "background")
    //   .attr("width", this.defaltDomConfig.ttWidth)
    //   .attr("height", this.defaltDomConfig.ttHeight)
    //   .style("fill", "#fff")
    //   .attr("stroke", this.defaltDomConfig.bgCircleStroke)
    //   .attr("stroke-width", this.defaltDomConfig.bgCircleWidth);

    // tooltip
    //   .append("foreignObject")
    //   .attr("width", this.defaltDomConfig.ttWidth)
    //   .attr("height", this.defaltDomConfig.ttHeight)
    //   .append("xhtml:div")
    //   .attr("class", "text")
    //   .style("width", `${this.defaltDomConfig.ttWidth}px`)
    //   .style("height", `${this.defaltDomConfig.ttHeight}px`)

    // tooltip
    //   .append("text")
    //   .attr("class", "text")
    //   .style("font-size", this.defaltDomConfig.ttFontSize)
    //   .style("fill", "#aaa")
    //   .style(
    //     "transform",
    //     `translate(${this.defaltDomConfig.textGap}px, ${
    //       this.defaltDomConfig.ttFontSize + this.defaltDomConfig.textGap
    //     }px)`
    //   );
    this.tooltip = tooltip;
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
    } = {}
  ) {
    const nodeData = this.nodeData;
    const linkData = this.linkData;
    const simulation = d3
      .forceSimulation(nodeData)
      // do not need these 3 kinds of forces, cause strange behaviour
      // .force(
      //   "center",
      //   d3.forceCenter(centerX, centerY).strength(centerStrength)
      // )
      // .force("x", d3.forceX().x(positionX).strength(positionStrength))
      // .force("y", d3.forceY().y(positionY).strength(positionStrength))
      .force(
        "radial",
        d3
          .forceRadial()
          .radius((d) => this.getLayerR(d.layer))
          .x(centerX)
          .y(centerY)
          .strength(radialStrength)
      )
      .force(
        "charge",
        d3.forceManyBody().strength((d) => {
          if (d.id == 0) {
            return chargeStrength;
          } else {
            if (d.showVL) {
              return chargeStrength * 2;
            } else {
              return chargeStrength;
            }
          }
        })
      )
      .force(
        "collide",
        d3
          .forceCollide((d) => {
            if (d.showVL) {
              return d.vlConfig.border.r;
            } else {
              return nodeR;
            }
          })
          .strength(collideStrength)
      )
      .force(
        "link",
        d3
          .forceLink(linkData)
          .id((d) => d.id)
          .distance((d) => {
            const sourceNode = d.source;
            const targetNode = d.target;
            let distance =
              this.getLayerR(targetNode.layer) -
              this.getLayerR(sourceNode.layer);
            // if (sourceNode.showVL) {
            //   distance += 10;
            // }
            // if (targetNode.showVL) {
            //   distance += 10;
            // }

            return distance;
          })
      )
      .alpha(alpha)
      .alphaMin(alphaMin)
      .alphaTarget(alphaTarget)
      .alphaDecay(alphaDecay)
      .velocityDecay(velocityDecay)
      .on("tick", tick);
    return simulation;
  }
  /* create zoom & apply it to according svg elements */
  createZoom(simulation, { scale = [0.3, 8] } = {}) {
    const self = this;
    const svgContainer = this.svgContainer;
    let topGs = svgContainer.selectChildren("g");

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
      if (!event.active && !self.hasFreeze) {
        simulation
          .alphaTarget(
            +self.defaltForceConfig.alphaTarget + 0.5 > 1
              ? 1
              : +self.defaltForceConfig.alphaTarget + 0.5
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
      if (!event.active && !self.hasFreeze) {
        simulation.alphaTarget(self.defaltForceConfig.alphaTarget);
      }

      if (event.subject.hasPinned) {
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
    // const targetNodeGs = nodeTopG.selectChildren("g").filter((d) => d.id !== 0);
    // targetNodeGs.selectChildren(".circle-container").call(dragDefine);
    // targetNodeGs.selectChildren(".vl-container").call(dragDefine);
    return dragDefine;
  }
  /* -------------------------------------------------------------------------- */
  // update
  /* -------------------------------------------------------------------------- */

  /*
    contruct new data based on tree's info and old data value
   */
  constructNodeData(nodeData) {
    return nodeData.map((item) => {
      const oldValue = this.nodeIdMap.get(item.id);
      let newNode = null;
      if (oldValue) {
        newNode = {
          // inherit the oldvalue
          ...oldValue,
          // ovrride position
          x: item.x ? item.x : oldValue.x,
          y: item.y ? item.y : oldValue.y,
          layer: item.layer,
        };
      } else {
        // add config variables into origin data
        newNode = {
          ...item,
          showVL: false,
          hasPinned: false,
          vlConfig: null, // {view, border(w/h/r), img(w/h)}
        };
      }

      return newNode;
    });
  }

  /*
     rebind new data into whole graph system
   */
  updateGraphData(graphData) {
    this.simulation.stop();
    // reset node & link data
    this.nodeData = this.constructNodeData(graphData.node);
    this.linkData = graphData.link;
    // reset other data
    this.resetIdMap();
    this.maxLayer = this.getMaxLayer();
    console.log("graph before", this.nodeData);
    this.updateDomByData();
    console.log("graph after", this.nodeData);
    this.rebindSimulation();
  }

  rebindSimulation() {
    const simulation = this.simulation;
    // rebind data of simulation
    simulation.nodes(this.nodeData);
    simulation.force("link").links(this.linkData);
    // reset alpha to reheat
    simulation.alpha(this.defaltForceConfig.alpha);
    simulation.restart();
  }

  resetIdMap() {
    // set id-maps
    this.nodeIdMap.clear();
    this.linkIdMap.clear();
    this.nodeData.forEach((node) => {
      this.nodeIdMap.set(node.id, node);
    });
    this.linkData.forEach((link) => {
      this.linkIdMap.set(`${link.source}_${link.target}`, link);
    });
  }

  getMaxLayer() {
    return d3.max(this.nodeData, (d) => d.layer);
  }

  /* 'refresh' DOM by new data*/
  updateDomByData(
    {
      // base circle
      circleR,
      circleFill,
      // insight icon
      insightIconSize,
      // vl border
      borderFill,
      borderStroke,
      borderWidth,
      borderCornerR,
      // vl icon
      vlIconSize,
      vlIconGap,
      // other
      durationTime,
      // bg circle
      bgCircleStroke,
      bgCircleWidth,
    } = this.defaltDomConfig
  ) {
    const self = this;
    const nodeData = this.nodeData;
    const linkData = this.linkData;
    const svgContainer = this.svgContainer;
    const nodeTopG = svgContainer.selectChild(".topg-node");
    const linkTopG = svgContainer.selectChild(".topg-link");
    const bgTopG = svgContainer.selectChild(".topg-bg");
    // create map between insight category and color
    const CategoryColorMap = d3.scaleOrdinal(
      ["point", "shape", "compound"],
      ["#C69DE9", "#F7A69F", "#53C4B6"]
    );
    bgTopG
      .selectChildren("circle")
      .data(d3.range(1, this.maxLayer + 1))
      .join(
        (enter) => {
          const bgCircles = enter
            .append("circle")
            .attr("class", "bg-circle")
            .attr("r", (d) => this.getLayerR(d))
            .attr("cx", this.containerViewWidth / 2)
            .attr("cy", this.containerViewHeight / 2)
            .attr("stroke", bgCircleStroke)
            .attr("stroke-width", bgCircleWidth)
            .attr("fill", "none")
            .style("opacity", 0);
          this.fadeInTransition(bgCircles, 0.3);
        },
        (update) => update,
        (exit) => {
          this.fadeOutTransition(exit);
        }
      );

    nodeTopG
      .selectChildren("g")
      .data(nodeData, (d) => d.id)
      .join(
        (enter) => {
          const nodeGs = enter.append("g");
          // add container of circle related
          const circleContainer = nodeGs
            .append("g")
            .attr("class", "circle-container");

          // in freeze mode's start node, click event will response
          const startNodeContainer = circleContainer
            .filter((d) => d.id === 0)
            .on("click", function () {
              if (self.hasFreeze) {
                self.emit("freeze-node-click", {
                  id: 0,
                });
              }
            });

          // add cursor event above g
          circleContainer
            .filter((d) => d.id !== 0)
            .call(this.dragDefine)
            .style("display", function () {
              const data = d3.select(this.parentNode).datum();
              return data.showVL ? "none" : null;
            })
            .on("click", function () {
              // get top g & data of this node
              const topG = d3.select(this.parentNode);
              const circleContainer = d3.select(this);
              const data = topG.datum();
              // if freeze mode, just emit event and return
              if (self.hasFreeze) {
                self.emit("freeze-node-click", {
                  id: data.id,
                });
                return;
              }
              // emit node click event
              self.emit("node-click", {
                id: data.id,
                realId: data["realId"],
                element: topG.selectChild(".vl-container"),
              });
              // emit question click event
              self.emit("question-click", {
                id: data.id,
                realId: data["realId"],
                element: topG,
              });
              // switch display btw circle and vega-lite
              // change data
              data.showVL = true;
              self.fadeOutTransition(circleContainer, "hide");
              // reset attr of vl-container, prepare for animation
              const vlContainer = topG.selectChild(".vl-container");
              vlContainer.style("opacity", 0).style("display", null);
              vlContainer
                .selectChildren(".border")
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
                self.refreshSimNodes();
              }
            })
            .on("mouseover", function () {
              const circleContainer = d3.select(this);
              // add hover class, prepare for adding fancier css
              circleContainer.classed("has-hover", true);
            })
            .on("mouseout", function () {
              // cancle hover class
              const circleContainer = d3.select(this);
              circleContainer.classed("has-hover", false);
            });
          // add base circle
          circleContainer
            .append("circle")
            .attr("class", "base-circle")
            .attr("cursor", "pointer")
            .attr("r", (d) => (d.id === 0 ? circleR * 1.2 : circleR))
            .attr("fill", (d) =>
              d.id === 0 ? "#64748b" : CategoryColorMap(d.category)
            );

          // add custom icon png
          circleContainer
            .append("image")
            .attr("class", "insight-icon")
            .attr("width", insightIconSize)
            .attr("height", insightIconSize)
            .attr("x", -insightIconSize / 2)
            .attr("y", -insightIconSize / 2)
            .attr("pointer-events", "none")
            .attr("href", function () {
              const topG = d3.select(this.parentNode);
              const data = topG.datum();
              const type = data.id === 0 ? "start" : data.type;
              const href = `/pic/insight-icon/${type}.png`;
              return href;
            });

          // add vega-lite related
          // g as vega-lite container
          const vlContainer = nodeGs
            .append("g")
            .call(this.dragDefine)
            .attr("class", "vl-container")
            .style("display", function () {
              const data = d3.select(this.parentNode).datum();
              return !data.showVL ? "none" : null;
            })

            .on("dblclick", function () {
              // if it is freeze mode, just reutrn
              if (self.hasFreeze) {
                return;
              }
              const data = d3.select(this.parentNode).datum();
              const vlContainer = d3.select(this);

              self.togglePin(data, vlContainer);
            })

            .on("dblclick.zoom", function (event) {
              event.preventDefault();
              event.stopPropagation();
            });
          // add spinner container
          const spinnerContainers = nodeGs
            .filter((d) => d.id !== 0)
            .append("g")
            .attr("class", "sp-container")
            .attr("pointer-events", "none")
            .classed("has-query", false);
          const spBG = spinnerContainers
            .append("circle")
            .attr("class", "sp-bg")
            .attr("r", insightIconSize / 2);

          const spinnerIcons = spinnerContainers
            .append("use")
            .attr("class", "sp-icon")
            .attr("href", "#spinner")

            .attr("width", insightIconSize)
            .attr("height", insightIconSize)
            .attr("x", -insightIconSize / 2)
            .attr("y", -insightIconSize / 2);

          const vlBody = vlContainer
            .append("g")
            .attr("class", "vl-body")
            .on("click", function () {
              // emit node click event
              const topG = d3.select(this.parentNode.parentNode);
              const data = topG.datum();
              // if freeze mode, just emit event and return
              if (self.hasFreeze) {
                self.emit("freeze-node-click", {
                  id: data.id,
                });
                return;
              }

              self.emit("node-click", {
                id: data.id,
                realId: data["realId"],
                element: topG.selectChild(".vl-container"),
              });
              self.emit("question-click", {
                id: data.id,
                realId: data["realId"],
                element: topG,
              });
            })
            .on("mouseover", function () {
              const vlBody = d3.select(this);
              vlBody.classed("has-hover", true);
            })
            .on("mouseout", function () {
              const vlBody = d3.select(this);
              vlBody.classed("has-hover", false);
            });
          // rect as border
          const borders = vlBody
            .append("rect")
            .attr("class", "border stroke")
            .attr("fill", borderFill)
            .attr("stroke", borderStroke)
            .attr("stroke-width", borderWidth)
            .attr("rx", borderCornerR);
          const shadowBorders = vlBody
            .append("rect")
            .attr("class", "border shadow")
            .attr("fill", borderFill)
            .attr("stroke", null)
            .attr("rx", borderCornerR);

          // rect as headers
          const headers = vlContainer.append("g").attr("class", "header");
          // add vl icons
          headers
            .append("use")
            .attr("href", "#collapse")
            .attr("class", "vl-icon collapse")
            .attr("cursor", "pointer")
            .attr("width", vlIconSize)
            .attr("height", vlIconSize)
            .style("transform", `translate(${-vlIconSize - vlIconGap}px, ${0})`)
            .on("click", function () {
              // if freeze mode, just  return
              if (self.hasFreeze) {
                return;
              }
              const topG = d3.select(this.parentNode.parentNode.parentNode);
              const data = topG.datum();
              // emit empty node, clear focus status
              self.emit("node-click", {
                id: data.id,
                realId: data["realId"],
                element: null,
              });
              // emit empty node, clear question status
              self.emit("question-click", {
                id: data.id,
                realId: data["realId"],
                element: null,
              });
              // reset fixed status of node, if it was fixed
              const vlContainer = topG.selectChild(".vl-container");
              if (data.hasPinned) {
                self.togglePin(data, vlContainer);
              }
              // change status data about vl-graph, then refandresh simulation parameters
              data.showVL = false;
              self.refreshSimNodes();
              // add animation of vl graph
              const circleContainer = topG.selectChild(".circle-container");
              const vlConfig = data.vlConfig;
              self.vlOutTransition(
                vlContainer,
                vlConfig.border.width,
                vlConfig.border.height
              );
              // prepare base-cirle for fade-in animation
              circleContainer.style("display", null).style("opacity", 0);
              // add animation of base-circle
              self.fadeInTransition(
                circleContainer,
                1,
                self.durationTime + 100
              );
            });
          headers
            .append("use")
            .attr("href", "#question")
            .attr("class", "vl-icon question")
            .attr("cursor", "pointer")
            .attr("width", vlIconSize)
            .attr("height", vlIconSize)
            .style(
              "transform",
              `translate(${-(vlIconSize + vlIconGap) * 2}px, ${0})`
            )
            .on("click", function () {
              // if freeze mode, just  return
              if (self.hasFreeze) {
                return;
              }
              const topG = d3.select(this.parentNode.parentNode.parentNode);
              const data = topG.datum();
              // emit question click event
              self.emit("question-click", {
                id: data.id,
                realId: data["realId"],
                element: topG,
              });
            });

          headers
            .append("use")
            .attr("href", "#pin")
            .attr("class", "vl-icon pin")
            .attr("cursor", "pointer")
            .attr("width", vlIconSize)
            .attr("height", vlIconSize)
            .style(
              "transform",
              `translate(${-(vlIconSize + vlIconGap) * 3}px, ${0})`
            )
            .on("click", function () {
              // if freeze mode, just  return
              if (self.hasFreeze) {
                return;
              }
              const vlContainer = d3.select(this.parentNode.parentNode);
              const data = d3
                .select(this.parentNode.parentNode.parentNode)
                .datum();
              self.togglePin(data, vlContainer);
            });

          // headers
          //   .append("use")
          //   .attr("href", "#close")
          //   .attr("class", "vl-icon close")
          //   .attr("cursor", "pointer")
          //   .attr("width", vlIconSize)
          //   .attr("height", vlIconSize);
          // .on("click", function (e, d) {
          //   // if freeze mode, just  return
          //   if (self.hasFreeze) {
          //     return;
          //   }
          //   self.emit("node-delete", d.id);
          // });
          // .style("transform", `translate(${-vlIconSize - vlIconGap}px, ${0})`)
          // container for vl graph
          const vlBoxes = vlBody.append("g").attr("class", "vl-box");

          // add animation
          this.fadeInTransition(nodeGs);
        },
        (update) => update,
        (exit) => {
          this.fadeOutTransition(exit);
        }
      );
    linkTopG
      .selectChildren("g")
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
          // add relationship border
          // linkGs
          //   .append("rect")
          //   .attr("class", "relationship-border")
          //   .attr("width", this.defaltDomConfig.ttWidth)
          //   .attr("height", this.defaltDomConfig.ttHeight)
          //   .style("fill", "#fff")
          //   .attr("stroke", this.defaltDomConfig.bgCircleStroke)
          //   .attr("stroke-width", this.defaltDomConfig.bgCircleWidth);
          // change style according to relType
          linkGs.each(function (d) {
            const relType = d.relType;
            const linkG = d3.select(this);
            switch (relType) {
              case "specialization":
              case "generalization":
                // append path for drawing angle in tick function directly
                linkG
                  .append("path")
                  .attr("class", "line angle-line")
                  .attr("fill", "#ddd");
                break;
              case "sameLevel":
                linkG
                  .append("line")
                  .attr("class", "line base-line")
                  .attr("stroke", "#aaa")
                  .attr("stroke-opacity", 0.6)
                  .attr("stroke-width", 5);
                // add transparent line, make hover easier
                linkG
                  .append("line")
                  .attr("class", "line base-line")
                  .attr("stroke", "#aaa")
                  .attr("stroke-opacity", 0)
                  .attr("stroke-width", 10);
                break;
              default:
                linkG
                  .append("line")
                  .attr("class", "line base-line")
                  .attr("stroke", "#aaa")
                  .attr("stroke-opacity", 0.6)
                  .attr("stroke-width", 5)
                  .style("stroke-dasharray", "10 5");
                // add transparent line, make hover easier
                linkG
                  .append("line")
                  .attr("class", "line base-line")
                  .attr("stroke", "#aaa")
                  .attr("stroke-opacity", 0)
                  .attr("stroke-width", 20);
            }
          });

          linkGs
            .on("mouseover", (e, d) => {
              if (d.relationship && d.relationship !== "") {
                this.tooltip.text(d.relationship);

                this.tooltip.style("display", null);
                this.fadeInTransition(this.tooltip);

                // // Calculate the height of the text
              }
            })
            .on("mousemove", (e, d) => {
              const [x, y] = d3.pointer(e, this.svgContainer.node().parentNode);

              this.tooltip
                .style("left", `${x + this.defaltDomConfig.ttGap}px`)
                .style("top", `${y + this.defaltDomConfig.ttGap}px`);
            })
            .on("mouseout", () => {
              this.fadeOutTransition(this.tooltip, "hide");
            });
          // add animation
          this.fadeInTransition(linkGs);
        },
        (update) => update,
        (exit) => {
          this.fadeOutTransition(exit);
        }
      );
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

  /* show vega-lite graph within topG */
  drawVl(
    topG,
    {
      vlWidth = 150,
      vlHeight = 150,
      borderWidthOffset = 8,
      borderHeightOffset = 8,
      vlIconSize = this.defaltDomConfig.vlIconSize,
      vlIconGap = this.defaltDomConfig.vlIconGap,
    } = {}
  ) {
    const vlContainer = topG.selectChild(".vl-container");
    const vlBox = vlContainer.selectChild(".vl-body").selectChild(".vl-box");

    // create new config data
    let configData = {
      view: null,
      border: null,
      img: null,
    };
    const data = topG.datum();
    data.vlConfig = configData;
    // create new vega-lite svg
    const vlSpec = JSON.parse(data["vegaLite"]);
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
      // vlContainer
      //   .selectChild(".header")
      //   .selectChild(".vl-icon.close")
      //   .style(
      //     "transform",
      //     `translate(${-borderWidth + vlIconGap}px,${
      //       vlIconSize + 2 * vlIconGap
      //     }px)`
      //   );
      vlContainer
        .selectChild(".header")
        .style(
          "transform",
          `translate(${borderWidth}px,${-vlIconSize - vlIconGap}px)`
        );

      // add animation
      this.vlInTransition(vlContainer, borderWidth, borderHeight);
      this.refreshSimNodes();
    });
  }
  // belows are small utils functions

  // compute R of certain layer
  getLayerR(
    layer,
    { baseRadius = this.defaltForceConfig.baseRadius, a = 1000 } = {}
  ) {
    return baseRadius * Math.pow(layer, 1.3);
    // return baseRadius * layer;
  }

  // toggle data.hasPinned of one node
  togglePin(data, vlContainer) {
    // change pinned state
    data.hasPinned = !data.hasPinned;
    vlContainer.classed("has-pinned", data.hasPinned);
    // change position status of node data
    this.resetFixedNode(data);
  }

  // reset fixed status of node data, base on .hasPinned
  resetFixedNode(data) {
    if (data.hasPinned) {
      data.fx = data.x;
      data.fy = data.y;
    } else {
      data.fx = null;
      data.fy = null;
    }
  }
  // refresh force parameter
  refreshSimNodes() {
    this.simulation.nodes(this.nodeData);
    this.simulation.alpha(0.8).restart();
  }
  // specific transition for vega-lite graph - in
  vlInTransition(vlContainer, width, height, duration = this.durationTime) {
    vlContainer
      .selectChild(".vl-body")
      .selectChildren(".border")
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
      .style("opacity", 1);
  }
  // specific transition for vega-lite graph - out
  vlOutTransition(vlContainer, width, height, duration = this.durationTime) {
    vlContainer
      .selectChild(".vl-body")
      .selectChildren(".border")
      .transition()
      .duration(duration + 150)
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("width", 0)
      .attr("height", 0);

    vlContainer
      .transition()
      .duration(duration)
      .style("opacity", 0)
      .on("end", function () {
        vlContainer.style("display", "none");
      });
  }

  // apply fade-in transition to a selection
  fadeInTransition(selection, opacity = 1, duration = this.durationTime) {
    selection.transition().duration(duration).style("opacity", opacity);
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
      .style("opacity", 0)
      .on("end", function () {
        if (endAction === "remove") {
          d3.select(this).remove();
        } else if (endAction === "hide") {
          d3.select(this).style("display", "none");
        }
      });
  }

  // 'freeze' the graph
  setFreezeMode(focusId = -1) {
    this.hasFreeze = true;
    // change style of svg
    this.svgContainer.classed("shadowed", true);
    // set style of focused node in freeze mode
    if (focusId !== -1) {
      this.freezeFocusId = focusId;
      const focusNode = this.svgContainer
        .selectChild(".topg-node")
        .selectChildren("g")
        .filter((d) => d.id === focusId)
        .classed("freeze-focus", true);
    }

    // stop the simulation
    this.simulation.stop();
  }

  // 'unfreeze' the graph
  resetFreezeMode() {
    this.hasFreeze = false;
    if (this.freezeFocusId !== -1) {
      this.svgContainer
        .selectChild(".topg-node")
        .selectChildren("g")
        .filter((d) => d.id === this.freezeFocusId)
        .classed("freeze-focus", false);
      this.freezeFocusId = -1;
    }
    // change style of svg
    this.svgContainer.classed("shadowed", false);
    this.simulation.restart();
  }
}

export { ForceGraph };
