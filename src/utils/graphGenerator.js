/* generate a force svg graph */
class ForceGraph {
  constructor(containerId, nodeData, linkData) {
    // viewbox of container svg
    this.containerViewWidth = 1920;
    this.containerViewHeight = 1080;
    // node & link data for controling force graph
    this.nodeData = nodeData;
    this.linkData = linkData;
    this.svgContainer = this.setSvgContainer(containerId);
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
      rIncrease: 100,
    };
    this.durationTime = 150;
    // create id map for nodes & links data
    this.nodeIdMap = new Map();
    this.linkIdMap = new Map();
    nodeData.forEach((node) => {
      this.nodeIdMap.set(node.id, node);
    });
    linkData.forEach((link) => {
      this.linkIdMap.set(`${link.source}_${link.target}`, link);
    });
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
    // freeze the 'zero' node
    const zeroData = this.nodeIdMap.get(0);
    zeroData.fx = this.containerViewWidth / 2;
    zeroData.fy = this.containerViewHeight / 2;
    // processing
    const config = { ...this.defaltConfig, ...options };
    const nodeTopG = this.createNodeGElement();
    const linkTopG = this.createLinkGElement();
    const nodeGs = nodeTopG.selectChildren("g");
    const linkGs = linkTopG.selectChildren("g");

    const tick = function () {
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
    this.creatRealDom(nodeGs, linkGs);
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

  /* create all 'real' svg elements,
   * e.g. circle for nodes, line for links */
  creatRealDom(nodeGs, linkGs) {
    const lineGroup = linkGs
      .append("line")
      .attr("class", "base-line")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1);
    const circleGroup = nodeGs
      .append("circle")
      .attr("class", "base-circle")
      .attr("r", 10)
      .attr("fill", "#aaa");
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

  /* create virtual g_element for each node & bind them to data
   * return top g_element of g_groups*/
  createNodeGElement({ durationTime = this.durationTime } = {}) {
    const data = this.nodeData;
    const svgContainer = this.svgContainer;
    const nodeTopG = svgContainer.append("g").attr("class", "topg-node");
    nodeTopG
      .selectAll("g")
      .data(data, (d) => d.id)
      .join((enter) =>
        enter
          .append("g")
          .attr("opacity", 0)
          .transition()
          .duration(durationTime)
          .attr("opacity", 1)
      );
    return nodeTopG;
  }
  /* create virtual g_element for each link & bind them to data
   * return top g_element of g_groups */
  createLinkGElement({ durationTime = this.durationTime } = {}) {
    const data = this.linkData;
    const svgContainer = this.svgContainer;
    const linkTopG = svgContainer.append("g").attr("class", "topg-link");
    linkTopG
      .selectAll("g")
      .data(data, (d) => {
        if (typeof d.source === "object") {
          return `${d.source.id}_${d.target.id}`;
        } else {
          return `${d.source}_${d.target}`;
        }
      })
      .join((enter) =>
        enter
          .append("g")
          .attr("opacity", 0)
          .transition()
          .duration(durationTime)
          .attr("opacity", 1)
      );
    return linkTopG;
  }
}

export { ForceGraph };
